import * as adminService from "./admin.service.js";

export const getUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      email: req.query.email,
    };

    const users = await adminService.getAllUsers(filters);
    res.status(200).json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
