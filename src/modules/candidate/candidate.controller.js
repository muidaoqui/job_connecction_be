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
    const userId = req.user.id;
    const resumePath = req.file.path;
    let candidate = await Candidate.findOne({ userId });

    if (!candidate) {
        candidate = new Candidate({ userId, resumePath });  
        await candidate.save();
    } else {
        candidate.resumePath = resumePath;
        await candidate.save();
    }
    res.status(200).json({ message: "Resume uploaded successfully", resumePath });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



