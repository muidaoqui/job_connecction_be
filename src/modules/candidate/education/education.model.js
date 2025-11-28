import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  school: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  grade: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Education", educationSchema);
