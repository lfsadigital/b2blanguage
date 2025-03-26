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
    questionTypes: ['multiple-choice'], // Default selection
    numberOfQuestions: 5,
    additionalNotes: '',
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
    
    // Find the student name if we have an ID
    if (formData.studentId && !formData.studentName) {
      const student = students.find(s => s.id === formData.studentId);
      if (student) {
        setFormData(prev => ({
          ...prev,
          studentName: student.displayName
        }));
      }
    }
    
    await onSubmit(formData);
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

  const handleCheckboxChange = (type: QuestionType) => {
    setFormData((prev) => {
      // If the type is already selected, remove it, otherwise add it
      const newTypes = prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type];
      
      // Ensure at least one type is selected
      return {
        ...prev,
        questionTypes: newTypes.length > 0 ? newTypes : prev.questionTypes,
      };
    });
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue) && numValue > 0 && numValue <= 20) {
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container p-6">
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 apple-heading">Create New Test</h3>
          <p className="mt-2 text-sm text-gray-600">
            Enter the details below to generate a customized English test
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
          <div>
            <label htmlFor="professorId" className="block text-sm font-medium text-gray-800">
              Teacher Name
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <select
                id="professorId"
                name="professorId"
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md ${
                  userProfile === 'Teacher' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                value={formData.professorId}
                onChange={handleChange}
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
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-800">
              Student Name
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <select
                id="studentId"
                name="studentId"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm rounded-md"
                value={formData.studentId}
                onChange={handleChange}
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

          <div className="sm:col-span-2">
            <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-800">
              Content URL <span className="text-[var(--error)]">*</span>
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="url"
                name="contentUrl"
                id="contentUrl"
                value={formData.contentUrl}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border-gray-300 focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm py-3 px-4"
                placeholder="YouTube video or article URL"
              />
              <p className="mt-1 text-xs text-gray-600">
                Supports YouTube URLs or web articles for business content analysis
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="studentLevel" className="block text-sm font-medium text-gray-800">
              Student Level
            </label>
            <div className="mt-1 relative rounded-md">
              <select
                id="studentLevel"
                name="studentLevel"
                value={formData.studentLevel}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-300 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4 appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Medium">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-gray-800">
              Number of Questions
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="number"
                name="numberOfQuestions"
                id="numberOfQuestions"
                value={formData.numberOfQuestions}
                onChange={handleNumberChange}
                min="1"
                max="20"
                className="block w-full rounded-lg border-gray-300 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
              />
            </div>
          </div>

          <div className="sm:col-span-2 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <fieldset>
              <legend className="text-sm font-medium text-black">Question Types</legend>
              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    id="multiple-choice"
                    name="questionTypes"
                    type="checkbox"
                    checked={formData.questionTypes.includes('multiple-choice')}
                    onChange={() => handleCheckboxChange('multiple-choice')}
                    className="h-5 w-5 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                  />
                  <label htmlFor="multiple-choice" className="ml-3">
                    <span className="block text-sm font-medium text-black">Multiple Choice</span>
                    <span className="block text-xs text-gray-800">Standard format with options</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="open-ended"
                    name="questionTypes"
                    type="checkbox"
                    checked={formData.questionTypes.includes('open-ended')}
                    onChange={() => handleCheckboxChange('open-ended')}
                    className="h-5 w-5 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                  />
                  <label htmlFor="open-ended" className="ml-3">
                    <span className="block text-sm font-medium text-black">Open Ended</span>
                    <span className="block text-xs text-gray-800">Free-form responses</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="true-false"
                    name="questionTypes"
                    type="checkbox"
                    checked={formData.questionTypes.includes('true-false')}
                    onChange={() => handleCheckboxChange('true-false')}
                    className="h-5 w-5 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                  />
                  <label htmlFor="true-false" className="ml-3">
                    <span className="block text-sm font-medium text-black">True/False</span>
                    <span className="block text-xs text-gray-800">Binary choice questions</span>
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-800">
              Additional Notes
            </label>
            <div className="mt-1 relative rounded-md">
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                rows={3}
                value={formData.additionalNotes}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-300 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
                placeholder="Any specific requirements or focus areas for this test..."
              />
            </div>
          </div>
        </div>

        <div className="centered-button-container">
          <button
            type="submit"
            disabled={isGenerating || !formData.contentUrl}
            className={`apple-button inline-flex items-center px-8 py-3 text-base font-medium text-white ${
              isGenerating || !formData.contentUrl
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Test'
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 