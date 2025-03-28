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
  writeBatch,
  serverTimestamp,
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

// Interface for relationships
export interface Relationship {
  id?: string;
  studentId?: string;
  teacherId?: string;
  managerId?: string;
  ownerId?: string;
  userId?: string; // Generic user ID for non-student relationships
  type: 'student-teacher' | 'student-manager' | 'student-owner' | 
        'teacher-manager' | 'teacher-owner' | 
        'manager-owner';
  createdAt: any;
}

/**
 * Create relationships for a new user based on their role
 * Students must have at least one teacher
 * All users are automatically linked to all managers and owners
 */
export const createUserRelationships = async (
  userId: string,
  userRole: UserProfileType,
  selectedTeachers?: string[]
): Promise<void> => {
  try {
    // Skip for visitors
    if (userRole === 'Visitor') {
      return;
    }

    console.log(`Creating relationships for ${userRole} with ID ${userId}`);
    const batch = writeBatch(db);
    const relationshipsRef = collection(db, 'relationships');

    // For students, create relationships with selected teachers
    if (userRole === 'Student') {
      // Validate at least one teacher is selected
      if (!selectedTeachers || selectedTeachers.length === 0) {
        throw new Error('Students must have at least one teacher assigned');
      }

      console.log(`Creating ${selectedTeachers.length} student-teacher relationships`);
      // Create student-teacher relationships
      for (const teacherId of selectedTeachers) {
        batch.set(doc(relationshipsRef), {
          studentId: userId,
          teacherId,
          type: 'student-teacher',
          createdAt: serverTimestamp()
        });
      }
    }

    // For all users, create relationships with managers and owners
    // First, fetch all managers
    const managersSnapshot = await getDocs(
      query(collection(db, 'users'), where('profileType', '==', 'Manager'))
    );

    // Create relationships with all managers
    managersSnapshot.forEach(managerDoc => {
      const managerId = managerDoc.id;
      
      if (userRole === 'Student') {
        batch.set(doc(relationshipsRef), {
          studentId: userId,
          managerId,
          type: 'student-manager',
          createdAt: serverTimestamp()
        });
      } else if (userRole === 'Teacher') {
        batch.set(doc(relationshipsRef), {
          teacherId: userId,
          managerId,
          type: 'teacher-manager',
          createdAt: serverTimestamp()
        });
      }
      // No relationship needed for manager-manager
    });

    // Fetch all owners
    const ownersSnapshot = await getDocs(
      query(collection(db, 'users'), where('profileType', '==', 'Owner'))
    );

    // Create relationships with all owners
    ownersSnapshot.forEach(ownerDoc => {
      const ownerId = ownerDoc.id;
      
      if (userRole === 'Student') {
        batch.set(doc(relationshipsRef), {
          studentId: userId,
          ownerId,
          type: 'student-owner',
          createdAt: serverTimestamp()
        });
      } else if (userRole === 'Teacher') {
        batch.set(doc(relationshipsRef), {
          teacherId: userId,
          ownerId,
          type: 'teacher-owner',
          createdAt: serverTimestamp()
        });
      } else if (userRole === 'Manager') {
        batch.set(doc(relationshipsRef), {
          managerId: userId,
          ownerId,
          type: 'manager-owner',
          createdAt: serverTimestamp()
        });
      }
    });

    // Commit all the relationship creations
    await batch.commit();
    console.log(`Successfully created relationships for user ${userId}`);
  } catch (error) {
    console.error('Error creating user relationships:', error);
    throw error;
  }
};

/**
 * Update relationships when a user's role changes
 */
export const updateUserRelationships = async (
  userId: string,
  oldRole: UserProfileType,
  newRole: UserProfileType,
  selectedTeachers?: string[]
): Promise<void> => {
  try {
    if (oldRole === newRole && newRole !== 'Student') {
      // No role change and not a student (student might just change teachers)
      return;
    }

    // Delete existing relationships
    await deleteUserRelationships(userId, oldRole);
    
    // Create new relationships based on new role
    await createUserRelationships(userId, newRole, selectedTeachers);
    
  } catch (error) {
    console.error('Error updating user relationships:', error);
    throw error;
  }
};

/**
 * Delete all relationships for a user
 */
export const deleteUserRelationships = async (
  userId: string,
  userRole: UserProfileType
): Promise<void> => {
  try {
    const relationshipsRef = collection(db, 'relationships');
    const batch = writeBatch(db);
    let relationshipsToDelete: any[] = [];

    if (userRole === 'Student') {
      // Find relationships where user is a student
      const studentRelationships = await getDocs(
        query(relationshipsRef, where('studentId', '==', userId))
      );
      relationshipsToDelete = [...relationshipsToDelete, ...studentRelationships.docs];
    } else if (userRole === 'Teacher') {
      // Find relationships where user is a teacher
      const teacherRelationships = await getDocs(
        query(relationshipsRef, where('teacherId', '==', userId))
      );
      relationshipsToDelete = [...relationshipsToDelete, ...teacherRelationships.docs];
    } else if (userRole === 'Manager') {
      // Find relationships where user is a manager
      const managerRelationships = await getDocs(
        query(relationshipsRef, where('managerId', '==', userId))
      );
      relationshipsToDelete = [...relationshipsToDelete, ...managerRelationships.docs];
    } else if (userRole === 'Owner') {
      // Find relationships where user is an owner
      const ownerRelationships = await getDocs(
        query(relationshipsRef, where('ownerId', '==', userId))
      );
      relationshipsToDelete = [...relationshipsToDelete, ...ownerRelationships.docs];
    }

    // Delete all relationships
    for (const doc of relationshipsToDelete) {
      batch.delete(doc.ref);
    }
    
    await batch.commit();
    console.log(`Deleted ${relationshipsToDelete.length} relationships for user ${userId}`);
  } catch (error) {
    console.error('Error deleting user relationships:', error);
    throw error;
  }
};

/**
 * Get all teachers associated with a student
 */
export const getStudentTeachers = async (studentId: string): Promise<string[]> => {
  try {
    const relationshipsRef = collection(db, 'relationships');
    const q = query(
      relationshipsRef, 
      where('studentId', '==', studentId),
      where('type', '==', 'student-teacher')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().teacherId);
  } catch (error) {
    console.error('Error getting student teachers:', error);
    throw error;
  }
};

/**
 * Get all students associated with a teacher
 */
export const getTeacherStudents = async (teacherId: string): Promise<string[]> => {
  try {
    const relationshipsRef = collection(db, 'relationships');
    const q = query(
      relationshipsRef, 
      where('teacherId', '==', teacherId),
      where('type', '==', 'student-teacher')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().studentId);
  } catch (error) {
    console.error('Error getting teacher students:', error);
    throw error;
  }
};

/**
 * Create all missing relationships to ensure data consistency 
 * (for existing users before this feature was implemented)
 */
export const updateAllExistingRelationships = async (): Promise<void> => {
  try {
    console.log('Updating all existing relationships...');
    const batch = writeBatch(db);
    const relationshipsRef = collection(db, 'relationships');
    
    // Get all users grouped by role
    const studentsSnapshot = await getDocs(
      query(collection(db, 'users'), where('profileType', '==', 'Student'))
    );
    const teachersSnapshot = await getDocs(
      query(collection(db, 'users'), where('profileType', '==', 'Teacher'))
    );
    const managersSnapshot = await getDocs(
      query(collection(db, 'users'), where('profileType', '==', 'Manager'))
    );
    const ownersSnapshot = await getDocs(
      query(collection(db, 'users'), where('profileType', '==', 'Owner'))
    );
    
    const students = studentsSnapshot.docs;
    const teachers = teachersSnapshot.docs;
    const managers = managersSnapshot.docs;
    const owners = ownersSnapshot.docs;
    
    console.log(`Found ${students.length} students, ${teachers.length} teachers, ${managers.length} managers, ${owners.length} owners`);
    
    // First, assign the first teacher to all students (as a starting point)
    if (teachers.length > 0 && students.length > 0) {
      const defaultTeacherId = teachers[0].id;
      
      for (const studentDoc of students) {
        const studentId = studentDoc.id;
        
        // Check if student already has any teacher
        const existingRelations = await getDocs(
          query(relationshipsRef, 
            where('studentId', '==', studentId),
            where('type', '==', 'student-teacher')
          )
        );
        
        if (existingRelations.empty) {
          // If no teacher assigned, assign the default one
          batch.set(doc(relationshipsRef), {
            studentId,
            teacherId: defaultTeacherId,
            type: 'student-teacher',
            createdAt: serverTimestamp()
          });
        }
      }
    }
    
    // Connect all students to all managers
    for (const studentDoc of students) {
      const studentId = studentDoc.id;
      
      for (const managerDoc of managers) {
        const managerId = managerDoc.id;
        
        batch.set(doc(relationshipsRef), {
          studentId,
          managerId,
          type: 'student-manager',
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Connect all teachers to all managers
    for (const teacherDoc of teachers) {
      const teacherId = teacherDoc.id;
      
      for (const managerDoc of managers) {
        const managerId = managerDoc.id;
        
        batch.set(doc(relationshipsRef), {
          teacherId,
          managerId,
          type: 'teacher-manager',
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Connect all students to all owners
    for (const studentDoc of students) {
      const studentId = studentDoc.id;
      
      for (const ownerDoc of owners) {
        const ownerId = ownerDoc.id;
        
        batch.set(doc(relationshipsRef), {
          studentId,
          ownerId,
          type: 'student-owner',
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Connect all teachers to all owners
    for (const teacherDoc of teachers) {
      const teacherId = teacherDoc.id;
      
      for (const ownerDoc of owners) {
        const ownerId = ownerDoc.id;
        
        batch.set(doc(relationshipsRef), {
          teacherId,
          ownerId,
          type: 'teacher-owner',
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Connect all managers to all owners
    for (const managerDoc of managers) {
      const managerId = managerDoc.id;
      
      for (const ownerDoc of owners) {
        const ownerId = ownerDoc.id;
        
        batch.set(doc(relationshipsRef), {
          managerId,
          ownerId,
          type: 'manager-owner',
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Commit all the relationship creations - may need to be done in chunks if too many
    await batch.commit();
    console.log('Successfully updated all existing relationships');
  } catch (error) {
    console.error('Error updating existing relationships:', error);
    throw error;
  }
};

/**
 * Saves test generation data to Firestore for analysis and debugging
 * This helps track AI outputs, transcripts, and other data for improving test generation
 */
export interface TestGenerationData {
  url: string;             // The original URL provided by the user
  transcript?: string;     // The extracted transcript or article content
  subject: string;         // The subject extracted or generated
  testQuestions: string;   // The generated test questions
  conversationTopics?: string; // The generated conversation topics
  teachingTips?: string;   // The generated teaching tips
  studentLevel: string;    // The student level (beginner, medium, advanced)
  studentId?: string;      // The student ID (if available)
  teacherId?: string;      // The teacher ID (if available)
  questionCount: number;   // The number of questions requested
  timestamp: any;          // Server timestamp for when it was saved
  isVideo: boolean;        // Whether it was a video or article
  processingTime?: number; // How long it took to generate everything (ms)
  errors?: string[];       // Any errors that occurred during generation
  transcriptSource?: string; // The source of the transcript (digitalocean, supadata, etc.)
  saveMethod?: string;     // How the data was saved (direct, helper)
}

/**
 * Save test generation data to Firestore for analysis
 * This is helpful for debugging issues with AI outputs and transcripts
 */
export const saveTestGenerationData = async (data: Omit<TestGenerationData, 'timestamp'>): Promise<string> => {
  try {
    const testDataCollection = collection(db, 'testGenerationData');
    
    // Add server timestamp
    const docWithTimestamp = {
      ...data,
      timestamp: serverTimestamp()
    };
    
    // Save to Firestore
    const docRef = await addDoc(testDataCollection, docWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error('Error saving test generation data:', error);
    // Don't throw - this is non-critical logging
    return 'error';
  }
};

/**
 * Retrieve test generation data for analysis
 * @param limit Maximum number of records to retrieve
 */
export const getTestGenerationData = async (limit: number = 100): Promise<TestGenerationData[]> => {
  try {
    const testDataCollection = collection(db, 'testGenerationData');
    const q = query(testDataCollection);
    const querySnapshot = await getDocs(q);
    
    const data = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as TestGenerationData
      }))
      .slice(0, limit);
    
    return data as TestGenerationData[];
  } catch (error) {
    console.error('Error getting test generation data:', error);
    return [];
  }
};
