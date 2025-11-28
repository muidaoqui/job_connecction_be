import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isCurrentJob: { type: Boolean, default: false },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Experience", experienceSchema);
