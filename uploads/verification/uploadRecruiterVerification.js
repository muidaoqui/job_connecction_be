import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/recruiter-verification";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error("File không hợp lệ"), false);
  } else {
    cb(null, true);
  }
};

export const uploadRecruiterVerification = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).fields([
  { name: "businessLicense", maxCount: 1 },
  { name: "idCardFront", maxCount: 1 },
  { name: "idCardBack", maxCount: 1 },
]);
