import Job from "./job.model.js";
import Application from "./application.model.js";

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
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Lấy toàn bộ job
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully" });
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