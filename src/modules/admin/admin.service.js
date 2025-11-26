import User from "../auth/auth.model.js";
import CandidateSchema from "../candidate/candidate.model.js";
import RecruiterSchema from "../recruiter/recruiter.model.js";

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

    if (!user) {
      throw new Error("User not found");
    }
    console.log(user);
    console.log("Current status:", user.status);

    // Toggle status active <-> banned
    user.status = user.status === "active" ? "banned" : "active";
    user.updated_at = new Date();

    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};
