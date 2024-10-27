// src/ai/tools/index.ts
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { searchTool } from "./searchTool";
import { sqlDBSearchTool } from "./sqlDBsearchTool";

export const tools = [searchTool, sqlDBSearchTool];
export const toolNode = new ToolNode(tools);