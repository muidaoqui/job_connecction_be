import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    industry: { type: String },
    size: { type: String }, // e.g., "1000-5000"
    country: { type: String },
    website: { type: String },
    logo: { type: String }, // URL to logo image
    description: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
