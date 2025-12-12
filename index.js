import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import authRoutes from "./src/modules/auth/auth.route.js";
import adminRoutes from "./src/modules/admin/admin.route.js";
import jobRoutes from "./src/modules/job/job.route.js";
import candidateRoutes from "./src/modules/candidate/candidate.route.js";
import { verifyToken } from "./src/modules/auth/auth.middleware.js";
import Resume from "./src/modules/candidate/resume.model.js";
import recruiterAppRoutes from "./src/modules/candidate/applications/recruiter-application.route.js";
import recruiterRoutes from "./src/modules/recruiter/recruiter.route.js";
import { fileURLToPath } from "url";
import companyRoutes from "./src/modules/recruiter/company/company.route.js";
import embeddingRoutes from "./src/modules/embedding/embedding.route.js";
import readCVRouter from "./src/modules/candidate/readCV.route.js";

// Đường dẫn tuyệt đối của thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("🔥 Loaded recruiterRoutes from:", recruiterRoutes);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "resumes");
const avatarsDir = path.join(process.cwd(), "uploads", "avatars");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/resumes directory");
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log("✅ Created uploads/avatars directory");
}

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Public static serving for avatars & other uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/uploads/resumes/:filename", verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;

    const resume = await Resume.findOne({ filename, userId });

    if (!resume) {
      console.log(
        `❌ Unauthorized access attempt: user ${userId} tried to access ${filename}`
      );
      return res.status(403).json({ message: "Access denied" });
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error serving resume:", error);
    res.status(500).json({ message: "Error serving file" });
  }
});
// ROUTES CHÍNH
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/company", companyRoutes);

// ROUTE HỒ SƠ RECRUITER (QUAN TRỌNG)
app.use("/api/recruiter", recruiterRoutes);

// ROUTE ỨNG TUYỂN RECRUITER
app.use("/api/recruiter/applications", recruiterAppRoutes);

// STATIC
app.use("/uploads", express.static("uploads"));

app.use("/api/embeddings", embeddingRoutes);
app.use("/api/read-cv", readCVRouter);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

mongoose.connection.on("connected", () => {
  console.log("👉 Connected to DB:", mongoose.connection.name);
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

export default app;
