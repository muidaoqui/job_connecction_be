// import express from "express";
// import { 
//   translateController, 
//   summarizeController, 
//   testController,
//   modelInfoController 
// } from "./translate.controller.js";

// const router = express.Router();

// // Main endpoints
// router.post("/translate", translateController);
// router.post("/summarize", summarizeController);

// // Debug/Test endpoints
// router.post("/test", testController);
// router.get("/model-info", modelInfoController);

// // Health check
// router.get("/health", (req, res) => {
//   res.json({ 
//     success: true, 
//     message: "Translation API with Qwen 2.5 is running",
//     model: "qwen2.5-1.5b-instruct-cuda-gpu:4",
//     endpoints: {
//       translate: "POST /api/translate",
//       summarize: "POST /api/summarize",
//       test: "POST /api/test",
//       modelInfo: "GET /api/model-info",
//       health: "GET /api/health"
//     }
//   });
// });

// export default router;