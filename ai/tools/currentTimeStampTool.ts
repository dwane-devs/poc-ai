// This is a tool to generate the current timestamp. It is a simple tool that does not require any external dependencies. The tool is defined as a function that returns the current timestamp using the `Date` object in JavaScript./** @format */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const currentTimeStampTool = new DynamicStructuredTool({
    name: "current_timestamp",
    description: "display the current timestamp",
    schema: z.object({}),
    func: async () => {
      try {
        const timeStamp = new Date().toISOString();
   
        // Return results as formatted string
        return JSON.stringify(timeStamp, null, 2);
        
      } catch (error) {
        return `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });
  