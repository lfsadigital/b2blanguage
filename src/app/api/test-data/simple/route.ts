import { NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from "firebase/app";

export async function GET(request: Request) {
  try {
    // Print environment variables (redacted for security)
    console.log("Firebase Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.substring(0, 3) + "...");
    console.log("Firebase Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.substring(0, 3) + "...");
    
    // Initialize Firebase directly in this function to ensure it works
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize Firebase if not already initialized
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    
    // Try to write to a test collection
    const testData = {
      message: "Test from simple endpoint",
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      testType: "simple"
    };
    
    // Attempt to write to the database
    const docRef = await addDoc(collection(db, "testData"), testData);
    
    return NextResponse.json({
      success: true,
      message: "Test data saved successfully",
      docId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in simple test:", error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 