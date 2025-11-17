import express from "express";
import {
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getApplicants,
  updateApplicationStatus,
} from "./job.controller.js";

const router = express.Router();

// CRUD Job
router.post("/", createJob);
router.get("/", getAllJobs);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

// Applicants
router.get("/:id/applicants", getApplicants);
router.put("/applications/:id/status", updateApplicationStatus);

export default router;
