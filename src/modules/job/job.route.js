import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  updateApplicationStatus,
  saveJob,
  unsaveJob,
  getRecruiterStats,
  applyJob,
  searchJobs,
  getJobsByCompany
} from "./job.controller.js";

import { verifyToken } from "../auth/auth.middleware.js";
import Application from "../job/application.model.js";
import { uploadCV } from "./uploadCV.js";
import { getRecruiterDashboardStats } from "./job.controller.js";

const router = express.Router();

/* =========================================================
   APPLY JOB (PHẢI ĐỂ TRÊN /:id)
========================================================= */
router.post(
  "/:id/apply",
  verifyToken,
  uploadCV.single("cvFile"),
  applyJob
);

/* =========================================================
   APPLICATIONS (ADMIN / RECRUITER)
========================================================= */
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

/* =========================================================
   JOB CRUD
========================================================= */
router.post("/", verifyToken, createJob);
router.get("/", getAllJobs);

/* =========================================================
   SEARCH + STATS
========================================================= */
router.get("/search", searchJobs);
router.get("/stats/:id", getRecruiterStats);

/* =========================================================
   SAVE / UNSAVE JOB (PHẢI TRƯỚC /:id)
========================================================= */
router.post("/:id/save", verifyToken, saveJob);
router.post("/:id/unsave", verifyToken, unsaveJob);

/* =========================================================
   JOB BY COMPANY
========================================================= */
router.get("/company/:companyId", getJobsByCompany);
router.get(
  "/recruiter/stats",
  verifyToken,
  getRecruiterDashboardStats
);
/* =========================================================
   GET / UPDATE / DELETE JOB (ĐỂ SAU CÙNG)
========================================================= */
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
