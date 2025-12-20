import User from "../auth/auth.model.js";
import CandidateSchema from "../candidate/candidate.model.js";
import Recruiter from "../recruiter/recruiter.model.js";
import Job from "../job/job.model.js";
import mongoose from "mongoose";
export const getAllUsers = async (filters) => {
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.email) query.email = { $regex: filters.email, $options: "i" };

  const users = await User.find(query).sort({ created_at: -1 });
  return users;
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error("User not found");
  }
  let profile = null;
  if (user.role === "candidate") {
    profile = await CandidateSchema.findOne({ _id: user._id }).lean();
  } else if (user.role === "recruiter") {
    profile = await RecruiterSchema.findOne({ _id: user._id }).lean();
  }

  return { ...user, profile };
};

export const toggleUserStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Toggle status 1 lần
    const newStatus = user.status === "active" ? "banned" : "active";

    // Cập nhật và trả về document mới
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status: newStatus, updated_at: new Date() },
      { new: true }
    );

    return updatedUser; // trả về toàn bộ document mới
  } catch (error) {
    console.error("Toggle status backend error:", error);
    throw new Error(error.message);
  }
};

export const getJobsService = async () => {
  return await Job.find().populate("recruiterId").populate("companyId");
};

export const submitRecruiterVerification = async ({ userId, body, files }) => {
  let recruiter = await Recruiter.findOne({ userId });

  // 🔥 CHƯA CÓ → TẠO MỚI
  if (!recruiter) {
    recruiter = new Recruiter({
      userId,
      phone: body.phone,
      verificationStatus: "unverified",
    });
  }

  recruiter.verificationStatus = "pending";
  recruiter.verificationData = {
    companyName: body.companyName,
    taxCode: body.taxCode,
    address: body.address,
    website: body.website,
    phone: body.phone,

    businessLicense: files.businessLicense?.[0]?.path,
    idCardFront: files.idCardFront?.[0]?.path,
    idCardBack: files.idCardBack?.[0]?.path,
  };

  await recruiter.save();
  return recruiter;
};

export const approveJobService = async (jobId) => {
  const job = await Job.findById(jobId);

  if (!job) throw new Error("Job not found");

  // if (job.status !== "pending")
  //   throw new Error("Only pending jobs can be approved");

  job.status = "approved";
  await job.save();

  return job;
};

export const rejectJobService = async (jobId) => {
  const job = await Job.findById(jobId);

  if (!job) throw new Error("Job not found");

  // if (job.status !== "pending")
  //   throw new Error("Only pending jobs can be rejected");

  job.status = "rejected";
  await job.save();

  return job;
};

export const getPendingRecruiters = async () => {
  return await Recruiter.find({ verificationStatus: "pending" })
    .populate("userId", "username email")
    .lean();
};

export const approveRecruiter = async (id) => {
  return await Recruiter.findByIdAndUpdate(
    id,
    { verificationStatus: "verified" },
    { new: true }
  );
};

export const rejectRecruiter = async (id, reason) => {
  return await Recruiter.findByIdAndUpdate(
    id,
    {
      verificationStatus: "rejected",
      "verificationData.note": reason,
    },
    { new: true }
  );
};

export const getRecruiterByUserId = async (userId) => {
  const recruiter = await Recruiter.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!recruiter) {
    return { verificationStatus: "unverified" };
  }

  return recruiter;
};
