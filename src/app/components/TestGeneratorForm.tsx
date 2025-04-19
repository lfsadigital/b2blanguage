'use client';

import { useState, useEffect } from 'react';
import { TestFormData, StudentLevel, QuestionType } from '@/app/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserCircleIcon } from '@heroicons/react/24/outline';

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

interface TestGeneratorFormProps {
  onSubmit: (data: TestFormData) => Promise<void>;
  isGenerating: boolean;
  defaultTeacherName?: string;
  currentTeacher?: { id: string; displayName: string } | null;
}

// Helper function to validate StudentLevel
const ensureValidStudentLevel = (level: string | undefined): StudentLevel => {
  if (level === 'Beginner' || level === 'Medium' || level === 'Advanced') {
    return level;
  }
  return 'Beginner'; // Default fallback
};

const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;

export default function TestGeneratorForm({ 
  onSubmit, 
  isGenerating, 
  defaultTeacherName,
  currentTeacher
}: TestGeneratorFormProps) {
  const { userProfile, user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState<TestFormData>({
    professorName: defaultTeacherName || '',
    professorId: currentTeacher?.id || '',
    studentName: '',
    studentId: '',
    contentUrl: '',
    studentLevel: 'Beginner',
    questionCounts: {
      'multiple-choice': 1,
      'open-ended': 1,
      'true-false': 1
    },
    additionalNotes: '',
    useTranscriptApproach: false,
    youtubeVideoId: ''
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Update professor names when currentTeacher or teachers change
  useEffect(() => {
    // If user is a teacher, always set their own profile
    if (userProfile === 'Teacher' && currentTeacher) {
      setFormData(prev => ({
        ...prev,
        professorId: currentTeacher.id,
        professorName: currentTeacher.displayName
      }));
    }
    // For non-teachers, only set if the field is empty
    else if ((userProfile === 'Owner' || userProfile === 'Manager') && currentTeacher && !formData.professorId) {
      setFormData(prev => ({
        ...prev,
        professorId: currentTeacher.id,
        professorName: currentTeacher.displayName
      }));
    }
  }, [currentTeacher, userProfile, formData.professorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the student name if we have an ID and it's not already set
    if (formData.studentId && !formData.studentName) {
      const student = students.find(s => s.id === formData.studentId);
      if (student) {
        setFormData(prev => ({
          ...prev,
          studentName: student.displayName
        }));
      }
    }
    
    // Check if it's a YouTube URL
    const isYouTubeUrl = youtubeUrlPattern.test(formData.contentUrl);
    
    if (isYouTubeUrl) {
      try {
        // Extract video ID from YouTube URL
        let youtubeVideoId = '';
        const url = new URL(formData.contentUrl);
        
        if (url.hostname === 'youtu.be') {
          youtubeVideoId = url.pathname.slice(1);
        } else {
          youtubeVideoId = url.searchParams.get('v') || '';
        }
        
        if (!youtubeVideoId) {
          throw new Error("Couldn't extract YouTube video ID");
        }
        
        console.log("Processing YouTube video:", youtubeVideoId);
        
        // Use the two-step, more efficient process for YouTube videos
        await onSubmit({
          ...formData,
          useTranscriptApproach: true,
          youtubeVideoId
        });
        
      } catch (youtubeError) {
        console.error("YouTube processing error:", youtubeError);
        // Fall back to standard approach
        await onSubmit(formData);
      }
    } else {
      // For non-YouTube content, use the standard approach
      await onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'professorId') {
      // Update professor name when ID changes
      const selectedTeacher = teachers.find(t => t.id === value);
      if (selectedTeacher) {
        setFormData(prev => ({
          ...prev,
          professorId: value,
          professorName: selectedTeacher.displayName
        }));
      }
    } else if (name === 'studentId') {
      // Update student name when ID changes
      const selectedStudent = students.find(s => s.id === value);
      if (selectedStudent) {
        setFormData(prev => ({
          ...prev,
          studentId: value,
          studentName: selectedStudent.displayName,
          // Optionally update student level based on student data
          studentLevel: ensureValidStudentLevel(selectedStudent.level) || formData.studentLevel
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleQuestionCountChange = (type: QuestionType, value: string) => {
    const numValue = parseInt(value) || 0;
    // Ensure the value is between 0 and 25
    const validValue = Math.min(Math.max(numValue, 0), 25);
    
    setFormData(prev => ({
      ...prev,
      questionCounts: {
        ...prev.questionCounts,
        [type]: validValue
      }
    }));
  };

  // Replace the existing question type section with number inputs
  const renderQuestionTypeInputs = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Number of Questions by Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Multiple Choice
          </label>
          <input
            type="number"
            min="0"
            max="25"
            value={formData.questionCounts['multiple-choice']}
            onChange={(e) => handleQuestionCountChange('multiple-choice', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Standard format with options</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Open Ended
          </label>
          <input
            type="number"
            min="0"
            max="25"
            value={formData.questionCounts['open-ended']}
            onChange={(e) => handleQuestionCountChange('open-ended', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Free-form responses</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            True/False
          </label>
          <input
            type="number"
            min="0"
            max="25"
            value={formData.questionCounts['true-false']}
            onChange={(e) => handleQuestionCountChange('true-false', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Binary choice questions</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Maximum 25 questions per type. Total questions: {
          Object.values(formData.questionCounts).reduce((a, b) => a + b, 0)
        }
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Level Selection */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        {/* Professor Selection */}
        {(userProfile === 'Owner' || userProfile === 'Manager') && (
          <div className="sm:col-span-2">
            <label htmlFor="professorId" className="block text-sm font-medium text-gray-700">
              Professor
            </label>
            <select
              id="professorId"
              name="professorId"
              value={formData.professorId}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm rounded-md"
            >
              <option value="">Select a professor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Student Selection */}
        <div className="sm:col-span-2">
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
            Student
          </label>
          <select
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm rounded-md"
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Content URL Input */}
        <div className="sm:col-span-2">
          <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700">
            Content URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="contentUrl"
              id="contentUrl"
              value={formData.contentUrl}
              onChange={handleChange}
              className="shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)] block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter URL of article or video"
            />
          </div>
        </div>

        {/* Student Level Selection */}
        <div className="sm:col-span-2">
          <label htmlFor="studentLevel" className="block text-sm font-medium text-gray-700">
            Student Level
          </label>
          <select
            id="studentLevel"
            name="studentLevel"
            value={formData.studentLevel}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm rounded-md"
          >
            <option value="Beginner">Beginner</option>
            <option value="Medium">Medium</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Question Type Inputs */}
        {renderQuestionTypeInputs()}

        {/* Additional Notes */}
        <div className="sm:col-span-2">
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <div className="mt-1">
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={3}
              value={formData.additionalNotes}
              onChange={handleChange}
              className="shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)] block w-full sm:text-sm border border-gray-300 rounded-md"
              placeholder="Any specific instructions or notes for the test"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Test'}
          </button>
        </div>
      </div>
    </form>
  );
} 