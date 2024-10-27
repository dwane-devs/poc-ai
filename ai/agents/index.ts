// src/ai/agents/index.ts

import {
  AIMessage,
  BaseMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { model } from "../llm-model";

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => {
      console.log("Reducing messages:");
      console.log("Previous:", x.length, "messages");
      console.log("New:", y.length, "messages");
      const result = x.concat(y);
      console.log("Combined:", result.length, "messages");
      return result;
    },
  })
});

// Define the function that determines whether to continue or not
export function shouldContinue(state: typeof StateAnnotation.State) {
  console.log("Checking continuation...");
  const messages = state.messages;
  console.log("Messages in state:", messages.length);
  
  const lastMessage = messages[messages.length - 1] as AIMessage;
  console.log("Last message type:", lastMessage._getType());

  if (lastMessage.tool_calls?.length) {
    console.log("Continuing to tools");
    return "tools";
  }
  console.log("Ending conversation turn");
  return "__end__";
}

// Define the function that calls the model
export async function callModel(state: typeof StateAnnotation.State) {
  console.log("\n=== Calling Model ===");
  const messages = state.messages;
  console.log("Input messages count:", messages.length);
  
  // Create system message
  const systemMessage = new SystemMessage(
    `You are a helpful assistant with memory of the conversation. 
     You remember details that users share with you and can refer back to them.
     You can search the internet and get data then make summary and solve questions by thinking step by step. 
     If after thinking thoroughly you are not able to solve the question then you can say "I don't know" 
     and you can also ask for more information if needed.`
  );

  // Combine system message with conversation history
  const fullMessages = [systemMessage, ...messages];
  console.log("Full messages to model:", fullMessages.length);
  
  const response = await model.invoke(fullMessages);
  console.log("Got response from model:", response.content);

  return { messages: [response] };
}
