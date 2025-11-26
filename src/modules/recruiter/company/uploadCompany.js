import multer from "multer";
import path from "path";
import fs from "fs";

// Tạo thư mục upload nếu chưa có
const rootDir = path.join(process.cwd(), "uploads", "company");
const folders = ["logo", "cover", "gallery", "license"];

folders.forEach((f) => {
  const dir = path.join(rootDir, f);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Tạo storage động theo fieldName
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.fieldname === "logo") folder = "logo";
    if (file.fieldname === "coverImage") folder = "cover";
    if (file.fieldname === "galleryImages") folder = "gallery";
    if (file.fieldname === "businessLicense") folder = "license";

    cb(null, path.join(rootDir, folder));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e5);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;
