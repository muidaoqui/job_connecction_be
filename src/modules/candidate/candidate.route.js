import express from "express";
import multer from "multer";
import {
  getProfile,
  createProfile,
  updateProfile,
  uploadResume,
  setMainResume,
  listResumes,
  getApplications,
  withdrawApplication,
  getSavedJobs,
  checkSavedJob,
  unsaveJob,
  getViewedJobs,
  removeViewedJob,
} from "./candidate.controller.js";
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from "./experience/experience.controller.js";
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  endorseSkill,
} from "./skill/skill.controller.js";
import {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from "./education/education.controller.js";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "./project/project.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";

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

// Profile routes
// GET /api/candidate - Get user's profile
router.get("/", verifyToken, getProfile);
router.post("/", verifyToken, createProfile);
router.put("/", verifyToken, updateProfile);

// GET /api/candidate/resumes - List user's uploaded CVs (user-specific, filtered by userId)
router.get("/resumes", verifyToken, listResumes);

router.post("/upload", verifyToken, upload.single("resume"), uploadResume);
router.put("/main-resume", verifyToken, setMainResume);

// Experience routes
router.get("/experience", verifyToken, getExperiences);
router.post("/experience", verifyToken, createExperience);
router.put("/experience/:id", verifyToken, updateExperience);
router.delete("/experience/:id", verifyToken, deleteExperience);

// Skill routes
router.get("/skill", verifyToken, getSkills);
router.post("/skill", verifyToken, createSkill);
router.put("/skill/:id", verifyToken, updateSkill);
router.delete("/skill/:id", verifyToken, deleteSkill);
router.post("/skill/:id/endorse", verifyToken, endorseSkill);

// Education routes
router.get("/education", verifyToken, getEducations);
router.post("/education", verifyToken, createEducation);
router.put("/education/:id", verifyToken, updateEducation);
router.delete("/education/:id", verifyToken, deleteEducation);

// Project routes
router.get("/project", verifyToken, getProjects);
router.post("/project", verifyToken, createProject);
router.put("/project/:id", verifyToken, updateProject);
router.delete("/project/:id", verifyToken, deleteProject);

// Application routes
router.get("/applications", verifyToken, getApplications);
router.delete("/applications/:applicationId", verifyToken, withdrawApplication);

// Saved job routes
router.get("/saved-jobs", verifyToken, getSavedJobs);
router.get("/saved-jobs/check/:jobId", verifyToken, checkSavedJob);
router.delete("/saved-jobs/:savedJobId", verifyToken, unsaveJob);

// Job view routes
router.get("/viewed-jobs", verifyToken, getViewedJobs);
router.delete("/viewed-jobs/:jobViewId", verifyToken, removeViewedJob);

export default router;

