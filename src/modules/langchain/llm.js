import { ChatOpenAI } from "@langchain/openai";
import { FoundryLocalManager } from "foundry-local-sdk";

const alias = "qwen2.5-1.5b-instruct-cuda-gpu:4";
const manager = new FoundryLocalManager();

let llm;

export async function getLLM() {
  if (!llm) {
    const modelInfo = await manager.init(alias);

    llm = new ChatOpenAI({
      modelName: modelInfo.id,
      temperature: 0.7,
      maxTokens: 400,
      openAIApiKey: manager.apiKey,
      configuration: {
        baseURL: manager.endpoint
      }
    });
  }
  return llm;
}
