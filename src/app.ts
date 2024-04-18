import express from "express";
import dotenv from "dotenv";
import validator from "validator";
import cors from "cors";
dotenv.config();
import "../db/connection";
import { UserModel } from "../db/model/userModel";
import {
  generateOtp,
  makeHashText,
  nodemailerTransport,
  verifyOtpOrPassword,
  generateJwtToken,
} from "./constants";
import { VerificationTokenModel } from "../db/model/verificationEmail";

const app: express.Application = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
const PORT = process.env.PORT || 8080;

app.post("/api/sign-up", async (req, res) => {
  try {
    const { first_name, last_name, password, confirm_password, email } =
      req.body;
    if (!first_name || !last_name || !password || !email || !confirm_password) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).send({
        message: "Please Enter a valid Email",
      });
    }
    const userAlreadyExists = await UserModel.findOne({ email });
    if (userAlreadyExists) {
      return res.status(400).send({
        message: "Email Already Exists !",
      });
    }
    if (!validator.isStrongPassword(password)) {
      return res.status(400).send({
        message:
          "Password Not Meet the criteria, it Must includes(password length 8 or more charaters, 1 uppercase letter, 1 special symbol)",
      });
    }
    if (password !== confirm_password) {
      return res.status(400).send({
        message: "Both Passwords should Match",
      });
    }
    const otp = generateOtp();

    const hashedPassword = await makeHashText(password);
    const hashedOtp = await makeHashText(otp);

    const user = new UserModel({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    const verificationToken = new VerificationTokenModel({
      user: user?._id,
      token: hashedOtp,
    });

    await verificationToken.save();
    const userDetails = await user.save();
    //sending otp

    await nodemailerTransport.sendMail({
      from: process.env.USER_NAME_SMTP,
      to: userDetails.email,
      subject: "Verification of Your Email Account",
      html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Email Verification</a>
        </div>
        <p style="font-size:1.1em">Hi, ${userDetails?.first_name}</p>
        <p>Use the following OTP to complete your Sign Up procedures. OTP is valid for 10 minutes</p>
        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
        <p style="font-size:0.9em;">Regards,<br />Vinay Kumar Kodam</p>
        <hr style="border:none;border-top:1px solid #eee" />
      </div>
    </div>`,
    });

    const sendDetails = {
      _id: userDetails?._id,
      first_name: userDetails?.first_name,
      last_name: userDetails?.last_name,
      verified: userDetails?.verified,
    };
    res
      .status(200)
      .send({ userDetails: sendDetails, message: "OTP sent Successfully" });
  } catch (error) {
    res.status(400).send({
      message: "Something error occured",
    });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { user, otp } = req.body;

    if (!user || !otp.trim()) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }

    const checkUserExist = await UserModel.findOne({
      _id: user,
    });

    if (!checkUserExist) {
      return res.status(400).send({
        message: "User Not Exists",
      });
    }
    if (checkUserExist.verified) {
      return res.status(400).send({
        message: "User Already Verified",
      });
    }

    const findUserExistsOtp = await VerificationTokenModel.findOne({ user });

    if (!findUserExistsOtp) {
      return res.status(400).send({
        message: "User Not Exist",
      });
    }

    const result = await verifyOtpOrPassword(findUserExistsOtp?.token, otp);
    if (!result) {
      return res.status(400).send({
        message: "Otp is invalid",
      });
    }

    checkUserExist.verified = true;

    //deleting otp from db
    await VerificationTokenModel.findByIdAndDelete(findUserExistsOtp?._id);
    const userDetails = await checkUserExist.save();
    const details = {
      first_name: userDetails?.first_name,
      last_name: userDetails?.last_name,
      verified: userDetails?.verified,
    };
    const jwtToken = await generateJwtToken(details);
    const sendDetails = {
      first_name: userDetails?.first_name,
      last_name: userDetails?.last_name,
      verified: userDetails?.verified,
      jwtToken,
    };
    res.status(200).send({ userDetails: sendDetails });
  } catch (error) {
    res.status(400).send({
      message: "Something error occured",
    });
  }
});

app.post("/api/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }
    const checkUserExist = await UserModel.findOne({ email });
    if (!checkUserExist) {
      return res.status(400).send({
        message: "User Not Exist",
      });
    }
    const isPasswordMatch = await verifyOtpOrPassword(
      checkUserExist?.password,
      password
    );
    if (!isPasswordMatch) {
      return res.status(400).send({
        message: "Password Not Match",
      });
    }

    if (checkUserExist.verified) {
      const details = {
        first_name: checkUserExist?.first_name,
        last_name: checkUserExist?.last_name,
        verified: checkUserExist?.verified,
      };
      const jwtToken = await generateJwtToken(details);
      const sendDetails = {
        first_name: checkUserExist?.first_name,
        last_name: checkUserExist?.last_name,
        verified: checkUserExist?.verified,
        jwtToken,
      };
      res.status(200).send({ userDetails: sendDetails });
    } else {
      const checkVerificationExists = await VerificationTokenModel.findOne({
        user: checkUserExist?._id,
      });

      if (checkVerificationExists) {
        return res.status(400).send({
          message: "Please wait 10 mins to make another otp Request",
        });
      } else {
        const otp = generateOtp();

        const hashedOtp = await makeHashText(otp);
        const verificationToken = new VerificationTokenModel({
          user: checkUserExist?._id,
          token: hashedOtp,
        });

        await verificationToken.save();

        await nodemailerTransport.sendMail({
          from: process.env.USER_NAME_SMTP,
          to: checkUserExist.email,
          subject: "Verification of Your Email Account",
          html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
          <div style="margin:50px auto;width:70%;padding:20px 0">
            <div style="border-bottom:1px solid #eee">
              <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Email Verification</a>
            </div>
            <p style="font-size:1.1em">Hi, ${checkUserExist?.first_name}</p>
            <p>Use the following OTP to complete your Sign Up procedures. OTP is valid for 10 minutes</p>
            <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
            <p style="font-size:0.9em;">Regards,<br />Vinay Kumar Kodam</p>
            <hr style="border:none;border-top:1px solid #eee" />
          </div>
        </div>`,
        });
        const sendDetails = {
          _id: checkUserExist?._id,
          first_name: checkUserExist?.first_name,
          last_name: checkUserExist?.last_name,
          verified: checkUserExist?.verified,
        };
        res
          .status(200)
          .send({ userDetails: sendDetails, message: "OTP sent Successfully" });
      }
    }
  } catch (error) {
    res.status(400).send({
      message: "Something error occured",
    });
  }
});

app.listen(PORT, () => {
  console.log(`server running at ${PORT}`);
});
