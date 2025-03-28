import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface CollectionInfo {
  exists: boolean;
  count: number;
  readSuccessful: boolean;
}

interface CollectionsRecord {
  [key: string]: CollectionInfo | { message: string; readSuccessful: false };
}

interface WriteTestResult {
  success: boolean;
  docId?: string;
  error?: string;
}

interface FirebaseTestResults {
  firebaseConfig: {
    projectId: string;
    authDomain: string;
    apiKey: string;
  };
  collections: CollectionsRecord;
  writeTest: WriteTestResult | null;
}

export async function GET(request: Request) {
  try {
    // Test direct Firestore operations
    const results: FirebaseTestResults = {
      firebaseConfig: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not-set',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'not-set',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'set' : 'not-set',
      },
      collections: {},
      writeTest: null
    };

    // Try to read collections
    try {
      const testCollections = ['users', 'testGenerationData'];
      for (const collName of testCollections) {
        const snapshot = await getDocs(collection(db, collName));
        results.collections[collName] = {
          exists: true,
          count: snapshot.size,
          readSuccessful: true
        };
      }
    } catch (readError) {
      results.collections['error'] = {
        message: (readError as Error).message,
        readSuccessful: false
      };
    }

    // Try to write test data directly
    try {
      const testCollection = collection(db, 'testGenerationData');
      const testDoc = await addDoc(testCollection, {
        url: 'direct-write-test',
        subject: 'Firebase Test',
        testQuestions: 'Test question',
        studentLevel: 'N/A',
        questionCount: 1,
        isVideo: false,
        timestamp: new Date(),
      });
      
      results.writeTest = {
        success: true,
        docId: testDoc.id
      };
    } catch (writeError) {
      results.writeTest = {
        success: false,
        error: (writeError as Error).message
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Firebase connection failed',
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
} 