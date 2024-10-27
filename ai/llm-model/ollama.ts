///ai/llm-model/ollama.ts
import { ChatOllama } from "@langchain/ollama";

const MODEL_NAME = "llama3.1";

export const llm = new ChatOllama({
  model: MODEL_NAME,
  temperature: 0,
});