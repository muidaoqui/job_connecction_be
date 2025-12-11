import crypto from "crypto";
import User from "./auth.model.js";
import sendEmail from "../../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Role } from "../../common/enum/role.js";


// ============================
// 🔥 Tạo JWT chuẩn nhất
// ============================
const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};


// ============================
// 🔥 Gửi OTP
// ============================
export const sendOtpController = async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        password: "temp",
        role: "candidate",
      });
    }

    // tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail(email, "OTP xác thực", `Mã OTP của bạn: ${otp}`);

    res.json({ message: "Đã gửi OTP" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Lỗi gửi OTP" });
  }
};


// ============================
// 🔥 Xác thực OTP
// ============================
export const verifyOtpController = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tồn tại user" });

    if (user.otpCode !== otp)
      return res.status(400).json({ message: "OTP sai" });

    if (user.otpExpire < Date.now())
      return res.status(400).json({ message: "OTP hết hạn" });

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.json({ message: "Xác thực email thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ============================
// 🔥 Đăng ký chuẩn
// ============================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });

    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000;

    if (!user) {
      // tạo user mới
      user = new User({
        name,
        email,
        password,
        role: role || "candidate",
        otpCode: otp,
        otpExpire,
      });
    } else {
      // update user cũ
      user.name = name;
      user.password = password;
      user.role = role || "candidate";
      user.otpCode = otp;
      user.otpExpire = otpExpire;
    }

    await user.save();

    await sendEmail(email, "Mã OTP đăng ký", `OTP của bạn: ${otp}`);

    res.json({
      message: "Đăng ký thành công, vui lòng xác thực email",
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};


// ============================
// 🔥 Đăng nhập chuẩn nhất
// ============================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (!user.password || user.password === "temp")
      return res.status(400).json({ message: "Chưa xác thực OTP" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu sai" });

    if (!user.emailVerified)
      return res.status(400).json({ message: "Chưa xác thực email" });

    const token = generateToken(user);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ============================
// 🔥 Quên mật khẩu
// ============================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy email" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendEmail(email, "Reset mật khẩu", resetUrl);

    res.json({ message: "Đã gửi email reset" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ============================
// 🔥 Reset password
// ============================
export const resetPassword = async (req, res) => {
  try {
    const token = req.query.token;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc hết hạn" });

    user.password = req.body.password;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
