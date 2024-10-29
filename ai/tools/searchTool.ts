// src/ai/tools/searchTool.ts
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export const searchTool = new TavilySearchResults({
  maxResults: 5,
  
});