import Project from "./project.model.js";

// Lấy danh sách dự án
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ userId }).sort({ startDate: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Tạo dự án mới
export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectName, description, startDate, endDate, skills, projectUrl } = req.body;

    const project = new Project({
      userId,
      projectName,
      description,
      startDate,
      endDate,
      skills,
      projectUrl,
    });

    await project.save();
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Cập nhật dự án
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, description, startDate, endDate, skills, projectUrl } = req.body;

    const project = await Project.findByIdAndUpdate(
      id,
      { projectName, description, startDate, endDate, skills, projectUrl },
      { new: true }
    );

    res.status(200).json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Xóa dự án
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
