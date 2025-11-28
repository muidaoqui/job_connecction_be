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
import recruiterRoutes from "./src/modules/recruiter/recruiter.route.js";
import companyRoutes from "./src/modules/recruiter/company.route.js";
import { verifyToken } from "./src/modules/auth/auth.middleware.js";
import Resume from "./src/modules/candidate/resume.model.js";
import recruiterAppRoutes from "./src/modules/candidate/applications/recruiter-application.route.js";
import companyRoutes from "./src/modules/recruiter/company/company.route.js";

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

// Protected route to serve resume files - verify ownership before serving
app.get("/uploads/resumes/:filename", verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    
    // Verify the resume belongs to the requesting user
    const resume = await Resume.findOne({ 
      filename, 
      userId 
    });
    
    if (!resume) {
      console.log(`❌ Unauthorized access attempt: user ${userId} tried to access ${filename}`);
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

// Other uploads can be served publicly if needed
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/recruiter/applications", recruiterAppRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/company", companyRoutes);

mongoose.connect(process.env.MONGO_URI, {
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

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
