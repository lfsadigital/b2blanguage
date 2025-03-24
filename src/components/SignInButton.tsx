'use client';

import { useAuth } from '../lib/hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';

export default function SignInButton() {
  const { user, signInWithGoogle, loading } = useAuth();
  
  // Hide button if user is already logged in
  if (user || loading) {
    return null;
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      aria-label="Sign in with Google"
    >
      <FcGoogle className="w-5 h-5 mr-2" />
      Sign in with Google
    </button>
  );
} 