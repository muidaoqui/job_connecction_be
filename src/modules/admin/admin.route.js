import express from "express";
import { getUsers } from "./admin.controller.js";
import { verifyAdmin } from "../auth/auth.middleware.js";
import { verifyToken } from "../auth/auth.middleware.js";
import { getUserDetail } from "./admin.controller.js";
import { toggleUserStatus } from "./admin.controller.js";
import { getJobs } from "./admin.controller.js";
import { approveJob } from "./admin.controller.js";
import { rejectJob } from "./admin.controller.js";
import { getPendingRecruitersController } from "./admin.controller.js";
import { approveRecruiterController } from "./admin.controller.js";
import { rejectRecruiterController } from "./admin.controller.js";
import { verifyRecruiter } from "./admin.controller.js";
import { uploadRecruiterVerification } from "../../../uploads/verification/uploadRecruiterVerification.js";
import { getRecruiterByUserIdController } from "./admin.controller.js";
const adminRouter = express.Router();

adminRouter.get("/users", verifyAdmin, getUsers);

adminRouter.get("/users/:id", verifyAdmin, getUserDetail);

adminRouter.patch("/users/:id/toggle-status", verifyAdmin, toggleUserStatus);
// Lấy danh sách job chờ duyệt
adminRouter.get("/jobs", verifyAdmin, getJobs);

// Duyệt job
adminRouter.put("/jobs/:jobId/approve", verifyAdmin, approveJob);

// Từ chối job
adminRouter.put("/jobs/:jobId/reject", verifyAdmin, rejectJob);

adminRouter.post(
  "/verify/:userId",
  uploadRecruiterVerification,
  verifyRecruiter
);

adminRouter.get(
  "/recruiters/pending",
  verifyAdmin,
  getPendingRecruitersController
);

adminRouter.patch(
  "/recruiter/approve/:id",
  verifyAdmin,
  approveRecruiterController
);

adminRouter.patch(
  "/recruiter/reject/:id",
  verifyAdmin,
  rejectRecruiterController
);
export default adminRouter;

adminRouter.get(
  "/recruiter/:userId",
  verifyToken,
  getRecruiterByUserIdController
);
