'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { UserIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

export default function ProfileIndicator() {
  const { user, userProfile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  // Format the registration date as mmm/yy
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(2);
    
    return `${month}/${year}`;
  };

  const formattedDate = formatDate(user.metadata?.creationTime);

  // Define different colors for different profile types (with better contrast)
  const profileColors = {
    'Visitor': 'bg-blue-200 text-blue-900',
    'Owner': 'bg-purple-200 text-purple-900',
    'Manager': 'bg-indigo-200 text-indigo-900',
    'Teacher': 'bg-green-200 text-green-900',
    'Student': 'bg-amber-200 text-amber-900',
  };

  const colorClass = profileColors[userProfile] || 'bg-gray-200 text-gray-900';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`px-3 py-2 rounded-full ${colorClass} flex items-center shadow-sm hover:shadow-md transition-all`}
      >
        <UserIcon className="h-5 w-5 mr-2" />
        <span className="font-medium">{userProfile}</span>
        <ChevronDownIcon className="h-4 w-4 ml-1" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="p-4">
            <div className="border-b border-gray-200 pb-3 mb-3">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="font-medium">{user.displayName || 'User'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p className="text-sm text-gray-500">Profile Type:</p>
                <p className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${colorClass}`}>{userProfile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member since:</p>
                <p className="text-sm font-medium text-gray-800">{formattedDate}</p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 