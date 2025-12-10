import mongoose from "mongoose";
import Job from "./job.model.js";
import Application from "../job/application.model.js";
import SavedJob from "../candidate/saved-job/saved-job.model.js";
import { Recruiter } from "../recruiter/recruiter.model.js";

// Tạo job
export const createJob = async (req, res) => {
  try {
    // 1) CHECK LOGIN
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Bạn cần đăng nhập để đăng tin" });
    }

    // 2) FIND RECRUITER PROFILE
    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    if (!recruiter) {
      return res.status(403).json({
        message: "Bạn cần tạo hồ sơ Nhà tuyển dụng trước khi đăng tin"
      });
    }

    // 3) BUILD JOB DATA (BE sẽ tự set recruiterId)
    const jobData = {
      title: req.body.title,
      description: req.body.description,
      requirement: req.body.requirement,
      salary: req.body.salary,
      location: req.body.location,
      type: req.body.type,
      companyId: recruiter.companyId || null, // auto link company
      recruiterId: recruiter._id,             // ⭐ QUAN TRỌNG
    };

    // 4) CREATE NEW JOB
    const newJob = new Job(jobData);
    await newJob.save();

    return res.status(201).json({
      success: true,
      message: "Đăng tin thành công",
      job: newJob,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo job:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng tin",
      error: err.message,
    });
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
// Lấy toàn bộ job (sắp xếp theo mức độ HOT)
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate({
        path: "recruiterId",
        select: "userId position companyId",
        populate: {
          path: "userId",
          select: "name email"
        }
      })
      .populate({
        path: "companyId",
        select: "name industry size country logo address backgroundImage images"
      })
      .sort({ createdAt: -1 });   // ưu tiên tin mới đăng

    return res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    console.error("🔥 Lỗi getAllJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách công việc"
    });
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
    const jobId = req.params.id;
    const { name, email, message } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên CV dạng PDF." });
    }

    const application = new Application({
  jobId: new mongoose.Types.ObjectId(jobId),
  userId: new mongoose.Types.ObjectId(req.user.id),                // ⭐ THÊM DÒNG NÀY
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
