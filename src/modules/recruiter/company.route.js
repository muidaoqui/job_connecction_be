import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  searchCompanies,
} from "./company.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";

const router = express.Router();

// Public routes
// Get all companies
router.get("/", getAllCompanies);

// Search companies
router.get("/search", searchCompanies);

// Get company by ID
router.get("/:id", getCompanyById);

// Protected routes (require authentication - only recruiters/admins can create/update/delete)
// Create company
router.post("/", verifyToken, createCompany);

// Update company
router.put("/:id", verifyToken, updateCompany);

// Delete company
router.delete("/:id", verifyToken, deleteCompany);

export default router;
