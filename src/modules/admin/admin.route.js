import express from "express";
import { getUsers } from "./admin.controller.js";
import { verifyAdmin } from "../auth/auth.middleware.js";
import { getUserDetail } from "./admin.controller.js";
const adminRouter = express.Router();

adminRouter.get("/users", verifyAdmin, getUsers);
adminRouter.get("/users/:id", verifyAdmin, getUserDetail);

export default adminRouter;
