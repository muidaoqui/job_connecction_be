import express from "express";
import {
  createOrUpdateCompany,
  getCompanyByUser,
} from "./company.controller.js";

import { verifyToken } from "../../auth/auth.middleware.js";
import upload from "./uploadCompany.js";
import { getCompanyList } from "./company.controller.js";
import { getCompanyById } from "./company.controller.js";

const router = express.Router();

// Upload fields
const uploadFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "galleryImages", maxCount: 10 },
]);

// Lưu / cập nhật
router.post("/profile", verifyToken, uploadFields, createOrUpdateCompany);

// Lấy profile
router.get("/profile", verifyToken, getCompanyByUser);
router.get("/", getCompanyList);
router.get("/:id", getCompanyById);
export default router;
