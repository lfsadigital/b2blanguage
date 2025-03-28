import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Define a type for our document data
interface FirestoreDocument {
  id: string;
  timestamp?: Date | unknown;
  savedAt?: string;
  [key: string]: any; // Allow for other fields
}

export async function GET(request: Request) {
  console.log("Starting Firebase debug...");
  
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
    
    // Get collection to query
    const url = new URL(request.url);
    const collectionName = url.searchParams.get('collection') || 'testGenerationData';
    const limitParam = parseInt(url.searchParams.get('limit') || '10');
    
    console.log(`Firebase config loaded: ${firebaseConfig.projectId}`);
    console.log(`Reading from collection: ${collectionName}`);

    // Initialize or get existing app
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log("Firebase app initialized");
    
    const db = getFirestore(app);
    console.log("Firestore instance obtained");
    
    // Get the latest entries from the collection
    const dataCollection = collection(db, collectionName);
    console.log(`Created collection reference for: ${collectionName}`);
    
    // Query with ordering and limit
    const q = query(dataCollection, orderBy('timestamp', 'desc'), limit(limitParam));
    console.log(`Created query with limit: ${limitParam}`);
    
    const querySnapshot = await getDocs(q);
    console.log(`Got query snapshot with ${querySnapshot.size} documents`);
    
    // Format documents for response
    const documents: FirestoreDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        savedAt: data.savedAt || 'unknown'
      });
    });
    
    return NextResponse.json({
      success: true,
      message: "Retrieved latest documents",
      count: documents.length,
      collection: collectionName,
      documents
    });
  } catch (error) {
    console.error("Firebase debug error:", error);
    
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