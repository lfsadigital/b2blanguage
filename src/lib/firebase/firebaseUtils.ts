import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { UserProfileType } from '../contexts/AuthContext';

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document written with ID: ${docRef.id}`);
    return docRef;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  try {
    console.log(`Starting upload for file ${file.name} to path ${path}`);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded a blob or file!', snapshot);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('File download URL:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Interface for user data
interface UserData {
  id?: string;  // Make id optional
  email: string;
  displayName?: string;
  profileType: UserProfileType;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Create or update a user in Firestore
 * @param email User's email
 * @param data User data to store
 */
export const saveUserToFirestore = async (
  email: string, 
  data: Partial<UserData>
): Promise<void> => {
  try {
    // Check if a user with this email already exists
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing user
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        ...data,
        lastLogin: new Date(),
      });
      console.log('Updated existing user profile for:', email);
    } else {
      // Create new user
      await addDoc(collection(db, 'users'), {
        email,
        profileType: 'Visitor', // Default to Visitor for new users
        createdAt: new Date(),
        lastLogin: new Date(),
        ...data,
      });
      console.log('Created new user profile for:', email);
    }
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
};

/**
 * Get a user's profile from Firestore
 * @param email User's email
 * @returns User data
 */
export const getUserProfile = async (email: string): Promise<UserData | null> => {
  try {
    // Query the users collection for a document where the email field matches
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Get the first matching document
      const userDoc = querySnapshot.docs[0];
      // Return the data with the document ID
      return { id: userDoc.id, ...userDoc.data() } as UserData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update a user's profile type
 * @param email User's email
 * @param profileType New profile type
 */
export const updateUserProfileType = async (
  email: string, 
  profileType: UserProfileType
): Promise<void> => {
  try {
    // Find the user document by email field
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Get the first matching document
      const userDoc = querySnapshot.docs[0];
      // Update the profileType field
      await updateDoc(doc(db, 'users', userDoc.id), { profileType });
    } else {
      console.error('User not found for email:', email);
    }
  } catch (error) {
    console.error('Error updating user profile type:', error);
    throw error;
  }
};
