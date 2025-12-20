import  Recruiter  from "../recruiter/recruiter.model.js";
import User from "../auth/auth.model.js";
import mongoose from "mongoose";
import Application from "../job/application.model.js";
import Job from "../job/job.model.js";

/* ================================
   📌 LẤY DANH SÁCH ỨNG VIÊN CHO RECRUITER
================================ */
export const getApplicantsForRecruiter = async (req, res) => {
  try {
    const recruiterUserId = req.user._id;

    const recruiter = await Recruiter.findOne({ userId: recruiterUserId });
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

    const jobs = await Job.find({ recruiterId: recruiter._id }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("userId", "name email")
      .populate("jobId", "title");

    return res.json({ success: true, applications });
  } catch (err) {
    console.error("getApplicantsForRecruiter error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   📌 LẤY THÔNG TIN RECRUITER THEO USER ID
================================ */
export const getRecruiterByCompany = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const recruiters = await Recruiter.find({ companyId })
      .populate("userId", "name email");

    res.status(200).json({ data: recruiters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   📌 LẤY TOÀN BỘ RECRUITER (PHÂN TRANG)
================================ */
export const getAllRecruiters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { companyId } = req.query;

    const filter = companyId ? { companyId } : {};

    const recruiters = await Recruiter.find(filter)
      .populate("userId", "name email")
      .populate("companyId", "name industry logo")
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Recruiter.countDocuments(filter);

    res.json({
      success: true,
      recruiters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
    });
  } catch (error) {
    console.error("🔥 Lỗi getAllRecruiters:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách recruiter"
    });
  }
};


/* ================================
   📌 TẠO HỒ SƠ RECRUITER
================================ */
export const createRecruiterProfile = async (req, res) => {
  try {
    const { userId, companyId, position } = req.body;

    const existing = await Recruiter.findOne({ userId });
    if (existing) return res.status(400).json({ message: "Recruiter profile already exists" });

    const recruiter = await Recruiter.create({
      userId,
      companyId,
      position,
      followers: 0,
    });

    res.status(201).json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   📌 UPDATE HỒ SƠ RECRUITER
================================ */
export const updateRecruiterProfile = async (req, res) => {
  try {
    const recruiterId = req.params.id;
    const { position, companyId } = req.body;

    const recruiter = await Recruiter.findByIdAndUpdate(
      recruiterId,
      { position, companyId },
      { new: true }
    );

    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

    res.json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   📌 THEO DÕI RECRUITER
================================ */
export const followRecruiter = async (req, res) => {
  try {
    const recruiterId = req.params.id;
    const userId = req.user.id;

    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter)
      return res.status(404).json({ message: "Recruiter not found" });

    if (recruiter.followers.includes(userId)) {
      return res.status(400).json({ message: "Already followed" });
    }

    recruiter.followers.push(userId);
    await recruiter.save();

    res.json({
      success: true,
      followers: recruiter.followers.length,
      isFollowing: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================================
   📌 BỎ THEO DÕI RECRUITER
================================ */
export const unfollowRecruiter = async (req, res) => {
  try {
    const recruiterId = req.params.id;
    const userId = req.user.id;

    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter)
      return res.status(404).json({ message: "Recruiter not found" });

    recruiter.followers = recruiter.followers.filter(
      id => id.toString() !== userId
    );
    await recruiter.save();

    res.json({
      success: true,
      followers: recruiter.followers.length,
      isFollowing: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================================
   📌 LẤY HỒ SƠ CỦA USER ĐANG ĐĂNG NHẬP
================================ */
export const getMyRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const recruiter = await Recruiter.findOne({ userId });

    return res.status(200).json({
      success: true,
      data: recruiter || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================================
   📌 TẠO + UPDATE HỒ SƠ RECRUITER (COI NHƯ API LƯU)
================================ */
export const saveMyRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user._id; // đảm bảo lấy được ID
    if (!userId) {
      return res.status(400).json({ message: "Không tìm thấy userId" });
    }

    let data = {
  userId,
  name: req.body.fullName,
  position: req.body.position,
  phone: req.body.phone,
  workEmail: req.body.workEmail,
  bio: req.body.bio,
  companyId: req.body.companyId || null, // ✅ THÊM DÒNG NÀY
};

    // Nếu có avatar
    if (req.file) {
      data.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Kiểm tra xem đã có hồ sơ recruiter chưa
    let profile = await Recruiter.findOne({ userId });

if (profile) {
  profile = await Recruiter.findOneAndUpdate({ userId }, data, { new: true });
} else {
  profile = await Recruiter.create(data);

  // 🔥 RẤT QUAN TRỌNG
  await User.findByIdAndUpdate(userId, {
    role: "recruiter",
  });
}

    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lưu hồ sơ recruiter:", err);
    res.status(500).json({
      message: "Lỗi server",
      error: err.message,
    });
  }
};


/* ================================
   📌 UPDATE STATUS ĐƠN ỨNG TUYỂN
================================ */
export const updateApplicantStatus = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;

    const application = await Application.findById(appId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = status;
    await application.save();

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
