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

    req.user = user; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};
