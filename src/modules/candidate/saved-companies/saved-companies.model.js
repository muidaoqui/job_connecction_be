import mongoose from "mongoose";

const savedCompanySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    savedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SavedCompany", savedCompanySchema);