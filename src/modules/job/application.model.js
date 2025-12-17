import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Job",
      required: true 
    },

    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },

    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
    cvFile: { type: String },

    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);

export default Application;

