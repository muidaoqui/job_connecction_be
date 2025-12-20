import multer from "multer";
import path from "path";
import fs from "fs";

// Đảm bảo thư mục tồn tại
const baseDir = path.join(process.cwd(), "uploads/company");
const folders = ["logo", "cover", "gallery", "license"];

folders.forEach((f) => {
  const full = path.join(baseDir, f);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.fieldname === "logo") folder = "logo";
    if (file.fieldname === "coverImage") folder = "cover";
    if (file.fieldname === "galleryImages") folder = "gallery";
    if (file.fieldname === "businessLicense") folder = "license";

    cb(null, path.join(baseDir, folder));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 100000);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

export default multer({ storage });
