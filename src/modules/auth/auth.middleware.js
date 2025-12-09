import jwt from "jsonwebtoken";
import User from "./auth.model.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token hoặc token không hợp lệ" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Đảm bảo req.user.id tồn tại (dùng _id từ MongoDB hoặc decoded.id)
    req.user = { 
      id: user._id.toString(), // hoặc decoded.id
      email: user.email,
      role: user.role,
      ...user.toObject() 
    }; 
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};
