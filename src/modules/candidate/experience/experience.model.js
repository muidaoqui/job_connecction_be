import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    description: String,
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Experience", experienceSchema);
