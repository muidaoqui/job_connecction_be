import { translateText, summarizeText, testModel, getModelInfo, generateText } from "./llm.service.js";

export const translateController = async (req, res) => {
  try {
    const { text, input_language = "English", output_language = "Vietnamese" } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: "Missing or invalid text parameter"
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Text cannot be empty"
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Text too long. Maximum 2000 characters allowed."
      });
    }

    console.log(`[${new Date().toISOString()}] Translating ${text.length} chars from ${input_language} to ${output_language}`);
    
    const startTime = Date.now();
    const result = await translateText(text, input_language, output_language);
    const duration = Date.now() - startTime;
    
    console.log(`Translation completed in ${duration}ms`);
    
    res.json({ 
      success: true,
      result,
      input_language,
      output_language,
      input_length: text.length,
      output_length: result.length,
      duration_ms: duration
    });
  } catch (err) {
    console.error("Translation controller error:", err);
    res.status(500).json({ 
      success: false,
      message: "Translation error", 
      error: err.message 
    });
  }
};

export const summarizeController = async (req, res) => {
  try {
    const { text, language = "Vietnamese", translateToVietnamese = true } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: "Missing or invalid text parameter"
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Text cannot be empty"
      });
    }

    if (text.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Text too long. Maximum 3000 characters allowed."
      });
    }

    console.log(`[${new Date().toISOString()}] Summarizing ${text.length} chars in ${language}`);
    
    const startTime = Date.now();
    
    // Bước 1: Tóm tắt văn bản
    const summary = await summarizeText(text, language);
    
    let result = summary;
    let translated = null;
    
    // Bước 2: Nếu cần dịch sang tiếng Việt và văn bản không phải tiếng Việt
    if (translateToVietnamese && language !== "Vietnamese") {
      console.log('Translating summary to Vietnamese...');
      try {
        translated = await translateText(summary, language, "Vietnamese");
        result = translated; // Kết quả cuối cùng là bản dịch
      } catch (translateErr) {
        console.error("Translation error:", translateErr);
        // Nếu dịch lỗi, vẫn trả về bản tóm tắt gốc
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`Summarization ${translated ? '+ Translation ' : ''}completed in ${duration}ms`);
    
    res.json({ 
      success: true,
      result, // Kết quả cuối cùng (đã dịch nếu có)
      summary: summary, // Bản tóm tắt gốc
      translated: translated, // Bản dịch (nếu có)
      language,
      input_length: text.length,
      output_length: result.length,
      compression_ratio: (text.length / result.length).toFixed(2),
      duration_ms: duration,
      was_translated: !!translated
    });
  } catch (err) {
    console.error("Summarization controller error:", err);
    res.status(500).json({ 
      success: false,
      message: "Summarization error", 
      error: err.message 
    });
  }
};

export const testController = async (req, res) => {
  try {
    const { prompt = "Hello", use_system = true } = req.body;
    
    console.log(`Testing model with prompt: "${prompt}"`);
    const result = await testModel(prompt, use_system);
    
    res.json({ 
      success: true,
      prompt,
      result,
      used_system_role: use_system
    });
  } catch (err) {
    console.error("Test controller error:", err);
    res.status(500).json({ 
      success: false,
      message: "Test error", 
      error: err.message 
    });
  }
};

export const modelInfoController = async (req, res) => {
  try {
    const info = await getModelInfo();
    res.json({
      success: true,
      model: info
    });
  } catch (err) {
    console.error("Model info error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get model info",
      error: err.message
    });
  }
};

export const generateTextController = async (req, res) => {
  try {
    const { prompt, maxTokens = 150 } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid prompt"
      });
    }
    const startTime = Date.now();
    const result = await generateText(prompt, maxTokens);
    const duration = Date.now() - startTime;
    res.json({
      success: true,
      result,
      prompt,
      maxTokens,
      output_length: result.length,
      duration_ms: duration
    });
  } catch (err) {
    console.error("Generate text controller error:", err);
    res.status(500).json({
      success: false,
      message: "Text generation error",
      error: err.message
    });
  }
};