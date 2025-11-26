import express from "express";
import {
  getRecruiterByUserId,
  getAllRecruiters,
  createRecruiterProfile,
  updateRecruiterProfile,
  followRecruiter,
  unfollowRecruiter,
  getRecruiterStats,
  getTopRecruiters,
} from "./recruiter.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";

const router = express.Router();

// Public routes
// Get all recruiters with pagination
router.get("/", getAllRecruiters);

// Get top recruiters by followers
router.get("/top", getTopRecruiters);

// Get recruiter by ID
router.get("/:id", getRecruiterByUserId);

// Get recruiter stats
router.get("/:id/stats", getRecruiterStats);

// Protected routes (require authentication)
// Create recruiter profile
router.post("/", verifyToken, createRecruiterProfile);

// Update recruiter profile
router.put("/:id", verifyToken, updateRecruiterProfile);

// Follow a recruiter
router.post("/:id/follow", verifyToken, followRecruiter);

// Unfollow a recruiter
router.post("/:id/unfollow", verifyToken, unfollowRecruiter);

export default router;
