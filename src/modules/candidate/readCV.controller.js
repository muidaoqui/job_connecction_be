import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const readPDF = async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ message: "Thiếu đường dẫn file PDF" });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Không tìm thấy file PDF" });
    }
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdf(pdfBuffer);
    res.status(200).json({
      success: true,
      numpages: data.numpages,
      text: data.text.replace(/\n/g, " ").trim(),
      info: data.info,
      metadata: data.metadata
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc PDF", error: error.message });
  }
};