import User from "../auth/auth.model.js";
import Candidate from "./candidate.model.js";

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

// List resume files saved on server
export const listResumes = async (req, res) => {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.join(process.cwd(), "uploads", "resumes");
    if (!fs.existsSync(dir)) {
      return res.status(200).json([]);
    }
    const files = fs.readdirSync(dir);
    const list = files.map((f) => ({
      name: f,
      path: `/uploads/resumes/${f}`,
      filename: f,
    }));
    res.status(200).json(list);
  } catch (error) {
    console.error("Error listing resumes:", error);
    res.status(500).json({ message: "Cannot list resumes", error: error.message });
  }
};

// Set main resume
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



