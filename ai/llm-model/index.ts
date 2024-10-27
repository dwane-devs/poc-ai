// src/ai/llm-model/index.ts
import { tools } from "../tools";
// import { llm } from "./ollama";
import { llm } from "./openai";
export const model = llm.bindTools(tools);
