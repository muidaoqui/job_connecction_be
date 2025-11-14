import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./src/modules/auth/auth.route.js";
import jobRoutes from "./src/modules/job/job.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
