import Job from "./job.model.js";
import Application from "../candidate/applications/application.model.js";

// Tạo job
export const createJob = async (req, res) => {
  try {
    if (!req.body.recruiterId) {
      return res.status(400).json({ message: "Missing recruiterId" });
    }

    const job = new Job(req.body);
    await job.save();

    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy job theo ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

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
export const getAllJobs = async (req, res) => {
  try {
    const { keyword, location, jobType } = req.query;

    let filter = {};

    // 🔍 lọc theo keyword (title, description)
    if (keyword && keyword.trim() !== "") {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    // 📍 lọc theo location
    if (location && location.trim() !== "") {
      filter.location = { $regex: location, $options: "i" };
    }

    // 💼 lọc theo loại hình job fulltime / parttime
    if (jobType && jobType.trim() !== "") {
      filter.jobType = { $regex: jobType, $options: "i" };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    res.json(jobs);

  } catch (error) {
    console.error("Get jobs error:", error);
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
