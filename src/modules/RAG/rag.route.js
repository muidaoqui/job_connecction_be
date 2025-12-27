import express from "express";
import {
    readPDF,
    uploadRagDocument,
    analyzeJD,
    optimizeJD,
    benchmarkSalaryController,
    chatWithHRAgent,
    getHistory,
    addDocumentsToVectorStore,
    getVectorStats
} from "./rag.controller.js";
import candidateAgentRoutes from "./candidate-agent.route.js";

const router = express.Router();

// ============================================
// EXISTING ROUTES
// ============================================

// Route đọc PDF
router.post("/read-pdf", readPDF);

// Route upload document vào RAG
router.post('/upload', uploadRagDocument);

// ============================================
// HR AGENT ROUTES
// ============================================

// Analyze Job Description
router.post('/hr-agent/analyze-jd', analyzeJD);

// Optimize Job Description
router.post('/hr-agent/optimize-jd', optimizeJD);

// Benchmark Salary
router.post('/hr-agent/benchmark-salary', benchmarkSalaryController);

// Chat with HR Agent
router.post('/hr-agent/chat', chatWithHRAgent);

// Get Agent History
router.get('/hr-agent/history/:sessionId', getHistory);

// ============================================
// VECTOR STORE ROUTES
// ============================================

// Add documents to vector store
router.post('/vector-store/add', addDocumentsToVectorStore);

// Get vector store statistics
router.get('/vector-store/stats', getVectorStats);

// ============================================
// CANDIDATE AGENT ROUTES
// ============================================

// Mount candidate agent routes
router.use(candidateAgentRoutes);

export default router;