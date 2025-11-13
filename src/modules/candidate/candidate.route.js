import express from "express";
import multer from "multer";
import {
  getProfile,
  createProfile,
  updateProfile,
  uploadResume,
} from "./candidate.controller.js";
import { protect } from "../auth/auth.middleware.js"; // middleware xác thực JWT

const router = express.Router();

// Cấu hình nơi lưu file CV
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes/"); // thư mục lưu file
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Các route
router.get("/", protect, getProfile);
router.post("/", protect, createProfile);
router.put("/", protect, updateProfile);
router.post("/upload", protect, upload.single("resume"), uploadResume);

export default router;
