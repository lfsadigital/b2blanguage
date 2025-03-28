import admin from 'firebase-admin';

// Server-side Firebase Admin SDK setup

// Check if app is already initialized to avoid duplicate initialization
const getOrInitializeApp = () => {
  if (admin.apps.length === 0) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;
      
      // Initialize with service account if available
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
        console.log("Firebase admin initialized with service account");
      } 
      // Otherwise, try to initialize with default credentials (works in Vercel)
      else {
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
        console.log("Firebase admin initialized with default credentials");
      }
    } catch (error) {
      console.error("Error initializing Firebase admin:", error);
    }
  }
  return admin;
};

// Get references to services
const adminApp = getOrInitializeApp();
const auth = adminApp.auth();
const db = adminApp.firestore();
const storage = adminApp.storage();

// Add a server-side function to save data with admin privileges
export const saveFirestoreDataAdmin = async (
  collection: string,
  data: any
): Promise<string> => {
  try {
    const docRef = await db.collection(collection).add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdWithAdmin: true
    });
    console.log(`Document written with ID: ${docRef.id} using admin SDK`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collection}:`, error);
    throw error;
  }
};

export { adminApp, auth, db, storage }; 