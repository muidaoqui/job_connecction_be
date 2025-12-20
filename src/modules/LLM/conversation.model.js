import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["system", "user", "assistant"],
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },
  messages: [messageSchema],
  summary: {
    type: String,
    default: ""
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);
