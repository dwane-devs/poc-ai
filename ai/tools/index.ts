// src/ai/tools/index.ts
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { searchTool } from "./searchTool";
import { sqlDBSearchTool } from "./sqlDBsearchTool";
import { currentTimeStampTool } from "./currentTimeStampTool";

export const tools = [searchTool, sqlDBSearchTool, currentTimeStampTool];
export const toolNode = new ToolNode(tools);