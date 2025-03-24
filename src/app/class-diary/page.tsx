'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/hooks/useAuth';
import DashboardShell from '../../components/ui/dashboard-shell';
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

// Mock data for teachers
const mockTeachers = [
  { id: '1', name: 'Rafael', languages: ['EN', 'ES'] },
  { id: '2', name: 'Ortiz', languages: ['ES'] },
  { id: '3', name: 'Sersun', languages: ['EN'] },
];

// Mock data for students
const mockStudents = [
  { id: '1', name: 'John Smith', level: 'Advanced' },
  { id: '2', name: 'Emma Johnson', level: 'Intermediate' },
  { id: '3', name: 'Michael Brown', level: 'Beginner' },
  { id: '4', name: 'Sarah Wilson', level: 'Intermediate' },
  { id: '5', name: 'David Lee', level: 'Advanced' },
];

// Mock data for recent uploads
const mockRecentUploads = [
  { 
    id: '1', 
    fileName: 'business_vocab_test.pdf', 
    studentName: 'John Smith', 
    teacherName: 'Rafael', 
    uploadDate: '2023-03-24',
    testDate: '2023-03-22',
  },
  { 
    id: '2', 
    fileName: 'email_writing_test.pdf', 
    studentName: 'Emma Johnson', 
    teacherName: 'Rafael', 
    uploadDate: '2023-03-20',
    testDate: '2023-03-18',
  },
  { 
    id: '3', 
    fileName: 'presentation_skills.pdf', 
    studentName: 'Michael Brown', 
    teacherName: 'Sersun', 
    uploadDate: '2023-03-15',
    testDate: '2023-03-14',
  },
];

export default function ClassDiaryPage() {
  const { userProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [recentUploads, setRecentUploads] = useState(mockRecentUploads);
  
  // Form state
  const [formData, setFormData] = useState({
    teacherId: userProfile === 'Teacher' ? mockTeachers[0].id : '',
    studentId: '',
    testDate: new Date().toISOString().split('T')[0], // Today's date
    testGrade: '',
    notes: ''
  });
  
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
    
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add to recent uploads
      const newUpload = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        studentName: mockStudents.find(s => s.id === formData.studentId)?.name || 'Unknown Student',
        teacherName: mockTeachers.find(t => t.id === formData.teacherId)?.name || 'Unknown Teacher',
        uploadDate: new Date().toISOString().split('T')[0],
        testDate: formData.testDate
      };
      
      setRecentUploads(prev => [newUpload, ...prev]);
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        teacherId: userProfile === 'Teacher' ? mockTeachers[0].id : '',
        studentId: '',
        testDate: new Date().toISOString().split('T')[0],
        testGrade: '',
        notes: ''
      });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Class Diary</h1>
        <p className="mt-1 text-sm text-gray-600">
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
                    <select
                      id="teacherId"
                      name="teacherId"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                      value={formData.teacherId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Teacher</option>
                      {mockTeachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
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
                      {mockStudents.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.level})
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
              
              {recentUploads.length > 0 ? (
                <div className="space-y-4">
                  {recentUploads.map(upload => (
                    <div key={upload.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <DocumentTextIcon className="h-6 w-6 text-[#8B4513] mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {upload.fileName}
                          </p>
                          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-gray-500">
                            <p className="flex items-center">
                              <UserCircleIcon className="mr-1 h-4 w-4" />
                              Student: {upload.studentName}
                            </p>
                            <p className="flex items-center mt-1 sm:mt-0">
                              <CalendarIcon className="mr-1 h-4 w-4" />
                              Test Date: {upload.testDate}
                            </p>
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
  );
} 