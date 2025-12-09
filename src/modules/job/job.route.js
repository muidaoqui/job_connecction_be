import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getApplicants,
  updateApplicationStatus,
  incrementSaveCount,
  decrementSaveCount,
  saveJob,
  unsaveJob,
  getRecruiterStats,
  applyJob,
  searchJobs
} from "./job.controller.js";

import { verifyToken } from "../auth/auth.middleware.js";
import Application from "./application.model.js";

import { uploadCvMiddleware } from "./uploadCV.js";

const router = express.Router();

// Applicants
router.get("/applications/all", async (req, res) => {
  try {
    const apps = await Application.find()
      .populate({ path: "jobId", strictPopulate: false })
      .populate({ path: "userId", strictPopulate: false });

    res.json({ success: true, apps });
  } catch (err) {
    console.error("Lỗi lấy ứng viên:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/applications/:id/status", updateApplicationStatus);

router.post("/:id/apply", uploadCvMiddleware, applyJob);

// CRUD Job
router.post("/", verifyToken, createJob);
router.get("/", getAllJobs);

router.get("/search", searchJobs);

router.get("/stats/:id", getRecruiterStats);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

// Save / Unsave Job
router.post("/:id/save", verifyToken, saveJob);
router.post("/:id/unsave", verifyToken, unsaveJob);

export default router;
