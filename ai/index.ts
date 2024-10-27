import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { callModel, shouldContinue, StateAnnotation } from "./agents";
import { toolNode } from "./tools";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";

// Define a new graph
export const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Initialize memory to persist state between graph runs
const checkpointer = new MemorySaver();

// Compile the graph once and reuse it
const app = workflow.compile({ checkpointer });

// Keep track of conversation histories in a more persistent way
const conversationHistories: Record<string, BaseMessage[]> = {};

export const startRunnable = async (query: string, thread_id: string) => {
  try {
    console.log("\n=== Starting new interaction ===");
    console.log("Thread ID:", thread_id);
    console.log("Query:", query);

    // Get or initialize conversation history
    if (!conversationHistories[thread_id]) {
      console.log("Initializing new conversation history for thread:", thread_id);
      conversationHistories[thread_id] = [];
    }

    // Log the current state
    console.log("Current history length:", conversationHistories[thread_id].length);
    console.log("Current history messages:", 
      conversationHistories[thread_id].map(m => ({
        role: m._getType(),
        content: m.content
      }))
    );

    // Add the new message
    const newMessage = new HumanMessage(query);
    conversationHistories[thread_id].push(newMessage);

    // Get response using the full history
    const result = await app.invoke(
      {
        messages: conversationHistories[thread_id],
      },
      { 
        configurable: { thread_id }
      }
    );

    // Update the conversation history with the full result
    conversationHistories[thread_id] = result.messages;

    console.log("Updated history length:", conversationHistories[thread_id].length);
    console.log("Full conversation history:", 
      conversationHistories[thread_id].map(m => ({
        role: m._getType(),
        content: m.content
      }))
    );

    return result.messages[result.messages.length - 1].content;
  } catch (error) {
    console.error("Error in startRunnable:", error);
    throw error;
  }
};
