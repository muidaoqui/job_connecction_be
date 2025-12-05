import User from "../auth/auth.model.js";
import Candidate from "./candidate.model.js";
import Resume from "./resume.model.js";
import Application from "./applications/application.model.js";
import SavedJob from "./saved-job/saved-job.model.js";
import JobView from "./job-view/job-view.model.js";

// Lấy thông tin profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ middleware xác thực JWT
    const user = await User.findById(userId).select("-password");
    const candidate = await Candidate.findOne({ userId });

    res.status(200).json({ ...user.toObject(), candidate });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tạo Profile
export const createProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address, dateOfBirth, gender, profileSummary } = req.body;
        const candidate = new Candidate({ userId, address, dateOfBirth, gender, profileSummary });
        await candidate.save();
        res.status(201).json({ message: "Profile created successfully", candidate });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Cập nhật profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, address, dateOfBirth, gender, profileSummary } = req.body;

    await User.findByIdAndUpdate(userId, { name });
    let candidate = await Candidate.findOne({ userId });

    if (!candidate) {
      candidate = new Candidate({ userId, address, dateOfBirth, gender, profileSummary });
      await candidate.save();
    } else {
      await Candidate.findOneAndUpdate(
        { userId },
        { address, dateOfBirth, gender, profileSummary }
      );
    }

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tải lên CV
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ Không có file được tải lên");
      return res.status(400).json({ message: "Vui lòng chọn file để tải lên" });
    }

    const userId = req.user.id;
    console.log("📁 File info:", req.file.filename, "UserID:", userId);
    
    const resumePath = req.file.path;
    
    const resume = new Resume({
      userId,
      filename: req.file.filename,
      path: resumePath,
    });
    await resume.save();
    console.log(`✅ Saved resume record to DB for user ${userId}`);
    
    let candidate = await Candidate.findOne({ userId });
    if (!candidate) {
        candidate = new Candidate({ userId, resumePath });  
        await candidate.save();
        console.log("✅ Tạo candidate mới với CV");
    } else {
        candidate.resumePath = resumePath;
        await candidate.save();
        console.log("✅ Cập nhật CV cho candidate");
    }
    
    res.status(200).json({ message: "Resume uploaded successfully", resumePath });
  } catch (error) {
    console.error("❌ Lỗi upload CV:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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



