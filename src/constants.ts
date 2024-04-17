import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import { createTransport } from "nodemailer";
import jwt from "jsonwebtoken";

export const MONGO_URL: string =
  "mongodb+srv://user:pass@cluster2.w6jrxmi.mongodb.net/";

export const makeHashText = async (
  text: string
): Promise<string | undefined> => {
  if (!text) {
    return;
  }
  let hashedText = "";
  try {
    const generateSalt = await bcrypt.genSalt(7);
    hashedText = await bcrypt.hash(text, generateSalt);
  } catch (error) {
    console.log(error);
  }
  return hashedText;
};

export const generateOtp = (): string => {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    const randomVal = Math.round(Math.random() * 9);
    otp += randomVal;
  }
  return otp;
};

export const nodemailerTransport = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_NAME_SMTP,
    pass: process.env.PASSWORD_SMTP,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const verifyOtpOrPassword = async (
  bcryptedString: string,
  otp: string
): Promise<boolean> => {
  let result = false;
  try {
    result = await bcrypt.compare(otp.trim(), bcryptedString);
  } catch (error) {
    console.log(error);
  }
  return result;
};

export const generateJwtToken = async (
  userDetails: object
): Promise<String | undefined> => {
  let token = "";
  try {
    const secretKey: string | undefined = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      return;
    }
    token = jwt.sign(userDetails, secretKey);
  } catch (error) {
    console.log(error);
  }
  return token;
};
