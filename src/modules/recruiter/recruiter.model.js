// recruiter.model.js
import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  name: String,
  position: String,
  phone: String,
  workEmail: String,
  bio: String,
  avatar: String,

  // ✅ THÊM / ĐẢM BẢO FIELD NÀY
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null,
  },

}, { timestamps: true });

export default mongoose.model("Recruiter", recruiterSchema);
