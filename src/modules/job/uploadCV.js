import multer from "multer";
import path from "path";

// Cấu hình lưu file vào thư mục uploads/resumes/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// Chỉ chấp nhận PDF, DOC, DOCX
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Export Multer INSTANCE để route tự gọi .single("resume")
export const uploadCV = multer({
  storage,
  fileFilter
});
