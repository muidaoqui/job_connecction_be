import mongoose from "mongoose";
import User from "../src/modules/user/user.model.js";
// Kết nối MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/job-connection", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createAdmin = async () => {
  try {
    const admin = new User({
      _id: new mongoose.Types.ObjectId(), // Tạo ObjectId mới
      email: "admin@email.com",
      password: "$2a$12$vLEmM9XgoOKCq6Nm7iNfIuUW6ClTpdqiBikgwBVJMwBfTtiepYOvu", // bcrypt hash password
      firstName: "Admin",
      lastName: "Supreme",
      phoneNumber: "0000000000",
      role: "admin",
      emailVerified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await admin.save();
    console.log("Admin đã được tạo với _id là ObjectId:", admin._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
