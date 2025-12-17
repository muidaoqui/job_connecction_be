import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { franc } from "franc";
import { uploadDocument } from './rag.service.js';
import { parseResumeStructure } from "./rag.utils.js";
/**
 * Trích xuất cấu trúc Resume từ PDF
 * Nhận diện sections, bullets, dates, contact info
 */
export const readPDF = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ message: "Thiếu đường dẫn file PDF" });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Không tìm thấy file PDF" });
    }

    // 1. Đọc PDF
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdf(pdfBuffer);
    
    // 2. Phát hiện ngôn ngữ
    const lang = franc(data.text.substring(0, 1000));
    
    // 3. Xử lý text và trích xuất cấu trúc
    const structuredData = parseResumeStructure(data.text, lang);
    
    res.status(200).json({
      success: true,
      numpages: data.numpages,
      language: lang,
      rawText: data.text,
      cleanText: structuredData.cleanText,
      structure: {
        sections: structuredData.sections,
        contactInfo: structuredData.contactInfo,
        bullets: structuredData.bullets,
        dates: structuredData.dates,
      },
      statistics: {
        totalSections: structuredData.sections.length,
        totalBullets: structuredData.bullets.length,
        totalCharacters: data.text.length,
        totalWords: data.text.split(/\s+/).length,
      },
      info: data.info,
      metadata: data.metadata
    });

  } catch (error) {
    console.error('Lỗi đọc PDF:', error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi đọc PDF", 
      error: error.message 
    });
  }
};

// ============================================
// API UPLOAD DOCUMENT VÀO RAG
// ============================================

export const uploadRagDocument = async (req, res) => {
  try {
    const { text, metadata } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu text document' 
      });
    }

    // Validate text length
    if (text.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text quá ngắn (tối thiểu 10 ký tự)' 
      });
    }

    const result = await uploadDocument(text, metadata);
    
    res.status(200).json({ 
      success: true, 
      message: 'Upload document thành công',
      data: result 
    });
  } catch (error) {
    console.error('Lỗi upload RAG:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};


// Controller cho query
export const queryRag = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Thiếu question' });
    }
    const result = await queryRAG(question);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Lỗi query RAG:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

