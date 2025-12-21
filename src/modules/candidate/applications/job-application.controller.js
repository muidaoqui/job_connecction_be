import SavedJob from "../saved-job/saved-job.model.js";
import JobView from "../job-view/job-view.model.js";
import Application from "../../job/application.model.js";
import Job from "../../job/job.model.js"; // ✅ ĐÚNG
import Recruiter from "../../recruiter/recruiter.model.js";
export const getApplicationsForUser = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const userId = req.user.id;
    const applications = await Application.find({ userId })
      .populate('jobId')            // populate job detail
      .sort({ appliedDate: -1 });

    return res.json({ applications }); // hoặc { data: applications } nếu muốn
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
export const getApplicantsByJob = async (req,res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId })
      .populate('userId')
      .sort({ appliedDate: -1 });
    return res.json({ data: applications });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



export const applyJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // ✅ LẤY USER TỪ TOKEN (KHÔNG CẦN IMPORT User)
    const user = req.user;

    const fullName =
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.name ||
      user.email?.split("@")[0];

    const newApplication = new Application({
      jobId: id,
      userId: user.id,
      name: fullName,
      email: user.email,
      message,
      cvFile: req.file.path,
      status: "pending",
    });

    await newApplication.save();

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("❌ applyJob error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

 

export const withdrawApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;

    const application = await Application.findOne({
      _id: applicationId,
      userId,
    });

    if (!application) {
      return res.status(404).json({ message: "Không tìm thấy đơn ứng tuyển" });
    }

    await Application.deleteOne({ _id: applicationId });
    res.json({ message: "Rút đơn ứng tuyển thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedJobs = await SavedJob.find({ userId })
      .populate("jobId")
      .sort({ savedDate: -1 });
    res.json(savedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    const existingSavedJob = await SavedJob.findOne({ userId, jobId });
    if (existingSavedJob) {
      return res.status(400).json({ message: "Công việc này đã được lưu" });
    }

    const savedJob = new SavedJob({
      userId,
      jobId,
    });

    const result = await savedJob.save();
    await result.populate("jobId");
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({
      userId,
      jobId,
    });

    if (!savedJob) {
      return res.status(404).json({ message: "Công việc không được lưu" });
    }

    await SavedJob.deleteOne({ userId, jobId });
    res.json({ message: "Xóa công việc khỏi danh sách lưu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkJobSaved = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({ userId, jobId });
    res.json({ isSaved: !!savedJob });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getViewedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const viewedJobs = await JobView.find({ userId })
      .populate("jobId")
      .sort({ viewedDate: -1 });
    res.json(viewedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recordJobView = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    const existingView = await JobView.findOne({ userId, jobId });
    if (existingView) {
      existingView.viewedDate = Date.now();
      await existingView.save();
      return res.json(existingView);
    }

    const jobView = new JobView({
      userId,
      jobId,
    });

    const result = await jobView.save();
    await result.populate("jobId");
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    // nhà tuyển dụng gửi lời mời trong hệ thống thực tế
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
