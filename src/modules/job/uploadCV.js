import multer from "multer";
import path from "path";

/* =========================================================
   STORAGE CONFIG
========================================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

/* =========================================================
   FILE FILTER (PDF, DOC, DOCX)
========================================================= */
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX allowed"));
  }
};

/* =========================================================
   EXPORT MULTER INSTANCE
========================================================= */
export const uploadCV = multer({
  storage,
  fileFilter
});
