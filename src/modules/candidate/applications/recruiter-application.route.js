import express from "express";
import {
  getApplicantsByJob,
  updateApplicationStatusByRecruiter,
  getAllApplicationsByRecruiter
} from "./recruiter-application.controller.js";

const router = express.Router();

// Xem tất cả ứng viên ứng tuyển theo recruiter
router.get("/all/:recruiterId", getAllApplicationsByRecruiter);

// Xem ứng viên ứng tuyển theo job
router.get("/job/:jobId", getApplicantsByJob);

// Duyệt hoặc từ chối đơn ứng tuyển
router.put("/:id/status", updateApplicationStatusByRecruiter);

export default router;
