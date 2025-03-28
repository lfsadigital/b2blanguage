import { NextResponse } from 'next/server';
import { saveTestGenerationData } from '@/lib/firebase/firebaseUtils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Direct Firebase data saving function
async function saveTestData(data: any): Promise<string> {
  try {
    // Initialize Firebase directly
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize or get existing app
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    
    // Add a timestamp
    const dataWithTimestamp = {
      ...data,
      timestamp: serverTimestamp(),
      savedAt: new Date().toISOString()
    };
    
    // Add to the test data collection
    const testDataCollection = collection(db, 'testGenerationData');
    const docRef = await addDoc(testDataCollection, dataWithTimestamp);
    console.log(`Test data saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving test data directly:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    console.log("Testing Firebase connection...");
    
    // Try helper method
    const helperResult = await saveTestGenerationData({
      url: "test-endpoint",
      subject: "Test",
      testQuestions: "This is a test entry",
      studentLevel: "test",
      questionCount: 0,
      isVideo: false,
      processingTime: 0
    });
    
    // Try direct method
    const directResult = await saveTestData({
      url: "test-endpoint-direct",
      subject: "Test Direct",
      testQuestions: "This is a direct test entry",
      studentLevel: "test",
      questionCount: 0,
      isVideo: false
    });
    
    return NextResponse.json({
      success: true,
      message: "Firebase test completed",
      helperResult,
      directResult
    });
  } catch (error) {
    console.error("Firebase test error:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 