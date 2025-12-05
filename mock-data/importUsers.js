import mongoose from "mongoose";
import fs from "fs";
import User from "../src/modules/user/user.model.js";

// Kết nối MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/job-connection", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const importUsers = async () => {
  try {
    // Đọc file JSON
    const data = JSON.parse(fs.readFileSync("./mock-data/users.json", "utf-8"));

    // Chuyển _id sang ObjectId
    const usersWithObjectId = data.map((user) => ({
      ...user,
      _id: new mongoose.Types.ObjectId(), // tạo ObjectId mới
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at),
    }));

    // Xóa collection cũ (tuỳ chọn)
    await User.deleteMany({});

    // Thêm dữ liệu mới
    await User.insertMany(usersWithObjectId);

    console.log("Đã import users với ObjectId!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

importUsers();
