import Recruiter from "./recruiter.model.js";
import User from "../auth/auth.model.js";
import mongoose from "mongoose";
import Application from "../candidate/applications/application.model.js";
import Job from "../job/job.model.js";


export const getApplicantsForRecruiter = async (req, res) => {
  try {
    const recruiterUserId = req.user._id;

    // Lấy recruiterId theo userId
    const recruiter = await Recruiter.findOne({ userId: recruiterUserId });
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    // Lấy tất cả job mà recruiter đã đăng
    const jobs = await Job.find({ recruiterId: recruiter._id }).select("_id");
    const jobIds = jobs.map(j => j._id);

    // Lấy tất cả ứng viên apply vào các job đó
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("userId", "name email")
      .populate("jobId", "title");

    return res.json({
      success: true,
      applications
    });

  } catch (err) {
    console.error("getApplicantsForRecruiter error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get recruiter profile by userId
export const getRecruiterByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    
    const recruiter = await Recruiter.findOne({ userId })
      .populate("userId", "name email")
      .populate("companyId");

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter profile not found" });
    }

    res.json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all recruiters (with pagination and filters)
export const getAllRecruiters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const recruiters = await Recruiter.find()
      .populate("userId", "name email")
      .populate("companyId", "name industry logo")
      .sort({ followers: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Recruiter.countDocuments();

    res.json({
      success: true,
      recruiters,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create recruiter profile (when recruiter registers or completes profile)
export const createRecruiterProfile = async (req, res) => {
  try {
    const { userId, companyId, position } = req.body;

    // Check if recruiter already has a profile
    const existing = await Recruiter.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: "Recruiter profile already exists" });
    }

    const recruiter = new Recruiter({
      userId,
      companyId,
      position,
      followers: 0,
    });

    await recruiter.save();

    const populated = await Recruiter.findById(recruiter._id)
      .populate("userId", "name email")
      .populate("companyId");

    res.status(201).json({ success: true, recruiter: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update recruiter profile
export const updateRecruiterProfile = async (req, res) => {
  try {
    const recruiterId = req.params.id;
    const { position, companyId } = req.body;

    const recruiter = await Recruiter.findByIdAndUpdate(
      recruiterId,
      { position, companyId },
      { new: true }
    )
      .populate("userId", "name email")
      .populate("companyId");

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Follow a recruiter (increment followers)
export const followRecruiter = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    const recruiter = await Recruiter.findByIdAndUpdate(
      recruiterId,
      { $inc: { followers: 1 } },
      { new: true }
    );

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.json({ success: true, followers: recruiter.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unfollow a recruiter (decrement followers)
export const unfollowRecruiter = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    const recruiter = await Recruiter.findByIdAndUpdate(
      recruiterId,
      { $inc: { followers: -1 } },
      { new: true }
    );

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.json({ success: true, followers: recruiter.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recruiter stats (jobs posted, applicants, etc.)
export const getRecruiterStats = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    // Get the user ID associated with this recruiter
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const userId = recruiter.userId;

    // Import Job to count posted jobs
    const Job = require("../job/job.model.js").default;
    const Application = require("../candidate/applications/application.model.js").default;

    const postedJobs = await Job.countDocuments({ recruiterId: userId });
    const jobs = await Job.find({ recruiterId: userId }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const totalApplications = await Application.countDocuments({
      jobId: { $in: jobIds },
    });

    const pendingApplications = await Application.countDocuments({
      jobId: { $in: jobIds },
      status: "pending",
    });

    const acceptedApplications = await Application.countDocuments({
      jobId: { $in: jobIds },
      status: "accepted",
    });

    res.json({
      success: true,
      stats: {
        postedJobs,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        followers: recruiter.followers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top recruiters by followers
export const getTopRecruiters = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topRecruiters = await Recruiter.find()
      .populate("userId", "name email")
      .populate("companyId", "name industry logo")
      .sort({ followers: -1 })
      .limit(limit);

    res.json({ success: true, recruiters: topRecruiters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Lấy hồ sơ recruiter của user đang đăng nhập
export const getMyRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const recruiter = await Recruiter.findOne({ userId });

    return res.status(200).json({
      success: true,
      data: recruiter || null
    });
  } catch (error) {
    console.error("getMyRecruiterProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Tạo hoặc cập nhật hồ sơ recruiter
export const saveMyRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { fullName, position, phone, workEmail, bio } = req.body;

    let recruiter = await Recruiter.findOne({ userId });

    if (!recruiter) {
      recruiter = await Recruiter.create({
        userId,
        fullName,
        position,
        phone,
        workEmail,
        bio,
        companyId: null,
        followers: 0
      });

      return res.status(201).json({
        success: true,
        message: "Tạo hồ sơ nhà tuyển dụng thành công!",
        data: recruiter
      });
    }

    recruiter.fullName = fullName;
    recruiter.position = position;
    recruiter.phone = phone;
    recruiter.workEmail = workEmail;
    recruiter.bio = bio;

    await recruiter.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ nhà tuyển dụng thành công!",
      data: recruiter
    });

  } catch (error) {
    console.error("saveMyRecruiterProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
export const updateApplicantStatus = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;

    const application = await Application.findById(appId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status;
    await application.save();

    res.json({ success: true, application });
  } catch (error) {
    console.error("updateApplicantStatus error:", error);
    res.status(500).json({ message: "Server error" });
  }
};