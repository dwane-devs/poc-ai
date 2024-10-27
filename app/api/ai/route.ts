// src/app/api/ai/route.ts
import { startRunnable } from "@/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, thread_id } = await req.json();
    
    console.log("API route called");
    console.log("Received message:", { message, thread_id });
    
    if (!thread_id) {
      throw new Error("thread_id is required");
    }

    console.log("Starting AI processing with message:", message);
    const response = await startRunnable(message, thread_id);
    console.log("AI response:", response);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Error in AI route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
