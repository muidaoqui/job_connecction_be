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

export const getJobs = async (req, res) => {
  try {
    const jobs = await adminService.getJobsService();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await adminService.approveJobService(jobId);
    res.status(200).json({
      success: true,
      message: "Job approved successfully",
      data: job,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await adminService.rejectJobService(jobId);
    res.status(200).json({
      success: true,
      message: "Job rejected successfully",
      data: job,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyRecruiter = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("recruiter id:  ", userId);
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);

    const recruiter = await adminService.submitRecruiterVerification({
      userId,
      body: req.body,
      files: req.files,
    });

    res.status(200).json({
      message: "Gửi yêu cầu xác thực thành công",
      data: recruiter,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error.message || "Gửi yêu cầu xác thực thất bại",
    });
  }
};

export const getPendingRecruitersController = async (req, res) => {
  try {
    const list = await adminService.getPendingRecruiters();
    res.json(list);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveRecruiterController = async (req, res) => {
  try {
    const result = await adminService.approveRecruiter(req.params.id);
    res.json({ message: "Approved successfully", data: result });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectRecruiterController = async (req, res) => {
  try {
    const result = await adminService.rejectRecruiter(
      req.params.id,
      req.body.reason
    );
    res.json({ message: "Rejected successfully", data: result });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecruiterByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;

    const recruiter = await adminService.getRecruiterByUserId(userId);

    res.status(200).json(recruiter);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error.message || "Không thể lấy trạng thái recruiter",
    });
  }
};
