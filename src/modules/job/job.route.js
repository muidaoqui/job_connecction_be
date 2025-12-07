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
import { uploadCV } from "./uploadCV.js";
import Application from "./application.model.js";

const router = express.Router();

/* ---------------- APPLY JOB (LUÔN LUÔN ĐỂ TRÊN) ---------------- */
router.post(
  "/:jobId/apply",
  verifyToken,
  uploadCV.single("resume"),
  applyJob
);

/* ---------------- APPLICATION LIST ---------------- */
router.get("/applications/all", async (req, res) => {
  try {
    const apps = await Application.find()
      .populate({ path: "jobId", strictPopulate: false })
      .populate({ path: "userId", strictPopulate: false });
    res.json({ success: true, apps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/applications/:id/status", updateApplicationStatus);

/* ---------------- CRUD JOB ---------------- */
router.post("/", verifyToken, createJob);
router.get("/", getAllJobs);

router.get("/search", searchJobs);

router.get("/stats/:id", getRecruiterStats);
router.get("/search", searchJobs);

/* ---------------- SAVE / UNSAVE JOB (phải đặt TRÊN /:id) ---------------- */
router.post("/:id/save", verifyToken, saveJob);
router.post("/:id/unsave", verifyToken, unsaveJob);

/* ---------------- GET / UPDATE / DELETE JOB (PHẢI ĐỂ SAU CÙNG) ---------------- */
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
