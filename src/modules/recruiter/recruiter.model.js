import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String, required: true },
    workEmail: { type: String, required: true },
    bio: { type: String },
    avatar: { type: String }, // lưu URL ảnh
  },
  { timestamps: true }
);

export default mongoose.model("Recruiter", recruiterSchema);
