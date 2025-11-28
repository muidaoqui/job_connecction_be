import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    position: String,
    followers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Recruiter", recruiterSchema);
