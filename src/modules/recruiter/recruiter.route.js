import express from "express";
import { getMyRecruiterProfile, saveMyRecruiterProfile, getRecruiterByCompany} from "./recruiter.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getApplicantsForRecruiter } from "./recruiter.controller.js";
import { getApplicantsByJob } from "../candidate/applications/job-application.controller.js";
import { authorizeRoles } from "../auth/auth.middleware.js";

// Tạo folder upload nếu chưa có
const avatarFolder = "uploads/avatars";
if (!fs.existsSync(avatarFolder)) {
  fs.mkdirSync(avatarFolder, { recursive: true });
}

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarFolder),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const router = express.Router();
// GET hồ sơ recruiter theo companyId
router.get("/", getRecruiterByCompany);
// GET hồ sơ recruiter
router.get("/profile/me", verifyToken, getMyRecruiterProfile);
router.get(
  "/applications",
  verifyToken,
  authorizeRoles("recruiter"),
  getApplicantsForRecruiter
);
router.get(
  "/applications/job/:jobId",
  verifyToken,
  getApplicantsByJob
);
// POST lưu hồ sơ recruiter
router.post("/profile/me", verifyToken, upload.single("avatar"), saveMyRecruiterProfile);

export default router;
