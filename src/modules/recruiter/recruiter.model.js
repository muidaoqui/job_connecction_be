import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    // Hồ sơ nhà tuyển dụng
    fullName: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String, required: true },
    workEmail: { type: String, required: true },
    bio: { type: String, default: "" },

    followers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Recruiter", recruiterSchema);
