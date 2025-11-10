import crypto from "crypto";
import User from "./auth.model.js";
import sendEmail from "../../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Tạo token JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Gửi OTP
export const sendOtpController = async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, password: "temp", role: "candidate" });
    }

    // Tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();

    await sendEmail(email, "Mã xác thực tài khoản", `Mã OTP của bạn là: ${otp}`);

    res.status(200).json({ message: "Đã gửi mã OTP đến email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi gửi OTP" });
  }
};

// Xác thực OTP
export const verifyOtpController = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    if (user.otpCode !== otp) return res.status(400).json({ message: "Mã OTP sai" });
    if (user.otpExpire < Date.now()) return res.status(400).json({ message: "Mã OTP đã hết hạn" });

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ message: "Xác thực email thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng ký
export const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user && user.emailVerified) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    if (!user) {
      user = new User({ email, password, role: role || "candidate" });
    } else {
      user.password = password;
      user.role = role || "candidate";
    }

    await user.save();

    // Tạo OTP ngay sau khi register
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(email, "Mã xác thực tài khoản", `Mã OTP của bạn là: ${otp}`);

    res.status(201).json({
      message: "Đăng ký thành công, vui lòng xác thực email",
      user: { email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Nếu user chưa đặt password (tạo tạm "temp") → yêu cầu đổi mật khẩu hoặc OTP
    if (!user.password || user.password === "temp") {
      return res.status(400).json({ message: "Người dùng chưa đặt mật khẩu. Vui lòng xác thực OTP." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng" });

    // Nếu email chưa xác thực
    if (!user.emailVerified) {
      return res.status(400).json({ message: "Chưa xác thực email", needVerification: true });
    }

    // Tạo token
    const token = generateToken(user);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Quên mật khẩu
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tìm thấy email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, "Đặt lại mật khẩu", `Link reset: ${resetUrl}`);

    res.json({ message: "Email reset mật khẩu đã được gửi!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });

    user.password = req.body.password;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
