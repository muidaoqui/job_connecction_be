import multer from "multer";
import fs from "fs";
import path from "path";

const cvPath = path.join("uploads", "cv");

// Tự tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(cvPath)) {
  fs.mkdirSync(cvPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được upload file PDF."), false);
  }
};

export const uploadCV = multer({ storage, fileFilter }).single("cvFile");
