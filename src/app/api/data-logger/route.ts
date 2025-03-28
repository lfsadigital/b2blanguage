import { NextResponse } from 'next/server';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export async function POST(request: Request) {
  console.log("Data Logger API: Starting request");
  
  try {
    // Get the data from the request
    const data = await request.json();
    console.log("Data received:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    console.log("Firebase config loaded:", firebaseConfig.projectId);

    // Initialize or get existing app
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log("Firebase app initialized");
    
    const db = getFirestore(app);
    console.log("Firestore instance obtained");
    
    // Add the collection name from the request or default to testGenerationData
    const collectionName = data.collection || 'testGenerationData';
    
    // Prepare the data for Firebase
    const cleanData = { ...data };
    
    // Remove the collection field as we don't want to store it
    delete cleanData.collection;
    
    // Remove any undefined values
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    // Add timestamps
    const dataWithTimestamp = {
      ...cleanData,
      timestamp: serverTimestamp(),
      savedAt: new Date().toISOString(),
      saveTimestamp: Date.now(),
      savedVia: 'data-logger-api'
    };
    
    console.log("Data prepared for Firebase");
    
    // Save to Firebase
    const docCollection = collection(db, collectionName);
    console.log(`Adding document to collection: ${collectionName}`);
    
    const docRef = await addDoc(docCollection, dataWithTimestamp);
    console.log(`Document saved with ID: ${docRef.id}`);
    
    return NextResponse.json({
      success: true,
      message: "Data logged successfully",
      docId: docRef.id
    });
  } catch (error) {
    console.error("Data logger error:", error);
    
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