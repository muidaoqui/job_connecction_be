import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ================= ROUTES ================= */
import authRoutes from "./src/modules/auth/auth.route.js";
import adminRoutes from "./src/modules/admin/admin.route.js";
import jobRoutes from "./src/modules/job/job.route.js";
import candidateRoutes from "./src/modules/candidate/candidate.route.js";
import recruiterRoutes from "./src/modules/recruiter/recruiter.route.js";
import recruiterAppRoutes from "./src/modules/candidate/applications/recruiter-application.route.js";
import companyRoutes from "./src/modules/recruiter/company/company.route.js";
import embeddingRoutes from "./src/modules/embedding/embedding.route.js";
// import LLMRoute from "./src/modules/LLM/llm.route.js";
// import ragRouters from "./src/modules/RAG/rag.route.js";
// Đường dẫn tuyệt đối của thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("🔥 Loaded recruiterRoutes from:", recruiterRoutes);

/* ================= MIDDLEWARE / MODELS ================= */
import { verifyToken } from "./src/modules/auth/auth.middleware.js";
import Resume from "./src/modules/candidate/resume.model.js";

/* ================= INIT ================= */
dotenv.config();

console.log("🔎 ENV CHECK:");
console.log("CLIENT_URL =", process.env.CLIENT_URL);
console.log("PORT =", process.env.PORT);
console.log("NODE_ENV =", process.env.NODE_ENV);

const app = express();
const PORT = process.env.PORT || 8080;
app.use("/uploads", express.static("uploads"));

/* ================= ENSURE UPLOAD DIRS ================= */
const uploadsDir = path.join(process.cwd(), "uploads");
const resumesDir = path.join(uploadsDir, "resumes");
const avatarsDir = path.join(uploadsDir, "avatars");

[uploadsDir, resumesDir, avatarsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir}`);
  }
});

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(helmet());

/* ================= CORS DEBUG ================= */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

console.log("✅ Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🌐 Incoming request origin:", origin);

      // Cho phép Postman / server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ BLOCKED BY CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

/* ================= STATIC FILES ================= */
// Public avatars
app.use(
  "/uploads/avatars",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads/avatars"))
);

// Allow cross-origin resource load
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

/* ================= PROTECTED RESUME DOWNLOAD ================= */
app.use(
  "/uploads/resumes",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads/resumes"))
);

/* ================= API ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/company", companyRoutes);

// Recruiter
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/recruiter/applications", recruiterAppRoutes);

// AI / Search
app.use("/api/embeddings", embeddingRoutes);
// app.use("/api/rags", ragRouters);
// app.use("/api/llm", LLMRoute);

// KẾT NỐI MONGO DB
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

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* ================= 404 ================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

mongoose.connection.on("connected", () => {
  console.log("👉 Connected DB:", mongoose.connection.name);
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
