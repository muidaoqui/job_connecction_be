import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Resume", resumeSchema);
