// recruiter.model.js
import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 1 user chỉ có 1 recruiter profile
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    name: String,
    position: String,
    phone: String,
    workEmail: String,
    bio: String,
    avatar: String,
  },
  { timestamps: true }
);

export default mongoose.model("Recruiter", recruiterSchema);
