import express from "express";
import {
  createOrUpdateCompany,
  getCompanyByUser,
} from "./company.controller.js";

import { verifyToken } from "../../auth/auth.middleware.js";
import upload from "./uploadCompany.js";
import { getCompanyList } from "./company.controller.js";
import { getCompanyById } from "./company.controller.js";
import { followCompany, unfollowCompany, getFollowingCompanies } from "./company.controller.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log("🔥 COMPANY ROUTE HIT:", req.method, req.originalUrl);
  next();
});


// Upload fields
const uploadFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "galleryImages", maxCount: 10 },
]);

// Lưu / cập nhật
router.post("/profile", verifyToken, uploadFields, createOrUpdateCompany);

router.post("/:id/follow", verifyToken, followCompany);
router.post("/:id/unfollow", verifyToken, unfollowCompany);
router.get("/following", verifyToken, getFollowingCompanies);


// LẤY COMPANY THEO ID
router.get("/:id", getCompanyById);

// LIST
router.get("/", getCompanyList);

export default router;
