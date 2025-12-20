import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 1 user chỉ có 1 recruiter profile
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    // Hồ sơ recruiter
    fullName: String,
    position: String,
    phone: String,
    workEmail: String,
    bio: { type: String, default: "" },

    followers: { type: Number, default: 0 },

    // Trạng thái xác minh
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },

    verificationData: {
      businessLicense: String,
      idCardFront: String,
      idCardBack: String,

      companyName: String,
      taxCode: String,
      address: String,
      website: String,
      phone: String,

      note: String, // admin note
    },
  },
  { timestamps: true }
);

export default mongoose.model("Recruiter", recruiterSchema);
