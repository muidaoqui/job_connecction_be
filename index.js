import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import authRoutes from "./src/modules/auth/auth.route.js";
import jobRoutes from "./src/modules/job/job.route.js";
import candidateRoutes from "./src/modules/candidate/candidate.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "resumes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/resumes directory");
}

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate", candidateRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
