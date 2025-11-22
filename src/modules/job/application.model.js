import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
    cvFile: { type: String }, // đường dẫn file PDF

    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("applications", applicationSchema);
