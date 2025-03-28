import { NextResponse } from 'next/server';
import { saveTestGenerationData } from '@/lib/firebase/firebaseUtils';

export async function GET(request: Request) {
  try {
    // Test saving some data to Firebase
    const testId = await saveTestGenerationData({
      url: "test-url-firebase-check",
      subject: "Test Subject",
      testQuestions: "Test Question 1\nTest Question 2",
      studentLevel: "Medium",
      questionCount: 2,
      isVideo: false,
      processingTime: 1000,
      errors: ["Test error"]
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Test data saved to Firebase",
      testId
    });
  } catch (error) {
    console.error("Error saving test data:", error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 