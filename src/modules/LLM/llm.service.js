
import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";
import dotenv from "dotenv";
dotenv.config();

// Lấy alias từ biến môi trường
const alias = process.env.MODEL_ALIAS || "qwen2.5-1.5b-instruct-generic-gpu:4";
const foundryLocalManager = new FoundryLocalManager();
let modelInfo = null;
let openai = null;

async function initModel() {
  if (!modelInfo) {
    try {
      console.log("Initializing Qwen model with alias:", alias);
      
      modelInfo = await foundryLocalManager.init(alias);
      console.log("Model Info:", {
        alias: modelInfo.alias,
        id: modelInfo.id,
        version: modelInfo.version,
        deviceType: modelInfo.deviceType,
        modelSize: modelInfo.modelSize,
        task: modelInfo.task
      });
      
      openai = new OpenAI({
        baseURL: foundryLocalManager.endpoint,
        apiKey: foundryLocalManager.apiKey,
      });
      
      console.log("Model ready!");
      console.log("Endpoint:", foundryLocalManager.endpoint);
      
      // Test model với prompt đơn giản
      try {
        const testResponse = await openai.chat.completions.create({
          model: modelInfo.id,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant."
            },
            {
              role: "user",
              content: "Say hello"
            }
          ],
          max_tokens: 50,
          temperature: 0.7,
        });
        console.log("Model test successful:", testResponse.choices[0].message.content?.substring(0, 100));
      } catch (testErr) {
        console.error("Model test failed:", testErr);
      }
      
    } catch (error) {
      console.error("Failed to initialize model:", error);
      throw new Error(`Model initialization failed: ${error.message}`);
    }
  }
}

export async function translateText(input, input_language = "English", output_language = "Vietnamese") {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    throw new Error("Input text is required and must be a non-empty string");
  }
  
  await initModel();
  
  // Giới hạn độ dài input
  const maxInputLength = 1000;
  const truncatedInput = input.length > maxInputLength 
    ? input.substring(0, maxInputLength) 
    : input;
  
  try {
    console.log(`Translating ${truncatedInput.length} chars from ${input_language} to ${output_language}...`);
    
    // Qwen model hỗ trợ system role tốt
    const response = await openai.chat.completions.create({
      model: modelInfo.id,
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate from ${input_language} to ${output_language}. Only output the translation, nothing else.`
        },
        {
          role: "user",
          content: truncatedInput.trim()
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
      top_p: 0.8,
    });
    
    const result = response.choices[0].message.content.trim();
    console.log(`Translation result: ${result.substring(0, 100)}...`);
    return result;
    
  } catch (error) {
    console.error("Translation error:", {
      message: error.message,
      status: error.status,
      inputLength: truncatedInput.length
    });
    throw new Error(`Translation failed: ${error.message}`);
  }
}

export async function summarizeText(input, language = "Vietnamese") {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    throw new Error("Input text is required and must be a non-empty string");
  }
  
  await initModel();
  
  // Giới hạn input cho summarization
  const maxInputLength = 1500;
  const truncatedInput = input.length > maxInputLength 
    ? input.substring(0, maxInputLength) + "..." 
    : input;
  
  try {
    console.log(`Summarizing ${truncatedInput.length} chars in ${language}...`);
    
    const response = await openai.chat.completions.create({
      model: modelInfo.id,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that creates concise summaries in ${language}.`
        },
        {
          role: "user",
          content: `Please summarize the following text concisely:\n\n${truncatedInput.trim()}`
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
      top_p: 0.9,
    });
    
    const result = response.choices[0].message.content.trim();
    console.log(`Summary result: ${result.substring(0, 100)}...`);
    return result;
    
  } catch (error) {
    console.error("Summarization error:", {
      message: error.message,
      status: error.status,
      inputLength: truncatedInput.length
    });
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

export async function generateText(prompt, maxTokens = 150) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error("Prompt is required and must be a non-empty string");
  }
  await initModel();
  try {
    console.log(`Generating text for prompt of length ${prompt.length}...`);
    
    const response = await openai.chat.completions.create({ 
      model: modelInfo.id,
      messages: [
        {
          role: "user",
          content: prompt.trim()
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.9,
    }); 
    const result = response.choices[0].message.content.trim();
    console.log(`Generated text: ${result.substring(0, 100)}...`);
    return result;
  } catch (error) {
    console.error("Text generation error:", {
      message: error.message,
      status: error.status,
      promptLength: prompt.length
    });
    throw new Error(`Text generation failed: ${error.message}`);
  }
}

// Function để test model trực tiếp
export async function testModel(prompt = "Hello, how are you?", useSystem = true) {
  await initModel();
  
  try {
    const messages = useSystem 
      ? [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ]
      : [
          { role: "user", content: prompt }
        ];
    
    const response = await openai.chat.completions.create({
      model: modelInfo.id,
      messages: messages,
      temperature: 0.7,
      max_tokens: 150,
    });
    
    const result = response.choices[0].message.content;
    console.log("Test result:", result);
    return result;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}

// Function để lấy thông tin model
export async function getModelInfo() {
  await initModel();
  return {
    alias: modelInfo.alias,
    id: modelInfo.id,
    version: modelInfo.version,
    deviceType: modelInfo.deviceType,
    executionProvider: modelInfo.executionProvider,
    modelSize: modelInfo.modelSize,
    task: modelInfo.task,
    endpoint: foundryLocalManager.endpoint
  };
}

export async function shutdownModel() {
  if (foundryLocalManager) {
    try {
      await foundryLocalManager.shutdown();
      console.log("Model shutdown successfully");
      modelInfo = null;
      openai = null;
    } catch (error) {
      console.error("Failed to shutdown model:", error);
    }
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await shutdownModel();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await shutdownModel();
  process.exit(0);
});