"use client";

import React, { createContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { getUserProfile, saveUserToFirestore, updateUserProfileType } from "../firebase/firebaseUtils";

// Define available user profile types
export type UserProfileType = 'Visitor' | 'Owner' | 'Manager' | 'Teacher' | 'Student';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileType;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profileType: UserProfileType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: 'Visitor',
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileType>('Visitor');
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile from database
  const fetchUserProfile = async (user: User) => {
    try {
      if (!user.email) return 'Visitor';
      
      // Get the user profile from Firestore
      const profile = await getUserProfile(user.email);
      
      // If user exists and has a profile type, return it
      if (profile && profile.profileType) {
        return profile.profileType;
      }
      
      // If user doesn't exist, create a new one with 'Visitor' profile
      await saveUserToFirestore(user.email, {
        displayName: user.displayName || undefined,
        profileType: 'Visitor'
      });
      
      return 'Visitor';
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return 'Visitor';
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Look up the user's profile in the database
        const profileType = await fetchUserProfile(user);
        setUserProfile(profileType);
        
        // Update the user's last login time
        if (user.email) {
          await saveUserToFirestore(user.email, { lastLogin: new Date() });
        }
      } else {
        setUserProfile('Visitor');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);
      
      // Display the error in a more user-friendly way
      if (error.code === 'auth/popup-closed-by-user') {
        alert('Sign-in popup was closed before completing the sign-in process.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Previous popup request was cancelled');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for OAuth operations. Add your domain to the authorized domains list in the Firebase console.');
      } else {
        alert(`Sign-in error: ${error.message}`);
      }
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile('Visitor');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };
  
  const updateUserProfile = async (profileType: UserProfileType) => {
    setUserProfile(profileType);
    
    // Save to the database
    if (user && user.email) {
      try {
        await updateUserProfileType(user.email, profileType);
      } catch (error) {
        console.error("Error updating user profile:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signInWithGoogle, 
      signOut: signOutUser,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
