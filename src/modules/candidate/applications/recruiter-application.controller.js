import Application from "../../job/application.model.js";
import Job from "../../job/job.model.js";

// Nhà tuyển dụng xem các ứng viên đã nộp vào job của họ
export const getApplicantsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ jobId })
      .populate("userId", "name email")
      .populate("jobId", "title");

    res.status(200).json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Nhà tuyển dụng duyệt hoặc từ chối
export const updateApplicationStatusByRecruiter = async (req, res) => {
  try {
    const { id } = req.params; // id đơn ứng tuyển
    const { status } = req.body; // accepted | rejected

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be accepted or rejected",
      });
    }

    const updatedApp = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      application: updatedApp,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Lấy tất cả đơn ứng tuyển thuộc các job của recruiter
export const getAllApplicationsByRecruiter = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    // Tìm tất cả job của recruiter
    const jobs = await Job.find({ recruiterId }).select("_id");

    // Tìm tất cả application thuộc các job này
    const apps = await Application.find({
      jobId: { $in: jobs.map((j) => j._id) }
    })
      .populate("userId", "name email")
      .populate("jobId", "title");

    res.status(200).json({ success: true, apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};