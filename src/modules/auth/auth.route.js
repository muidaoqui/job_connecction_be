import express from "express";
import {
  sendOtpController,
  verifyOtpController,
  register,
  login,
  forgotPassword,
  resetPassword,
} from "./auth.controller.js";

const router = express.Router();

// Gửi OTP email
router.post("/email/send-otp", sendOtpController);

// Xác thực OTP
router.post("/email/verify-otp", verifyOtpController);

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Quên mật khẩu
router.post("/forgot-password", forgotPassword);

// Reset mật khẩu
router.post("/reset-password/:token", resetPassword);

export default router;
