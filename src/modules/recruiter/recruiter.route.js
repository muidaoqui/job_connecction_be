import express from "express";
import {
  getTopRecruiters,
  getRecruiterStats,
  followRecruiter,
  unfollowRecruiter,
  saveMyRecruiterProfile,
  getMyRecruiterProfile
} from "./recruiter.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";

const router = express.Router();

// PUBLIC
router.get("/top", getTopRecruiters);

// PROTECTED
router.get("/profile/me", verifyToken, getMyRecruiterProfile);
router.post("/profile/me", verifyToken, saveMyRecruiterProfile);

// FOLLOW
router.post("/:id/follow", verifyToken, followRecruiter);
router.post("/:id/unfollow", verifyToken, unfollowRecruiter);

// STATS
router.get("/:id/stats", verifyToken, getRecruiterStats);

export default router;
