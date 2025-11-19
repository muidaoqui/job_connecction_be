import express from "express";
import { getUsers } from "./admin.controller.js";
import { verifyAdmin } from "../auth/auth.middleware.js";
const adminRouter = express.Router();

adminRouter.get("/users", verifyAdmin, getUsers);

export default adminRouter;
