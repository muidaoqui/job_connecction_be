import express from "express";
import { readPDF } from "./readCV.controller.js";

const router = express.Router();

router.post("/read-pdf", readPDF);

export default router;