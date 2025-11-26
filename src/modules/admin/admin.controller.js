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

export const getUserDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const userData = await adminService.getUserById(id);
    res.status(200).json(userData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await adminService.toggleUserStatus(id);

    return res.status(200).json({
      message: "User status updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
