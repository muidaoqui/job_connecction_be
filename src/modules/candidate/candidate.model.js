import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["male", "female"] },
  address: String,
  resumePath: String,
  mainResumePath: String,
  profileSummary: String,
  avatarUrl: String,
  embedding: {
    type: [Number],
    default: undefined,
  },
  embeddingText: {
    type: String,
  },
  embeddingUpdatedAt: {
    type: Date,
  },
  embeddingDimensions: {
    type: Number,
  },
    
});

export default mongoose.model("Candidate", candidateSchema);