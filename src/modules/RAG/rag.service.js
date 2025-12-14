// rag.service.js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
// import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { Document } from "@langchain/core/documents";
// import { ChatOpenAI } from '@langchain/openai'; // Hoặc thay bằng LLM local như Ollama nếu cần fully local
// import { RetrievalQAChain } from 'langchain/chains';
// import fs from 'fs/promises';
// import path from 'path';

// Khởi tạo embeddings local (sử dụng model từ HuggingFace, chạy local qua Transformers.js)
// const embeddings = new HuggingFaceTransformersEmbeddings({
//   model: 'Xenova/all-MiniLM-L6-v2', // Model embedding nhỏ, multilingual, chạy local
// });

// Vector store local (HNSWLib - lưu trên disk)
// let vectorStore = null;
// const vectorStorePath = path.join(__dirname, '../../vectorstore'); // Lưu local

// // Hàm load hoặc init vector store
// async function loadVectorStore() {
//   if (vectorStore) return vectorStore;
//   if (fs.existsSync(vectorStorePath)) {
//     vectorStore = await HNSWLib.load(vectorStorePath, embeddings);
//   } else {
//     vectorStore = await HNSWLib.fromDocuments([], embeddings);
//     await vectorStore.save(vectorStorePath);
//   }
//   return vectorStore;
// }
/**
 * Upload document và chia thành chunks
 * @param {string} text - Nội dung document
 * @param {object} metadata - Metadata (fileName, userId, etc.)
 * @returns {Promise<object>} - Kết quả upload
 */
// Hàm upload và process document (ví dụ text từ PDF đã extract)
export async function uploadDocument(text, metadata = {}) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.splitDocuments([
    new Document({ pageContent: text, metadata }),
  ]);

  // TODO: Uncomment khi đã setup vector store
  // const store = await loadVectorStore();
  // await store.addDocuments(docs);
  // await store.save(vectorStorePath);

  return { 
    success: true, 
    chunks: docs.length,
    chunkDetails: docs.map((doc, idx) => ({
      chunkId: idx,
      length: doc.pageContent.length,
      preview: doc.pageContent,
    }))
  };
}

// Hàm query RAG
// export async function queryRAG(question) {
//   const store = await loadVectorStore();

//   // LLM (sử dụng OpenAI làm ví dụ; thay bằng Ollama cho local: new Ollama({ model: 'llama3' }))
//   const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

//   // Chain RAG đơn giản
//   const chain = RetrievalQAChain.fromLLM(llm, store.asRetriever(4), {
//     returnSourceDocuments: true,
//   });

//   const result = await chain.invoke({ query: question });
//   return {
//     answer: result.text,
//     sources: result.sourceDocuments.map(doc => doc.metadata),
//   };
// }

