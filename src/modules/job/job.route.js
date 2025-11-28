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
} from "./job.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";
import { getRecruiterStats } from "./job.controller.js";
import { applyJob } from "./job.controller.js";
import { uploadCV } from "./uploadCV.js";
import Application from "./application.model.js";

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
router.post("/:id/apply", uploadCV, applyJob);

// CRUD Job
router.post("/", verifyToken, createJob);
router.get("/", getAllJobs);
router.get("/stats/:id", getRecruiterStats);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

// Save/Unsave job to track popularity (saveCount)
router.post("/:id/save", incrementSaveCount);
router.post("/:id/unsave", decrementSaveCount);

export default router;
