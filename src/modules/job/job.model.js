import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    salary: { type: String },
    location: { type: String },
    jobType: { type: String },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    saveCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },

  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
