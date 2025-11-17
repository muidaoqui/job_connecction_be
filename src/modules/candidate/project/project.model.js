import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectName: { type: String, required: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  skills: [String],
  projectUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Project", projectSchema);
