import express from "express";
import { readPDF  } from "./rag.controller.js";
import { uploadRagDocument } from "./rag.controller.js";
const router = express.Router();

// Route đọc PDF
router.post("/read-pdf", readPDF);
// curl -X POST "http://localhost:8080/api/rags/read-pdf" \
//   -H "Content-Type: application/json" \
//   -d '{"filePath":"D:/Job_Connection/uploads/resumes/your_cv.pdf"}'
// curl -X POST http://localhost:8080/api/rags/preprocess-text \
//   -H "Content-Type: application/json" \
//   -d '{
//     "text": "Đây là một đoạn văn bản mẫu. Nó sẽ được xử lý! Bạn có thể kiểm tra kết quả?",
//     "chunkSize": 1000,
//     "chunkOverlap": 200
//   }'
// Route upload document vào RAG
router.post('/upload', uploadRagDocument);

// Route query RAG
// router.post('/query', queryRag);
export default router;