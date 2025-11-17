import Skill from "./skill.model.js";

// Lấy danh sách kỹ năng
export const getSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const skills = await Skill.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tạo kỹ năng mới
export const createSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillName, proficiency } = req.body;

    // Kiểm tra kỹ năng đã tồn tại
    const existingSkill = await Skill.findOne({ userId, skillName });
    if (existingSkill) {
      return res.status(400).json({ message: "Kỹ năng này đã tồn tại" });
    }

    const skill = new Skill({
      userId,
      skillName,
      proficiency,
    });

    await skill.save();
    res.status(201).json({ message: "Skill created successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Cập nhật kỹ năng
export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { proficiency } = req.body;

    const skill = await Skill.findByIdAndUpdate(
      id,
      { proficiency },
      { new: true }
    );

    res.status(200).json({ message: "Skill updated successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Xóa kỹ năng
export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    await Skill.findByIdAndDelete(id);
    res.status(200).json({ message: "Skill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tăng số lượng endorsement
export const endorseSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findByIdAndUpdate(
      id,
      { $inc: { endorsements: 1 } },
      { new: true }
    );
    res.status(200).json({ message: "Skill endorsed successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
