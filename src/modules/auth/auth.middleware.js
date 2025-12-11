import jwt from "jsonwebtoken";
import User from "./auth.model.js";

// =============================
// 1) Middleware verifyToken
// =============================
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token hoặc token không hợp lệ" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded._id) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

<<<<<<< HEAD
    // Đảm bảo req.user.id tồn tại (dùng _id từ MongoDB hoặc decoded.id)
    req.user = { 
      id: user._id.toString(), // hoặc decoded.id
      email: user.email,
      role: user.role,
      ...user.toObject() 
    }; 
=======
    req.user = { _id: user._id, role: user.role, email: user.email };
>>>>>>> 932def8364816154c9e2ef6f12103420a2935051
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};

// =============================
// 2) Middleware authorizeRoles
// =============================
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Người dùng chưa xác thực" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    next();
  };
};

// =============================
// 3) Middleware verifyAdmin
// =============================
export const verifyAdmin = async (req, res, next) => {
  try {
    console.log("🔐 JWT_SECRET:", process.env.JWT_SECRET);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token xác thực" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Received token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token _id:", decoded._id);

    const user = await User.findById(decoded._id);
    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("❌ Lỗi xác thực admin:", error);
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
