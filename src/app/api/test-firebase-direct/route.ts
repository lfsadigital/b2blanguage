import { NextResponse } from 'next/server';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export async function GET(request: Request) {
  console.log("Starting direct Firebase test...");
  
  try {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    console.log("Firebase config:", JSON.stringify({
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey
    }));

    // Initialize or get existing app
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log("Firebase app initialized");
    
    const db = getFirestore(app);
    console.log("Firestore instance obtained");
    
    // Create test data structure exactly like in the test generator
    const testData = {
      url: "https://test-url.com/test",
      transcript: "This is a test transcript",
      subject: "Test Subject Direct",
      testQuestions: "Test question 1?\nTest question 2?",
      studentLevel: "intermediate",
      studentId: "test-student",
      teacherId: "test-teacher",
      questionCount: 2,
      isVideo: false,
      processingTime: 1000,
      transcriptSource: "test-source",
      savedFromRoute: "test-firebase-direct",
      version: "1.3.0",
      timestamp: new Date().toISOString(),
      saveMethod: "direct-test"
    };
    
    console.log("Test data prepared");
    
    // Add timestamp and save to Firebase
    const dataWithTimestamp = {
      ...testData,
      timestamp: serverTimestamp(),
      savedAt: new Date().toISOString()
    };
    
    console.log("Adding document to collection...");
    const testDataCollection = collection(db, 'testGenerationData');
    const docRef = await addDoc(testDataCollection, dataWithTimestamp);
    
    console.log(`Test data saved with ID: ${docRef.id}`);
    
    // Verify the data was saved by trying one more simple save
    const simpleData = {
      test: "simple-test",
      timestamp: new Date().toISOString(),
      savedAt: new Date().toISOString()
    };
    
    console.log("Adding simple document...");
    const simpleDocRef = await addDoc(testDataCollection, simpleData);
    console.log(`Simple data saved with ID: ${simpleDocRef.id}`);
    
    return NextResponse.json({
      success: true,
      message: "Direct Firebase test successful",
      docId: docRef.id,
      simpleDocId: simpleDocRef.id
    });
  } catch (error) {
    console.error("Firebase direct test error:", error);
    
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 