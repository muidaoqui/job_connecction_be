import express from "express";
import { translateController , summarizeController} from "./translate.controller.js";
const router = express.Router();

router.post("/", translateController);
router.post("/summarize", summarizeController);
export default router;