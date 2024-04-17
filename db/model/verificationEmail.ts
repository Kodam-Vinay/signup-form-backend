import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 600,
    default: Date.now(),
  },
});
export const VerificationTokenModel = mongoose.model("Verification", schema);
