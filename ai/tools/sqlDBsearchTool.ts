import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Define the database path
const dbPath = '../../../user.db';

// Define the tool with structured input schema
export const sqlDBSearchTool = new DynamicStructuredTool({
  name: "sqlite_search",
  description: "Search the local SQLite database for user information",
  schema: z.object({
    query: z.string().describe("The SQL query to execute on the database"),
    return_direct: z.boolean()
      .describe("Whether to return the result directly to the user")
      .default(false),
  }),
  func: async ({ query }: { query: string }) => {
    try {
      // Open database connection
      const db = await open({
        filename: path.resolve(process.cwd(), dbPath),
        driver: sqlite3.Database
      });

      // Execute query
      const results = await db.all(query);
      
      // Close connection
      await db.close();

      // Return results as formatted string
      return JSON.stringify(results, null, 2);
      
    } catch (error) {
      return `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});
