import express from "express";
import { getUsers } from "./admin.controller.js";
import { verifyAdmin } from "../auth/auth.middleware.js";
import { getUserDetail } from "./admin.controller.js";
import { toggleUserStatus } from "./admin.controller.js";
const adminRouter = express.Router();

adminRouter.get("/users", verifyAdmin, getUsers);
adminRouter.get("/users/:id", verifyAdmin, getUserDetail);
adminRouter.patch("/users/:id/toggle-status", verifyAdmin, toggleUserStatus);

export default adminRouter;
