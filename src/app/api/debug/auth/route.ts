import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "This is a debug endpoint for authentication issues",
    instructions: "Please check your browser console when accessing the Class Diary page for logs"
  });
} 