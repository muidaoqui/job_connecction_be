import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["male", "female"] },
  address: String,
  resumePath: String,
  profileSummary: String,
});

export default mongoose.model("Candidate", candidateSchema);