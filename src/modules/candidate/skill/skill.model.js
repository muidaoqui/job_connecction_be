import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skillName: { type: String, required: true },
  proficiency: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "beginner" },
  endorsements: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Skill", skillSchema);
