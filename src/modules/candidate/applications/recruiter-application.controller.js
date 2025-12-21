import Application from "../../job/application.model.js";
import Job from "../../job/job.model.js";
import Recruiter from "../../recruiter/recruiter.model.js";

// Lấy toàn bộ đơn của recruiter
export const getAllApplicationsByRecruiter = async (req, res) => {
  try {
    // kiểm tra quyền: req.user phải là recruiter
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    // companyId có thể lưu trong req.user.companyId hoặc yêu cầu param
    const companyId = req.user.companyId || req.params.companyId;
    if (!companyId) return res.status(400).json({ message: 'companyId missing' });

    // lấy tất cả job id của company
    const jobs = await Job.find({ company: mongoose.Types.ObjectId(companyId) }).select('_id');
    const jobIds = jobs.map((j) => j._id);

    // tìm applications thuộc jobIds
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('userId')   // populate candidate info
      .populate('jobId')    // populate job info
      .sort({ appliedDate: -1 });

    return res.json({ apps: applications }); // phù hợp với frontend hiện tại
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Cập nhật trạng thái
export const updateApplicationStatusByRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updated = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      application: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
