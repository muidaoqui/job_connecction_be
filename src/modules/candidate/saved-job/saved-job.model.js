import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    savedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SavedJob", savedJobSchema);
