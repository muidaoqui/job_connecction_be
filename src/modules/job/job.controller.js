import mongoose from "mongoose";
import Job from "./job.model.js";
import Application from "./application.model.js";
import SavedJob from "../candidate/saved-job/saved-job.model.js";
import Recruiter from "../recruiter/recruiter.model.js";

// Tạo job
export const createJob = async (req, res) => {
  try {
    // Ensure authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    // Ensure the authenticated user has a recruiter profile
    const recruiterProfile = await Recruiter.findOne({ userId: req.user.id });
    if (!recruiterProfile) {
      return res.status(403).json({ message: "Bạn cần có hồ sơ nhà tuyển dụng để đăng tin" });
    }

    // Build job data and force recruiterId from server-side profile (prevent spoofing)
    const jobData = {
      ...req.body,
      recruiterId: recruiterProfile._id,
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy job theo ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({ 
        path: 'recruiterId', 
        select: 'userId position followers companyId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'companyId', select: 'name industry size country logo address backgroundImage images' }
        ]
      })
      .populate({ path: 'companyId', select: 'name industry size country logo address backgroundImage images' });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      success: true,
      job   // FE cần đúng key này
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Lấy toàn bộ job (sắp xếp theo saveCount cho "hot jobs")
export const getAllJobs = async (req, res) => {
  try {
    // Populate recruiter basic info and company details, sort by saveCount descending (most saved = hottest)
    const jobs = await Job.find()
      .populate({ 
        path: 'recruiterId', 
        select: 'userId position followers companyId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'companyId', select: 'name industry size country logo backgroundImage images' }
        ]
      })
      .populate({ path: 'companyId', select: 'name industry size country logo backgroundImage images' })
      .sort({ saveCount: -1 });
    res.json(jobs);

  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Increment saveCount when job is saved by user
export const incrementSaveCount = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { saveCount: 1 } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ success: true, saveCount: job.saveCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Decrement saveCount when job is unsaved by user
export const decrementSaveCount = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { saveCount: -1 } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ success: true, saveCount: job.saveCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save job for logged-in user
export const saveJob = async (req, res) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    // Check if already saved
    const existingSave = await SavedJob.findOne({ userId, jobId });
    if (existingSave) {
      return res.status(200).json({ message: "Công việc đã được lưu" });
    }

    // Create new saved job record
    const savedJob = new SavedJob({ userId, jobId });
    await savedJob.save();

    // Increment job saveCount
    await Job.findByIdAndUpdate(jobId, { $inc: { saveCount: 1 } });

    res.status(200).json({ success: true, message: "Đã lưu công việc" });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: error.message });
  }
};

// Unsave job for logged-in user
export const unsaveJob = async (req, res) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    // Remove saved job record
    const result = await SavedJob.findOneAndDelete({ userId, jobId });
    
    if (!result) {
      return res.status(404).json({ message: "Saved job not found" });
    }

    // Decrement job saveCount
    await Job.findByIdAndUpdate(jobId, { $inc: { saveCount: -1 } });

    res.status(200).json({ success: true, message: "Đã bỏ lưu công việc" });
  } catch (error) {
    console.error("Error unsaving job:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!job) {
      return res.status(404).json({ message: "Job không tồn tại" });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job không tồn tại" });
    }

    res.json({ message: "Xoá job thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Danh sách ứng viên
export const getApplicants = async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.id })
      .populate("userId", "name email");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duyệt / từ chối
export const updateApplicationStatus = async (req, res) => {
  try {
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Thống kê Dashboard Recruiter
export const getRecruiterStats = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    const postedJobs = await Job.countDocuments({ recruiterId });

    // Lấy tất cả job ID của recruiter
    const jobs = await Job.find({ recruiterId }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const newApplicants = await Application.countDocuments({
      jobId: { $in: jobIds },
      status: "pending",
    });

    const pending = newApplicants;

    const accepted = await Application.countDocuments({
      jobId: { $in: jobIds },
      status: "accepted",
    });

    res.json({
      postedJobs,
      newApplicants,
      pending,
      accepted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const applyJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { name, email, message } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên CV dạng PDF." });
    }

    const application = new Application({
      jobId: new mongoose.Types.ObjectId(jobId),
      name,
      email,
      message,
      cvFile: req.file.path,
      status: "pending",
    });

    await application.save();

    return res.json({ success: true, message: "Ứng tuyển thành công!" });
  } catch (err) {
    console.error("Lỗi applyJob:", err);
    return res.status(500).json({ message: err.message });
  }
};
export const searchJobs = async (req, res) => {
  try {
    const keyword = req.query.q;

    // Nếu không có keyword, trả về rỗng (để FE không lỗi)
    if (!keyword || keyword.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    // Tìm theo title hoặc description
    const jobs = await Job.find(
      {
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { location: { $regex: keyword, $options: "i" } },
        ],
      }
    ).limit(8); // giới hạn 8 job suggest

    return res.json({
      success: true,
      data: jobs,
    });

  } catch (err) {
    console.error("Search job error: ", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm",
    });
  }
  
};
