import Education from "./education.model.js";

// Lấy danh sách học vấn
export const getEducations = async (req, res) => {
  try {
    const userId = req.user.id;
    const educations = await Education.find({ userId }).sort({ endDate: -1 });
    res.status(200).json(educations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tạo học vấn mới
export const createEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { school, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body;

    const education = new Education({
      userId,
      school,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      grade,
      description,
    });

    await education.save();
    res.status(201).json({ message: "Education created successfully", education });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Cập nhật học vấn
export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { school, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body;

    const education = await Education.findByIdAndUpdate(
      id,
      { school, degree, fieldOfStudy, startDate, endDate, grade, description },
      { new: true }
    );

    res.status(200).json({ message: "Education updated successfully", education });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Xóa học vấn
export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    await Education.findByIdAndDelete(id);
    res.status(200).json({ message: "Education deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
