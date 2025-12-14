import { FoundryLocalManager } from "foundry-local-sdk";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const alias = "qwen2.5-0.5b";
const foundryLocalManager = new FoundryLocalManager();
let modelInfo = null;
let llm = null;
let prompt = null;

async function initModel() {
  if (!modelInfo) {
    modelInfo = await foundryLocalManager.init(alias);
    llm = new ChatOpenAI({
      model: modelInfo.id,
      configuration: {
        baseURL: foundryLocalManager.endpoint,
        apiKey: foundryLocalManager.apiKey,
      },
      temperature: 0.6,
      streaming: false,
    });
    prompt = ChatPromptTemplate.fromMessages([
      {
        role: "system",
        content: "You are a helpful assistant that translates {input_language} to {output_language}",
      },
      {
        role: "user",
        content: "{input}",
      },
    ]);
  }
}

export async function translateText(input, input_language = "English", output_language = "Vietnamese") {
  await initModel();
  const chain = prompt.pipe(llm);
  const aiMsg = await chain.invoke({
    input_language,
    output_language,
    input,
  });
  return aiMsg.content;
}

export async function summarizeText(input, language = "Vietnamese") {
  await initModel();
  const summaryPrompt = ChatPromptTemplate.fromMessages([
    {
      role: "system",
      content: "You are a helpful assistant that summarizes {language} text.",
    },
    {
      role: "user",
      content: "{input}",
    },
  ]);
  const chain = summaryPrompt.pipe(llm);
  const aiMsg = await chain.invoke({
    language,
    input,
  });
  return aiMsg.content;
}

export const summarizeController = async (req, res) => {
  try {
    const { text, language = "Vietnamese" } = req.body;
    if (!text) return res.status(400).json({ message: "Missing text" });
    const result = await summarizeText(text, language);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: "Summarization error", error: err.message });
  }
};