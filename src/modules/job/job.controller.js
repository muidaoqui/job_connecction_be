import Job from "./job.model.js";

export const searchJobs = async (req, res) => {
  try {
    const { keyword, location, jobType } = req.query;

    let query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    const jobs = await Job.find(query);

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
