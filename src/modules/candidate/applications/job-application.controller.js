import Application from "../../job/application.model.js";
import SavedJob from "../saved-job/saved-job.model.js";
import JobView from "../job-view/job-view.model.js";
import Job from "../../job/job.model.js";

// ===== APPLICATIONS =====
export const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await Application.find({ userId })
      .populate("jobId")
      .sort({ appliedDate: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const applyJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId, resumePath, coverLetter } = req.body;

    // Check if already applied
    const existingApplication = await Application.findOne({ userId, jobId });
    if (existingApplication) {
      return res.status(400).json({ message: "Bạn đã ứng tuyển công việc này rồi" });
    }

    const application = new Application({
      userId,
      jobId,
      resumePath,
      coverLetter,
      status: "applied",
    });

    const savedApplication = await application.save();
    await savedApplication.populate("jobId");
    res.status(201).json(savedApplication);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const withdrawApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;

    const application = await Application.findOne({
      _id: applicationId,
      userId,
    });

    if (!application) {
      return res.status(404).json({ message: "Không tìm thấy đơn ứng tuyển" });
    }

    await Application.deleteOne({ _id: applicationId });
    res.json({ message: "Rút đơn ứng tuyển thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== SAVED JOBS =====
export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedJobs = await SavedJob.find({ userId })
      .populate("jobId")
      .sort({ savedDate: -1 });
    res.json(savedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    // Check if already saved
    const existingSavedJob = await SavedJob.findOne({ userId, jobId });
    if (existingSavedJob) {
      return res.status(400).json({ message: "Công việc này đã được lưu" });
    }

    const savedJob = new SavedJob({
      userId,
      jobId,
    });

    const result = await savedJob.save();
    await result.populate("jobId");
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({
      userId,
      jobId,
    });

    if (!savedJob) {
      return res.status(404).json({ message: "Công việc không được lưu" });
    }

    await SavedJob.deleteOne({ userId, jobId });
    res.json({ message: "Xóa công việc khỏi danh sách lưu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkJobSaved = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({ userId, jobId });
    res.json({ isSaved: !!savedJob });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== JOB VIEWS =====
export const getViewedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const viewedJobs = await JobView.find({ userId })
      .populate("jobId")
      .sort({ viewedDate: -1 });
    res.json(viewedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recordJobView = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    // Check if already viewed
    const existingView = await JobView.findOne({ userId, jobId });
    if (existingView) {
      // Update viewed date
      existingView.viewedDate = Date.now();
      await existingView.save();
      return res.json(existingView);
    }

    const jobView = new JobView({
      userId,
      jobId,
    });

    const result = await jobView.save();
    await result.populate("jobId");
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== INVITATIONS (MOCKED - from recruiters) =====
export const getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    // This would come from Recruiter invitations in real system
    // For now, return empty array
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
