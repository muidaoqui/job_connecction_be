import express from "express";
import {
  getApplicantsByJob,
  updateApplicationStatusByRecruiter,
} from "./recruiter-application.controller.js";

const router = express.Router();

// Xem ứng viên ứng tuyển theo job
router.get("/job/:jobId", getApplicantsByJob);

// Duyệt hoặc từ chối đơn ứng tuyển
router.put("/:id/status", updateApplicationStatusByRecruiter);

export default router;
