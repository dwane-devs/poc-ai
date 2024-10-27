///ai/llm-model/openai.ts
import { ChatOpenAI } from "@langchain/openai";

const MODEL_NAME = "gpt-4o-mini";

export const llm = new ChatOpenAI({
  model: MODEL_NAME,
  temperature: 0,
});