import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  position: String,
});

export default mongoose.model("Recruiter", recruiterSchema);