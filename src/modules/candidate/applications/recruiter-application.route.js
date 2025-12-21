import express from "express";
import {
  updateApplicationStatusByRecruiter,
  getAllApplicationsByRecruiter
} from "./recruiter-application.controller.js";
import { verifyToken, verifyRecruiter } from "../../auth/auth.middleware.js";

const router = express.Router();

// Xem tất cả ứng viên ứng tuyển theo recruiter
router.get("/all/:recruiterId", getAllApplicationsByRecruiter);
router.get(
  "/applications",
  verifyToken,
  verifyRecruiter,
  getAllApplicationsByRecruiter
);

// Duyệt hoặc từ chối đơn ứng tuyển
router.put("/:id/status", updateApplicationStatusByRecruiter);

export default router;
