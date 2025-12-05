import multer from "multer";
import path from "path";

// Lưu vào thư mục uploads/resumes/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// Chỉ nhận file PDF hoặc DOC
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// export đúng dạng Multer
export const uploadCV = multer({ storage, fileFilter });
