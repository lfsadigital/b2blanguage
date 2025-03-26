'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import DashboardShell from '../../components/ui/dashboard-shell';
import RoleBasedRoute from '@/app/components/RoleBasedRoute';
import { 
  UserCircleIcon,
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { 
  createUserRelationships, 
  updateUserRelationships, 
  deleteUserRelationships,
  updateAllExistingRelationships,
  getStudentTeachers
} from '@/lib/firebase/firebaseUtils';

// Define available user profile types
type UserProfileType = 'Visitor' | 'Owner' | 'Manager' | 'Teacher' | 'Student';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  profileType: UserProfileType;
  lastLogin?: string;
  createdAt?: string;
}

// Adding style object with improved text colors and contrast
const tableStyles = {
  headerText: {
    color: 'rgba(0, 0, 0, 0.9)',
    fontWeight: 'bold',
  },
  cellText: {
    color: 'rgba(0, 0, 0, 0.9)',
  },
  badgeText: {
    color: 'rgba(0, 0, 0, 0.9)',
    fontWeight: 'bold',
  }
};

// CSS classes for different badge types with improved contrast
const badgeClasses = {
  Teacher: 'bg-green-100 text-black border border-green-300',
  Student: 'bg-blue-100 text-black border border-blue-300',
  Manager: 'bg-purple-100 text-black border border-purple-300',
  Owner: 'bg-yellow-100 text-black border border-yellow-300',
  Visitor: 'bg-gray-100 text-black border border-gray-300'
};

export default function DatabasePage() {
  const { user, userProfile } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [isUpdatingRelationships, setIsUpdatingRelationships] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    profileType: 'Student' as UserProfileType
  });

  // Fetch profiles from Firestore
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            displayName: data.displayName || '', 
            email: data.email || '',
            profileType: data.profileType || 'Visitor',
            lastLogin: data.lastLogin ? new Date(data.lastLogin.toDate()).toLocaleString() : undefined,
            createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : undefined
          } as UserProfile;
        });
        
        setProfiles(usersList);
        
        // Filter teachers for the dropdown
        const teachersList = usersList.filter(u => u.profileType === 'Teacher');
        setTeachers(teachersList);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
        setErrorMessage('Failed to load user profiles');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfiles();
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle teacher selection change
  const handleTeacherSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedTeachers(selectedOptions);
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Fetch student's teachers when editing a student
  useEffect(() => {
    const fetchStudentTeachers = async () => {
      if (editingProfile && editingProfile.profileType === 'Student') {
        try {
          const teacherIds = await getStudentTeachers(editingProfile.id);
          setSelectedTeachers(teacherIds);
        } catch (error) {
          console.error('Error fetching student teachers:', error);
        }
      }
    };
    
    fetchStudentTeachers();
  }, [editingProfile]);

  // Handle form submission for adding/editing a profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate: if student, must have at least one teacher selected
      if (formData.profileType === 'Student' && selectedTeachers.length === 0) {
        setErrorMessage('Students must have at least one teacher assigned');
        return;
      }

      if (editingProfile) {
        // Store old profile type for relationship updates
        const oldProfileType = editingProfile.profileType;
        
        // Update existing profile
        const userRef = doc(db, 'users', editingProfile.id);
        await updateDoc(userRef, {
          displayName: formData.displayName,
          profileType: formData.profileType,
        });
        
        // Update relationships if role changed or teacher assignments changed for students
        if (oldProfileType !== formData.profileType || formData.profileType === 'Student') {
          await updateUserRelationships(
            editingProfile.id, 
            oldProfileType, 
            formData.profileType,
            formData.profileType === 'Student' ? selectedTeachers : undefined
          );
        }
        
        // Update local state
        setProfiles(prev => prev.map(profile => 
          profile.id === editingProfile.id 
            ? { ...profile, displayName: formData.displayName, profileType: formData.profileType } 
            : profile
        ));
        
        setSuccessMessage(`Updated ${formData.displayName}'s profile`);
        setEditingProfile(null);
      } else {
        // Check if email already exists
        const q = query(collection(db, 'users'), where('email', '==', formData.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setErrorMessage('A user with this email already exists');
          return;
        }
        
        // Add new profile
        const newProfile = {
          displayName: formData.displayName,
          email: formData.email,
          profileType: formData.profileType,
          createdAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'users'), newProfile);
        
        // Create relationships
        await createUserRelationships(
          docRef.id,
          formData.profileType,
          formData.profileType === 'Student' ? selectedTeachers : undefined
        );
        
        // Update local state
        setProfiles(prev => [...prev, { 
          id: docRef.id, 
          ...newProfile, 
          createdAt: new Date().toLocaleString()
        }]);
        
        setSuccessMessage(`Added ${formData.displayName} as ${formData.profileType}`);
      }
      
      // Reset form
      setFormData({
        displayName: '',
        email: '',
        profileType: 'Student'
      });
      setSelectedTeachers([]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async (profileId: string, profileName: string, profileType: UserProfileType) => {
    if (!confirm(`Are you sure you want to delete ${profileName}'s profile?`)) {
      return;
    }
    
    try {
      // Delete relationships first
      await deleteUserRelationships(profileId, profileType);
      
      // Then delete the user
      await deleteDoc(doc(db, 'users', profileId));
      
      setProfiles(prev => prev.filter(profile => profile.id !== profileId));
      setSuccessMessage(`Deleted ${profileName}'s profile`);
    } catch (error) {
      console.error('Error deleting profile:', error);
      setErrorMessage('Failed to delete profile. Please try again.');
    }
  };

  // Handle profile editing
  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormData({
      displayName: profile.displayName,
      email: profile.email,
      profileType: profile.profileType
    });
    setSelectedTeachers([]);  // Will be populated by useEffect when profile is set
    setShowAddForm(true);
  };

  // Update all existing relationships
  const handleUpdateAllRelationships = async () => {
    if (!confirm('This will create relationships between all existing users. Continue?')) {
      return;
    }
    
    try {
      setIsUpdatingRelationships(true);
      await updateAllExistingRelationships();
      setSuccessMessage('Successfully updated all user relationships');
    } catch (error) {
      console.error('Error updating relationships:', error);
      setErrorMessage('Failed to update relationships');
    } finally {
      setIsUpdatingRelationships(false);
    }
  };

  // Filter profiles based on search term
  const filteredProfiles = searchTerm
    ? profiles.filter(profile => 
        profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.profileType.toLowerCase().includes(searchTerm.toLowerCase()))
    : profiles;

  return (
    <RoleBasedRoute 
      requiredRoles={['Owner', 'Manager']}
      key="database-route"
    >
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">User Database</h1>
          <p className="mt-1 text-sm text-black">
            Manage teachers, students, and managers in the system
          </p>
        </div>
        
        {/* Success and Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-black">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-black">
            <XCircleIcon className="h-5 w-5 mr-2 text-red-600" />
            {errorMessage}
          </div>
        )}
        
        <div className="bg-[#F8F4EA] shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {/* Search and Add buttons */}
            <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-black" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513]"
                  style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditingProfile(null);
                    setFormData({
                      displayName: '',
                      email: '',
                      profileType: 'Student'
                    });
                    setSelectedTeachers([]);
                    setShowAddForm(!showAddForm);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-[#F0E6D2] hover:bg-[#E6D7B8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                  style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                >
                  <UserPlusIcon className="h-5 w-5 mr-2 text-black" />
                  {showAddForm ? 'Cancel' : 'Add New User'}
                </button>
                
                <button
                  onClick={handleUpdateAllRelationships}
                  disabled={isUpdatingRelationships}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-[#F0E6D2] hover:bg-[#E6D7B8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                >
                  {isUpdatingRelationships ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#8B4513] mr-2"></div>
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-black" />
                  )}
                  Update All Relationships
                </button>
              </div>
            </div>
            
            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="mb-8 p-6 bg-[#F5EFE0] rounded-lg border border-[#E6D7B8]">
                <h3 className="text-lg font-medium mb-4 text-black">
                  {editingProfile ? 'Edit User Profile' : 'Add New User'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-black">
                        Full Name
                      </label>
                      <input
                        id="displayName"
                        name="displayName"
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513]"
                        style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                        value={formData.displayName}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-black">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        disabled={!!editingProfile} // Can't change email for existing profiles
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] ${
                          editingProfile ? 'bg-gray-100' : 'bg-white'
                        }`}
                        style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      {editingProfile && (
                        <p className="mt-1 text-xs text-black">Email cannot be changed</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="profileType" className="block text-sm font-medium text-black">
                      Profile Type
                    </label>
                    <select
                      id="profileType"
                      name="profileType"
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md text-black"
                      value={formData.profileType}
                      onChange={handleInputChange}
                      style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                    >
                      <option value="Student" style={{ color: 'black' }}>Student</option>
                      <option value="Teacher" style={{ color: 'black' }}>Teacher</option>
                      <option value="Manager" style={{ color: 'black' }}>Manager</option>
                      {userProfile === 'Owner' && (
                        <option value="Owner" style={{ color: 'black' }}>Owner</option>
                      )}
                    </select>
                  </div>
                  
                  {/* Teacher selection for students */}
                  {formData.profileType === 'Student' && (
                    <div>
                      <label htmlFor="teachers" className="block text-sm font-medium text-black">
                        Assign Teachers <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="teachers"
                        name="teachers"
                        multiple
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md text-black"
                        value={selectedTeachers}
                        onChange={handleTeacherSelectionChange}
                        style={{ color: 'rgba(0, 0, 0, 0.9)', height: '120px' }}
                      >
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id} style={{ color: 'black' }}>
                            {teacher.displayName}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-700">
                        Hold Ctrl/Cmd to select multiple teachers
                      </p>
                      {selectedTeachers.length === 0 && (
                        <p className="mt-1 text-xs text-red-600">
                          Students must have at least one teacher assigned
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                      style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-[#F0E6D2] hover:bg-[#E6D7B8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                      style={{ color: 'rgba(0, 0, 0, 0.9)' }}
                    >
                      {editingProfile ? 'Update User' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Profiles List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B4513]"></div>
              </div>
            ) : filteredProfiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#F0E6D2]">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black"
                        style={tableStyles.headerText}
                      >
                        Name
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        style={tableStyles.headerText}
                      >
                        Email
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        style={tableStyles.headerText}
                      >
                        Type
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider"
                        style={tableStyles.headerText}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-[#FEFAF0]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#F0E6D2] rounded-full flex items-center justify-center">
                              <UserCircleIcon className="h-6 w-6 text-[#8B4513]" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-black" style={tableStyles.cellText}>{profile.displayName}</div>
                              {profile.lastLogin && (
                                <div className="text-xs text-black" style={tableStyles.cellText}>Last login: {profile.lastLogin}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-black" style={tableStyles.cellText}>{profile.email}</div>
                          {profile.createdAt && (
                            <div className="text-xs text-black" style={tableStyles.cellText}>Created: {profile.createdAt}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              badgeClasses[profile.profileType as keyof typeof badgeClasses] || 'bg-gray-100 text-black'
                            }`}
                            style={tableStyles.badgeText}
                          >
                            {profile.profileType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProfile(profile)}
                            className="text-[#8B4513] hover:text-[#A0522D] mr-4"
                            title="Edit User"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile.id, profile.displayName, profile.profileType)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-black" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>
                {searchTerm ? 'No users match your search.' : 'No users found. Add some using the button above.'}
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </RoleBasedRoute>
  );
} 