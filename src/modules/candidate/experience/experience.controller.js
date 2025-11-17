import Experience from "./experience.model.js";

// Lấy danh sách kinh nghiệm
export const getExperiences = async (req, res) => {
  try {
    const userId = req.user.id;
    const experiences = await Experience.find({ userId }).sort({ startDate: -1 });
    res.status(200).json(experiences);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tạo kinh nghiệm mới
export const createExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobTitle, company, startDate, endDate, isCurrentJob, description } = req.body;

    const experience = new Experience({
      userId,
      jobTitle,
      company,
      startDate,
      endDate,
      isCurrentJob,
      description,
    });

    await experience.save();
    res.status(201).json({ message: "Experience created successfully", experience });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Cập nhật kinh nghiệm
export const updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobTitle, company, startDate, endDate, isCurrentJob, description } = req.body;

    const experience = await Experience.findByIdAndUpdate(
      id,
      { jobTitle, company, startDate, endDate, isCurrentJob, description },
      { new: true }
    );

    res.status(200).json({ message: "Experience updated successfully", experience });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Xóa kinh nghiệm
export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    await Experience.findByIdAndDelete(id);
    res.status(200).json({ message: "Experience deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
