import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: {
      type: String,
      enum: ["applied", "pending", "accepted", "rejected"],
      default: "applied",
    },
    appliedDate: { type: Date, default: Date.now },
    resumePath: String,
    coverLetter: String,
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
