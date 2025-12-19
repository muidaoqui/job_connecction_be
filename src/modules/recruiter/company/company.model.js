import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    logo: {
      type: String, // URL logo
      default: "",
    },

    coverImage: {
      type: String, // URL cover
      default: "",
    },

    galleryImages: {
      type: [String], // URL
      default: [],
    },

    businessLicense: {
      type: String, // URL PDF
      default: "",
    },

    name: {
      type: String,
      required: true,
    },

    tagline: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    industry: {
      type: String,
      required: true,
    },

    techs: {
      type: [String],
      required: true,
    },

    size: {
      type: String,
      required: true,
    },

    website: {
      type: String,
      default: "",
    },

    socialLinks: {
      type: [String],   // FE gửi đúng format này
      default: [],
    },

    description: {
      type: String,
      required: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
