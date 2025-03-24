'use client';

import { useAuth } from '../lib/hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';

export default function HomeSignInButton() {
  const { user, signInWithGoogle, loading } = useAuth();
  
  // Hide button if user is already logged in
  if (user || loading) {
    return null;
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center px-6 py-3 bg-white border border-gray-300 rounded-md shadow-md text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      aria-label="Sign in with Google"
    >
      <FcGoogle className="w-6 h-6 mr-3" />
      Sign in with Google
    </button>
  );
} 