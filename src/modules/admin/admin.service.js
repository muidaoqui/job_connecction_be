import User from "../auth/auth.model.js";

export const getAllUsers = async (filters) => {
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.email) query.email = { $regex: filters.email, $options: "i" };

  const users = await User.find(query).sort({ created_at: -1 });
  return users;
};
