import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    industry: { type: String },
    size: { type: String }, // e.g., "1000-5000"
    country: { type: String },
    logo: { type: String }, // URL to logo image
    // Background hero image for company detail/header
    backgroundImage: { type: String },
    // Additional related images (gallery)
    images: [{ type: String }],
    description: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
