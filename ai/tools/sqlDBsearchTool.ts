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
      //

      // Execute query
      const results = await db.all(query);

      if (!results) {
        // Create the users table
        await db.exec(`
          -- Create the users table
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                first_name TEXT,
                last_name TEXT,
                birthday DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Create an index on the username and email columns for faster lookups
            CREATE INDEX idx_username ON users (username);
            CREATE INDEX idx_email ON users (email);

            -- Insert dummy data
            INSERT INTO users (username, email, first_name, last_name, birthday)
            VALUES 
            ('john_doe', 'john.doe@example.com', 'John', 'Doe', '1990-02-12'),
            ('jane_doe', 'jane.doe@example.com', 'Jane', 'Doe', '1995-08-25'),
            ('alice_smith', 'alice.smith@example.com', 'Alice', 'Smith', '1980-01-01'),
            ('bob_johnson', 'bob.johnson@example.com', 'Bob', 'Johnson', '1985-04-15'),
            ('charlie_brown', 'charlie.brown@example.com', 'Charlie', 'Brown', '1992-10-31');
        `);
        console.log("Created 'users' table.");
      } else {
        console.log("'users' table already exists.");
      }
      
      // Close connection
      await db.close();

      // Return results as formatted string
      return JSON.stringify(results, null, 2);
      
    } catch (error) {
      return `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});
