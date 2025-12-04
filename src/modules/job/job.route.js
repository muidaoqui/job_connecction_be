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
} from "./job.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";
import { getRecruiterStats } from "./job.controller.js";
import { applyJob } from "./job.controller.js";
import { uploadCV } from "./uploadCV.js";
import Application from "./application.model.js";
import { searchJobs } from "./job.controller.js";

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
router.post("/:id/apply", verifyToken, uploadCV.single("resume"), applyJob);

// CRUD Job
router.post("/", verifyToken, createJob);
router.get("/", getAllJobs);
router.get("/stats/:id", getRecruiterStats);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
router.get("/search", searchJobs);

// Save/Unsave job for authenticated users (create SavedJob records and update saveCount)
router.post("/:id/save", verifyToken, saveJob);
router.post("/:id/unsave", verifyToken, unsaveJob);

export default router;
