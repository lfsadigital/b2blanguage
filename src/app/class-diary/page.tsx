'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/hooks/useAuth';
import DashboardShell from '../../components/ui/dashboard-shell';
import RoleBasedRoute from '@/app/components/RoleBasedRoute';
import { 
  UserCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { addDocument, getDocuments, uploadFile } from '../../lib/firebase/firebaseUtils';
import { db } from '../../lib/firebase/firebase';
import { collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';

// Define interfaces for our data
interface Teacher {
  id: string;
  displayName: string;
  email: string;
  profileType: string;
}

interface Student {
  id: string;
  displayName: string;
  email: string;
  profileType: string;
  level?: string;
}

interface TestResult {
  id: string;
  fileName: string;
  fileUrl: string;
  studentName: string;
  studentId: string;
  studentLevel: string;
  teacherName: string;
  teacherId: string;
  testDate: string;
  testGrade: string;
  gradeByTeacher: string;
  forNextClass: string;
  notes: string;
  uploadDate: string;
  timestamp: number;
}

export default function ClassDiaryPage() {
  const { userProfile, user, loading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [recentUploads, setRecentUploads] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Find the current teacher from the teachers array
  const currentTeacher = user?.email 
    ? teachers.find(t => t.email === user.email)
    : null;
  
  // Form state initialization
  const [formData, setFormData] = useState({
    teacherId: '',
    studentId: '',
    testDate: new Date().toISOString().split('T')[0], // Today's date
    testGrade: '',
    gradeByTeacher: '',
    forNextClass: '',
    notes: ''
  });

  // Fetch teachers and students from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get teachers from Firestore
        const teachersQuery = query(
          collection(db, 'users'), 
          where('profileType', '==', 'Teacher')
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        const teachersList = teachersSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            displayName: data.displayName || '', 
            email: data.email || '',
            profileType: data.profileType || 'Teacher'
          };
        });
        setTeachers(teachersList);
        console.log("Fetched teachers:", teachersList);
        
        // Get students from Firestore
        const studentsQuery = query(
          collection(db, 'users'), 
          where('profileType', '==', 'Student')
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsList = studentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            displayName: data.displayName || '', 
            email: data.email || '',
            profileType: data.profileType || 'Student',
            level: data.level || 'Intermediate'  // Default level if not specified
          };
        });
        setStudents(studentsList);
        console.log("Fetched students:", studentsList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Update teacher ID when user and teachers data change
  useEffect(() => {
    if (user?.email && teachers.length > 0) {
      const currentTeacherFound = teachers.find(t => t.email === user.email);
      
      // If user is a teacher, always set their own ID
      if (userProfile === 'Teacher' && currentTeacherFound) {
        setFormData(prev => ({
          ...prev,
          teacherId: currentTeacherFound.id
        }));
        console.log("Set current teacher to:", currentTeacherFound);
      } 
      // For Owners/Managers, only set the current teacher if form is empty
      else if ((userProfile === 'Owner' || userProfile === 'Manager') && formData.teacherId === '' && currentTeacherFound) {
        setFormData(prev => ({
          ...prev,
          teacherId: currentTeacherFound.id
        }));
        console.log("Pre-filled teacher for Owner/Manager:", currentTeacherFound);
      }
    }
  }, [user, teachers, userProfile, formData.teacherId]);

  // Fetch recent uploads on component mount
  useEffect(() => {
    async function fetchRecentUploads() {
      try {
        setIsLoading(true);
        // Get test results from Firebase
        const results = await getDocuments('testResults');
        
        // Cast results to proper type and then sort
        const typedResults = results as unknown as TestResult[];
        
        // Sort by upload date (newest first)
        const sortedResults = typedResults.sort((a, b) => {
          // Convert dates to timestamps for comparison
          const dateA = new Date(a.uploadDate || '').getTime();
          const dateB = new Date(b.uploadDate || '').getTime();
          
          // If timestamps are available, use those instead
          if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp;
          }
          
          // Fallback to date comparison
          return dateB - dateA;
        });
        
        setRecentUploads(sortedResults);
      } catch (error) {
        console.error('Error fetching test results:', error);
        // Fallback to empty array if fetch fails
        setRecentUploads([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchRecentUploads();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError('');
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit button clicked');
    
    // Check if user is authenticated
    if (!user) {
      console.error('Authentication error: User not logged in');
      setUploadError('You must be logged in to upload files.');
      return;
    }
    
    console.log('User authenticated:', user.email);
    
    // Check if user is a Teacher
    if (userProfile !== 'Teacher') {
      console.error('Authorization error: User is not a Teacher', userProfile);
      setUploadError('Only Teachers can upload test results.');
      return;
    }
    
    console.log('User authorized as Teacher');
    
    if (!selectedFile) {
      console.error('Validation error: No file selected');
      setUploadError('Please select a file to upload');
      return;
    }
    
    console.log('File selected:', selectedFile.name, 'size:', selectedFile.size);
    
    try {
      setIsUploading(true);
      console.log('Starting upload process...');
      
      // Get selected student and teacher data
      const selectedStudent = students.find(s => s.id === formData.studentId);
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      
      console.log('Selected student:', selectedStudent);
      console.log('Selected teacher:', selectedTeacher);
      
      if (!selectedStudent || !selectedTeacher) {
        throw new Error('Please select a valid student and teacher');
      }
      
      // Upload file to Firebase storage
      let fileUrl = '';
      
      console.log('Preparing to upload file to Firebase Storage...');
      try {
        // First check if the file is too large
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > MAX_FILE_SIZE) {
          throw new Error(`File size exceeds maximum allowed (10MB). Current size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
        }
        
        // Upload to Firebase Storage
        const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
        const path = `test-results/${fileName}`;
        console.log('Upload path:', path);
        
        fileUrl = await uploadFile(selectedFile, path);
        console.log('File uploaded successfully to Firebase Storage:', fileUrl);
      } catch (uploadError: any) {
        console.error('Error during file upload:', uploadError);
        throw new Error(`Failed to upload file to storage: ${uploadError.message || 'Unknown error'}`);
      }
      
      // Prepare test result data
      console.log('Preparing test result data for Firestore...');
      const testResultData = {
        fileName: selectedFile.name,
        fileUrl,
        studentName: selectedStudent.displayName,
        studentId: selectedStudent.id,
        studentLevel: selectedStudent.level || 'Intermediate',
        teacherName: selectedTeacher.displayName,
        teacherId: selectedTeacher.id,
        testDate: formData.testDate,
        testGrade: formData.testGrade,
        gradeByTeacher: formData.gradeByTeacher,
        forNextClass: formData.forNextClass,
        notes: formData.notes,
        uploadDate: new Date().toISOString().split('T')[0],
        timestamp: new Date().getTime(),
        uploadedBy: user.email
      };
      
      // Save data to Firestore directly without the helper function
      console.log('Saving data to Firestore using direct approach:', testResultData);
      try {
        // Create a unique ID
        const resultId = `result_${Date.now()}`;
        
        // Add document with the generated ID
        await setDoc(doc(db, 'testResults', resultId), testResultData);
        console.log('Document successfully saved with ID:', resultId);
        
        // Add the new upload to the local state
        const newUpload = {
          id: resultId,
          ...testResultData
        };
        
        setRecentUploads(prev => [newUpload, ...prev]);
        
        // Reset form
        resetForm();
        
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        console.log('Upload process completed successfully!');
      } catch (firestoreError: any) {
        console.error('Error saving to Firestore:', firestoreError);
        throw new Error(`Failed to save test data: ${firestoreError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during upload process:', error);
      setUploadError(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      console.log('Upload process ended (success or failure)');
    }
  };

  // Reset form after successful upload
  const resetForm = () => {
    // Keep the current teacher ID if user is a Teacher, otherwise reset it
    setFormData({
      teacherId: userProfile === 'Teacher' && currentTeacher ? currentTeacher.id : '',
      studentId: '',
      testDate: new Date().toISOString().split('T')[0],
      testGrade: '',
      gradeByTeacher: '',
      forNextClass: '',
      notes: ''
    });
    setSelectedFile(null);
  };

  // Show loading state during initial load
  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B4513]"></div>
          <div className="ml-3 text-black">Verifying access...</div>
        </div>
      </DashboardShell>
    );
  }

  // If authorized, render the main content
  return (
    <RoleBasedRoute 
      requiredRoles={['Teacher', 'Manager', 'Owner']}
      key="class-diary-route"
    >
    <DashboardShell>
      <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Class Diary</h1>
          <p className="mt-1 text-sm text-black">
            Upload test results and track student progress
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="md:col-span-2">
        <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Test Result</h2>
                
                {uploadSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-green-800">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Test uploaded successfully!
          </div>
                )}
                
                {uploadError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-800">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    {uploadError}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Teacher and Student Selection */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">
                        Teacher
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <select
                          id="teacherId"
                          name="teacherId"
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md ${
                            userProfile === 'Teacher' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          value={formData.teacherId}
                          onChange={handleInputChange}
                          disabled={userProfile === 'Teacher'}
                          required
                        >
                          {userProfile === 'Teacher' && currentTeacher ? (
                            <option value={currentTeacher.id}>{currentTeacher.displayName}</option>
                          ) : (
                            <>
                              <option value="">Select Teacher</option>
                              {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.displayName}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                        {userProfile === 'Teacher' && currentTeacher && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      {userProfile === 'Teacher' && currentTeacher && (
                        <p className="mt-1 text-xs text-gray-500">Using your profile as the teacher</p>
                      )}
                    </div>
                    
                  <div>
                      <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                        Student
                      </label>
                      <select
                        id="studentId"
                        name="studentId"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Test Date and Grade */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="testDate" className="block text-sm font-medium text-gray-700">
                        Test Date
                      </label>
                      <input
                        type="date"
                        id="testDate"
                        name="testDate"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                        value={formData.testDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="testGrade" className="block text-sm font-medium text-gray-700">
                        Test Grade
                      </label>
                      <input
                        type="text"
                        id="testGrade"
                        name="testGrade"
                        placeholder="e.g., 85/100 or A"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                        value={formData.testGrade}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  {/* Grade by Teacher and For Next Class */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="gradeByTeacher" className="block text-sm font-medium text-gray-700">
                        Grade by Teacher
                      </label>
                      <input
                        type="text"
                        id="gradeByTeacher"
                        name="gradeByTeacher"
                        placeholder="e.g., 90/100 or A+"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                        value={formData.gradeByTeacher}
                        onChange={handleInputChange}
                      />
                  </div>
                  
                  <div>
                      <label htmlFor="forNextClass" className="block text-sm font-medium text-gray-700">
                        For Next Class
                      </label>
                      <input
                        type="text"
                        id="forNextClass"
                        name="forNextClass"
                        placeholder="e.g., Review past tense"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                        value={formData.forNextClass}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Test Document (PDF)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <div className="flex flex-col items-center">
                          {!selectedFile ? (
                            <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                          ) : (
                            <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
                          )}
                        </div>
                        
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-[#8B4513] hover:text-[#A0522D] focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF up to 10MB</p>
                        
                        {selectedFile && (
                          <p className="text-sm text-green-600 font-medium mt-2">
                            {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                      placeholder="Add any notes about the test or student's performance"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513] ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Test'}
                      {!isUploading && <ArrowUpTrayIcon className="ml-2 h-4 w-4" />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Uploads</h2>
                
                {isLoading ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>Loading recent uploads...</p>
                      </div>
                ) : recentUploads.length > 0 ? (
                  <div className="space-y-4">
                    {recentUploads.map(upload => (
                      <div key={upload.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <DocumentTextIcon className="h-6 w-6 text-[#8B4513] mr-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {upload.fileName}
                              </p>
                              {upload.fileUrl && (
                                <a 
                                  href={upload.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-xs text-[#8B4513] hover:underline ml-2"
                                >
                                  View PDF
                                </a>
                        )}
                      </div>
                            
                            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                              <p className="flex items-center">
                                <UserCircleIcon className="mr-1 h-4 w-4" />
                                <span className="font-medium">Student:</span> {upload.studentName}
                              </p>
                              <p className="flex items-center">
                                <UserCircleIcon className="mr-1 h-4 w-4" />
                                <span className="font-medium">Teacher:</span> {upload.teacherName}
                              </p>
                              <p className="flex items-center">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                <span className="font-medium">Test Date:</span> {upload.testDate}
                              </p>
                              <p className="flex items-center">
                                <DocumentTextIcon className="mr-1 h-4 w-4" />
                                <span className="font-medium">Test Grade:</span> {upload.testGrade}
                              </p>
                              {upload.gradeByTeacher && (
                                <p className="flex items-center">
                                  <DocumentTextIcon className="mr-1 h-4 w-4" />
                                  <span className="font-medium">Grade by Teacher:</span> {upload.gradeByTeacher}
                                </p>
                              )}
                              {upload.forNextClass && (
                                <p className="flex items-center col-span-1 sm:col-span-2">
                                  <ClockIcon className="mr-1 h-4 w-4" />
                                  <span className="font-medium">For Next Class:</span> {upload.forNextClass}
                                </p>
                        )}
                      </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No test uploads yet</p>
            </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </DashboardShell>
    </RoleBasedRoute>
  );
} 