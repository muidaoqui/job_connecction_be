import { translateText, summarizeText, testModel, getModelInfo } from "./translate.service.js";

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
    const { text, language = "Vietnamese" } = req.body;
    
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
    const result = await summarizeText(text, language);
    const duration = Date.now() - startTime;
    
    console.log(`Summarization completed in ${duration}ms`);
    
    res.json({ 
      success: true,
      result,
      language,
      input_length: text.length,
      output_length: result.length,
      compression_ratio: (text.length / result.length).toFixed(2),
      duration_ms: duration
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