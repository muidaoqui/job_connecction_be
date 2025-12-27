import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { franc } from "franc";
import {
  uploadDocument,
  analyzeJobDescription,
  optimizeJobDescription,
  benchmarkSalary,
  chatWithAgent,
  getAgentHistory,
  addToVectorStore,
  getVectorStoreStats
} from './rag.service.js';
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

/**
 * ============================================
 * HR AGENT CONTROLLERS
 * ============================================
 */

/**
 * Analyze Job Description
 * POST /api/rags/hr-agent/analyze-jd
 */
export const analyzeJD = async (req, res) => {
  try {
    const { jdText, metadata } = req.body;

    if (!jdText) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu jdText'
      });
    }

    if (jdText.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'JD text quá ngắn (tối thiểu 50 ký tự)'
      });
    }

    const analysis = await analyzeJobDescription(jdText, metadata || {});

    res.status(200).json({
      success: true,
      message: 'Phân tích JD thành công',
      data: analysis
    });
  } catch (error) {
    console.error('Lỗi analyze JD:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Optimize Job Description
 * POST /api/rags/hr-agent/optimize-jd
 */
export const optimizeJD = async (req, res) => {
  try {
    const { jdText, focusAreas } = req.body;

    if (!jdText) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu jdText'
      });
    }

    const suggestions = await optimizeJobDescription(jdText, focusAreas || []);

    res.status(200).json({
      success: true,
      message: 'Tối ưu JD thành công',
      data: suggestions
    });
  } catch (error) {
    console.error('Lỗi optimize JD:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Benchmark Salary
 * POST /api/rags/hr-agent/benchmark-salary
 */
export const benchmarkSalaryController = async (req, res) => {
  try {
    const { position, experience, location, skills } = req.body;

    if (!position || experience === undefined || !location) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: position, experience, location'
      });
    }

    const recommendation = await benchmarkSalary(
      position,
      experience,
      location,
      skills || []
    );

    res.status(200).json({
      success: true,
      message: 'Benchmark lương thành công',
      data: recommendation
    });
  } catch (error) {
    console.error('Lỗi benchmark salary:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Chat with HR Agent
 * POST /api/rags/hr-agent/chat
 */
export const chatWithHRAgent = async (req, res) => {
  try {
    const { message, sessionId, jdContext } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu message'
      });
    }

    const response = await chatWithAgent(message, sessionId || null, jdContext || null);

    res.status(200).json({
      success: true,
      message: 'Chat thành công',
      data: response
    });
  } catch (error) {
    console.error('Lỗi chat with agent:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Get Agent History
 * GET /api/rags/hr-agent/history/:sessionId
 */
export const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu sessionId'
      });
    }

    const history = await getAgentHistory(sessionId);

    res.status(200).json({
      success: true,
      message: 'Lấy history thành công',
      data: history
    });
  } catch (error) {
    console.error('Lỗi get history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Add documents to vector store
 * POST /api/rags/vector-store/add
 */
export const addDocumentsToVectorStore = async (req, res) => {
  try {
    const { collectionName, documents, metadatas } = req.body;

    if (!collectionName || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu collectionName hoặc documents (array)'
      });
    }

    const validCollections = ['marketTrends', 'jdTemplates', 'salaryData'];
    if (!validCollections.includes(collectionName)) {
      return res.status(400).json({
        success: false,
        message: `Collection không hợp lệ. Chọn: ${validCollections.join(', ')}`
      });
    }

    const result = await addToVectorStore(collectionName, documents, metadatas || null);

    res.status(200).json({
      success: true,
      message: 'Thêm documents thành công',
      data: result
    });
  } catch (error) {
    console.error('Lỗi add to vector store:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

/**
 * Get vector store statistics
 * GET /api/rags/vector-store/stats
 */
export const getVectorStats = async (req, res) => {
  try {
    const stats = await getVectorStoreStats();

    res.status(200).json({
      success: true,
      message: 'Lấy stats thành công',
      data: stats
    });
  } catch (error) {
    console.error('Lỗi get vector stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};
