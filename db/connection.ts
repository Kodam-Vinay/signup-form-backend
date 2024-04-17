import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { MONGO_URL } from "../src/constants";

const URL: string = MONGO_URL.replace(
  "user:pass",
  process.env.USER_NAME + ":" + process.env.PASSWORD
);

mongoose
  .connect(URL)
  .then(() => console.log("connected"))
  .catch((err) => console.log("connection failed due to " + err.message));
