import express from "express";
import { searchJobs, getJobById } from "./job.controller.js";

const router = express.Router();

router.get("/", searchJobs);
router.get("/:id", getJobById);

export default router;
