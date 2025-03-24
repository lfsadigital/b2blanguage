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
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Interface for user data
interface UserData {
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
    const userRef = doc(db, 'users', email);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...data,
        lastLogin: new Date(),
      });
    } else {
      // Create new user
      await setDoc(userRef, {
        email,
        profileType: 'Visitor', // Default to Visitor for new users
        createdAt: new Date(),
        lastLogin: new Date(),
        ...data,
      });
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
    const userRef = doc(db, 'users', email);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
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
    const userRef = doc(db, 'users', email);
    await updateDoc(userRef, { profileType });
  } catch (error) {
    console.error('Error updating user profile type:', error);
    throw error;
  }
};
