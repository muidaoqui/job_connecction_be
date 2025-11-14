import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    salary: { type: String },
    location: { type: String },
    jobType: { type: String }, // fulltime / parttime
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);