import User from "../auth/auth.model.js";
import Candidate from "./candidate.model.js";
import Resume from "./resume.model.js";
import Application from "../job/application.model.js";
import SavedJob from "./saved-job/saved-job.model.js";
import JobView from "./job-view/job-view.model.js";

// Lấy thông tin profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // từ verifyToken
    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const candidate = await Candidate.findById(userId).lean(); // Candidate._id = user._id
    // Trả về object profile tại root để frontend dùng profileRes.data.candidate và profileRes.data.name
    const profile = {
      ...user,
      candidate: candidate || null,
    };

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Tạo Profile
export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Nếu đã tồn tại candidate, trả về conflict
    const exists = await Candidate.findById(userId);
    if (exists) {
      return res.status(400).json({ message: "Candidate profile already exists" });
    }

    const payload = {
      _id: userId,
      dateOfBirth: req.body.dateOfBirth || null,
      gender: req.body.gender || null,
      address: req.body.address || "",
      profileSummary: req.body.profileSummary || "",
      avatarUrl: req.body.avatarUrl || undefined,
    };

    const candidate = new Candidate(payload);
    await candidate.save();

    // Optionally update user's name if gửi kèm
    if (req.body.name) {
      await User.findByIdAndUpdate(userId, { name: req.body.name });
    }

    const user = await User.findById(userId).select("-password").lean();

    const profile = {
      ...user,
      candidate: candidate.toObject(),
    };

    return res.status(201).json(profile);
  } catch (error) {
    console.error("Create profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cập nhật profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateCandidate = {
      dateOfBirth: req.body.dateOfBirth ?? undefined,
      gender: req.body.gender ?? undefined,
      address: req.body.address ?? undefined,
      profileSummary: req.body.profileSummary ?? undefined,
      avatarUrl: req.body.avatarUrl ?? undefined,
    };

    // Remove undefined keys to avoid overwriting with undefined
    Object.keys(updateCandidate).forEach((k) => updateCandidate[k] === undefined && delete updateCandidate[k]);

    // Upsert candidate document (create nếu chưa có)
    const candidate = await Candidate.findByIdAndUpdate(
      userId,
      { $set: updateCandidate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    // Update User name if provided
    if (req.body.name) {
      await User.findByIdAndUpdate(userId, { name: req.body.name });
    }

    const user = await User.findById(userId).select("-password").lean();

    const profile = {
      ...user,
      candidate: candidate || null,
    };

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Tải lên CV
export const uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const filePath = req.file.path;

    let candidate = await Candidate.findById(userId);
    if (!candidate) {
      candidate = new Candidate({ _id: userId, resumePath: filePath });
      await candidate.save();
    } else {
      candidate.resumePath = filePath;
      await candidate.save();
    }

    res.status(200).json({ message: "Resume uploaded", resumePath: filePath });
  } catch (error) {
    console.error("Upload resume error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listResumes = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Fetching resumes for user: ${userId}`);
    
    const resumes = await Resume.find({ userId }).sort({ uploadedAt: -1 });
    console.log(`✅ Found ${resumes.length} resumes for user ${userId}`);
    
    const list = resumes.map((r) => ({
      id: r._id,
      name: r.filename,
      path: `/uploads/resumes/${r.filename}`, 
      filename: r.filename,
      uploadedAt: r.uploadedAt,
    }));
    
    res.status(200).json(list);
  } catch (error) {
    console.error("Error listing resumes:", error);
    res.status(500).json({ message: "Cannot list resumes", error: error.message });
  }
};

export const setMainResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mainResumePath } = req.body;
    
    if (!mainResumePath) {
      return res.status(400).json({ message: "mainResumePath is required" });
    }

    let candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      candidate = new Candidate({ userId, mainResumePath });
      await candidate.save();
    } else {
      candidate.mainResumePath = mainResumePath;
      await candidate.save();
    }

    console.log(`✅ Set main resume for user ${userId}: ${mainResumePath}`);
    res.status(200).json({ message: "Main resume set successfully", mainResumePath });
  } catch (error) {
    console.error("❌ Error setting main resume:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách ứng tuyển
export const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await Application.find({ userId })
      .populate("jobId", "title salary location description companyId")
      .sort({ appliedDate: -1 });
    res.status(200).json({ data: applications });
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Rút đơn ứng tuyển
export const withdrawApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;
    
    const application = await Application.findOneAndDelete({
      _id: applicationId,
      userId,
    });
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    console.error("❌ Error withdrawing application:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách công việc đã lưu
export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedJobs = await SavedJob.find({ userId })
      .populate({
        path: "jobId",
        select: "title salary location description companyId",
        populate: { path: "companyId", select: "name" },
      })
      .sort({ savedDate: -1 });
    res.status(200).json({ data: savedJobs });
  } catch (error) {
    console.error("❌ Error fetching saved jobs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Kiểm tra xem người dùng đã lưu công việc cụ thể chưa
export const checkSavedJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    const saved = await SavedJob.findOne({ userId, jobId });

    if (saved) {
      return res.status(200).json({ saved: true, savedJobId: saved._id });
    }

    return res.status(200).json({ saved: false });
  } catch (error) {
    console.error("❌ Error checking saved job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xóa công việc khỏi danh sách lưu
export const unsaveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { savedJobId } = req.params;
    
    const savedJob = await SavedJob.findOneAndDelete({
      _id: savedJobId,
      userId,
    });
    
    if (!savedJob) {
      return res.status(404).json({ message: "Saved job not found" });
    }
    
    res.status(200).json({ message: "Job removed from saved list" });
  } catch (error) {
    console.error("❌ Error removing saved job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách công việc đã xem
export const getViewedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const viewedJobs = await JobView.find({ userId })
      .populate("jobId", "title salary location description companyId")
      .sort({ viewedDate: -1 });
    res.status(200).json({ data: viewedJobs });
  } catch (error) {
    console.error("❌ Error fetching viewed jobs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xóa công việc khỏi danh sách xem
export const removeViewedJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobViewId } = req.params;
    
    const jobView = await JobView.findOneAndDelete({
      _id: jobViewId,
      userId,
    });
    
    if (!jobView) {
      return res.status(404).json({ message: "Job view record not found" });
    }
    
    res.status(200).json({ message: "Job removed from viewed list" });
  } catch (error) {
    console.error("❌ Error removing viewed job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
    let candidate = await Candidate.findOne({ userId });

    if (!candidate) {
      candidate = new Candidate({ userId, avatarUrl });
      await candidate.save();
    } else {
      candidate = await Candidate.findOneAndUpdate(
        { userId },
        { avatarUrl },
        { new: true }
      );
    }

    res.status(200).json({ avatarUrl, message: "Avatar uploaded successfully" });
  } catch (error) {
    console.error("❌ Error uploading avatar:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



