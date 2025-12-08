import Application from "../../job/application.model.js";
import Job from "../../job/job.model.js";

// Lấy toàn bộ đơn của recruiter
export const getAllApplicationsByRecruiter = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    const jobs = await Job.find({ recruiterId }).select("_id");
    const jobIds = jobs.map(j => j._id);

    const applications = await Application.find({
      jobId: { $in: jobIds }
    })
      .populate("userId", "name email")
      .populate("jobId", "title");

    res.status(200).json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
