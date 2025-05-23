'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/ui/dashboard-shell';
import { 
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AcademicCapIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  BookOpenIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import RoleBasedRoute from '@/app/components/RoleBasedRoute';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, DocumentData } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

// Define user profile types
type UserProfileType = 'Visitor' | 'Owner' | 'Manager' | 'Teacher' | 'Student';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  profileType: UserProfileType;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Add interfaces for test and grade data
interface TestData {
  id: string;
  studentId: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  testGrade: number;
  teacherGrade: number;
  date: Date;
  testDate?: Date;
  forNextClass?: string;
  notes?: string;
  studentLevel?: string;
  timestamp?: number;
  uploadDate?: string;
  uploadedBy?: string;
}

interface TimeSeriesData {
  labels: string[];
  testGrades: number[];
  teacherGrades: number[];
}

export default function ReportPage() {
  // User filters
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [owners, setOwners] = useState<UserProfile[]>([]);
  
  // Selected filters
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  
  // Date range initialization with proper timezone handling
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  oneMonthAgo.setHours(12, 0, 0, 0);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: oneMonthAgo,
    endDate: now
  });
  
  // Add state for the performance data
  const [performanceData, setPerformanceData] = useState<{
    testGrade: number;
    teacherGrade: number;
  }>({
    testGrade: 0,
    teacherGrade: 0,
  });
  
  // Add time series data for the line chart
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData>({
    labels: [],
    testGrades: [],
    teacherGrades: []
  });
  
  // Add state for student rankings
  const [studentRankings, setStudentRankings] = useState<{
    id: string;
    rank: number;
    name: string;
    email: string;
    testGrade: number;
    teacherGrade: number;
    progress: number;
  }[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [rankingsLoading, setRankingsLoading] = useState<boolean>(true);
  
  // Add state for storing overall metrics for metric cards
  const [overallMetrics, setOverallMetrics] = useState<{
    avgTestGrade: number;
    avgTeacherGrade: number;
    testGradeChange: number;
    teacherGradeChange: number;
    completionRate: number;
    completionRateChange: number;
  }>({
    avgTestGrade: 0,
    avgTeacherGrade: 0,
    testGradeChange: 0,
    teacherGradeChange: 0,
    completionRate: 0,
    completionRateChange: 0
  });
  
  // Format dates for inputs
  const formatDateForInput = (date: Date): string => {
    // Ajusta o fuso horário para garantir que a data será exibida corretamente
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to get students associated with a teacher
  const getTeacherStudents = async (teacherId: string): Promise<string[]> => {
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
      return [];
    }
  };

  // Fetch users for filters
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        
        const usersList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            displayName: data.displayName || '', 
            email: data.email || '',
            profileType: data.profileType || 'Visitor',
          } as UserProfile;
        });
        
        setUsers(usersList);
        setStudents(usersList.filter(user => user.profileType === 'Student'));
        setTeachers(usersList.filter(user => user.profileType === 'Teacher'));
        setManagers(usersList.filter(user => user.profileType === 'Manager'));
        setOwners(usersList.filter(user => user.profileType === 'Owner'));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Handle date range changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    
    // Criar a nova data no fuso horário local
    const [year, month, day] = dateStr.split('-').map(Number);
    const newDate = new Date(year, month - 1, day, 12, 0, 0); // Use meio-dia para evitar problemas de fuso
    
    setDateRange(prev => ({
      ...prev,
      startDate: newDate
    }));
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    
    // Criar a nova data no fuso horário local
    const [year, month, day] = dateStr.split('-').map(Number);
    const newDate = new Date(year, month - 1, day, 12, 0, 0); // Use meio-dia para evitar problemas de fuso
    
    setDateRange(prev => ({
      ...prev,
      endDate: newDate
    }));
  };
  
  // Add useEffect to fetch performance data based on filters
  useEffect(() => {
    const fetchPerformanceData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching performance data with filters:", {
          student: selectedStudent,
          teacher: selectedTeacher,
          manager: selectedManager,
          dateRange
        });
        
        // Create a base query for the testResults collection
        const testsCollection = collection(db, 'testResults');
        
        // Convert date range to strings in YYYY-MM-DD format for string comparison
        const startDateStr = formatDateForInput(dateRange.startDate);
        const endDateStr = formatDateForInput(dateRange.endDate);
        
        console.log("Date range for query:", {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          startDateStr,
          endDateStr
        });
        
        // Helper function to normalize dates for comparison
        const normalizeDate = (dateStr: string): string => {
          // Ensure format YYYY-MM-DD for comparison
          const date = new Date(dateStr);
          return formatDateForInput(date);
        };
        
        // We need to get all documents and filter manually since the testDate is stored as a string
        const testsRef = query(testsCollection);
        
        console.log("Executing query for all test results");
        const testsSnapshot = await getDocs(testsRef);
        console.log(`Query returned ${testsSnapshot.docs.length} documents`);
        
        // Process results with manual filtering
        const testResults: TestData[] = [];
        testsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log("Document data:", data);
          
          // Extract fields with correct names
          const studentId = data.studentId || '';
          const teacherId = data.teacherId || '';
          
          // Convert string testDate to Date object for comparison
          let testDate: Date;
          if (typeof data.testDate === 'string') {
            testDate = new Date(data.testDate);
            // Ensure proper timezone handling
            testDate.setHours(12, 0, 0, 0);
          } else if (data.testDate instanceof Timestamp) {
            testDate = data.testDate.toDate();
            // Ensure proper timezone handling
            testDate.setHours(12, 0, 0, 0);
          } else {
            // Default to current date if no valid date
            testDate = new Date();
            testDate.setHours(12, 0, 0, 0);
          }
          
          const testDateStr = formatDateForInput(testDate);
          // Debug log to check date conversion
          console.log("Date comparison:", {
            test: testDateStr,
            start: startDateStr,
            end: endDateStr,
            isInRange: testDateStr >= startDateStr && testDateStr <= endDateStr
          });
          
          // Filter by date range
          const isInDateRange = testDateStr >= startDateStr && testDateStr <= endDateStr;
          
          // Filter by selected student and teacher
          const matchesStudent = !selectedStudent || studentId === selectedStudent;
          const matchesTeacher = !selectedTeacher || teacherId === selectedTeacher;
          
          // Only include documents that match all active filters
          if (isInDateRange && matchesStudent && matchesTeacher) {
            // Convert string grades to numbers if needed
            const testGrade = typeof data.testGrade === 'string' 
              ? parseInt(data.testGrade, 10) 
              : (data.testGrade || 0);
              
            const teacherGrade = typeof data.gradeByTeacher === 'string' 
              ? parseInt(data.gradeByTeacher, 10) 
              : (data.gradeByTeacher || 0);
            
            testResults.push({
              id: doc.id,
              studentId: studentId,
              testGrade: testGrade,
              teacherGrade: teacherGrade,
              date: testDate,
              studentName: data.studentName,
              teacherName: data.teacherName
            });
            
            console.log("Added document to results:", {
              id: doc.id,
              studentId,
              teacherId,
              testGrade,
              teacherGrade,
              testDate: testDateStr
            });
          }
        });
        
        // Calculate averages
        if (testResults.length > 0) {
          const avgTestGrade = testResults.reduce((sum, test) => sum + test.testGrade, 0) / testResults.length;
          const avgTeacherGrade = testResults.reduce((sum, test) => sum + test.teacherGrade, 0) / testResults.length;
          
          console.log("Calculated grades:", {
            avgTestGrade,
            avgTeacherGrade,
            numRecords: testResults.length
          });
          
          setPerformanceData({
            testGrade: Math.round(avgTestGrade),
            teacherGrade: Math.round(avgTeacherGrade)
          });
        } else {
          // No data available
          console.log("No data available for the current filters");
          setPerformanceData({
            testGrade: 0,
            teacherGrade: 0
          });
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
        // Set fallback values
        setPerformanceData({
          testGrade: 0,
          teacherGrade: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [selectedStudent, selectedTeacher, selectedManager, dateRange]);
  
  // Add useEffect for the time series data
  useEffect(() => {
    const fetchTimeSeriesData = async () => {
      setChartLoading(true);
      
      try {
        console.log("Fetching time series data with filters:", {
          student: selectedStudent,
          teacher: selectedTeacher,
          manager: selectedManager,
          dateRange
        });
        
        // Create a base query for the testResults collection
        const testsCollection = collection(db, 'testResults');
        
        // Convert date range to strings in YYYY-MM-DD format for string comparison
        const startDateStr = formatDateForInput(dateRange.startDate);
        const endDateStr = formatDateForInput(dateRange.endDate);
        
        console.log("Time series date range:", {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          startDateStr,
          endDateStr
        });
        
        // We need to get all documents and filter manually
        const testsRef = query(testsCollection);
        
        console.log("Executing time series query");
        const testsSnapshot = await getDocs(testsRef);
        console.log(`Time series query returned ${testsSnapshot.docs.length} documents`);
        
        // Process results with manual filtering
        const testResults: TestData[] = [];
        testsSnapshot.forEach(doc => {
          const data = doc.data();
          
          // Extract fields with correct names
          const studentId = data.studentId || '';
          const teacherId = data.teacherId || '';
          
          // Convert string testDate to Date object for comparison
          let testDate: Date;
          if (typeof data.testDate === 'string') {
            testDate = new Date(data.testDate);
            testDate.setHours(12, 0, 0, 0);
          } else if (data.testDate instanceof Timestamp) {
            testDate = data.testDate.toDate();
            testDate.setHours(12, 0, 0, 0);
          } else {
            // Default to current date if no valid date
            testDate = new Date();
            testDate.setHours(12, 0, 0, 0);
          }
          
          const testDateStr = formatDateForInput(testDate);
          
          // Filter by date range
          const isInDateRange = testDateStr >= startDateStr && testDateStr <= endDateStr;
          
          // Filter by selected student and teacher
          const matchesStudent = !selectedStudent || studentId === selectedStudent;
          const matchesTeacher = !selectedTeacher || teacherId === selectedTeacher;
          
          // Only include documents that match all active filters
          if (isInDateRange && matchesStudent && matchesTeacher) {
            // Convert string grades to numbers if needed
            const testGrade = typeof data.testGrade === 'string' 
              ? parseInt(data.testGrade, 10) 
              : (data.testGrade || 0);
              
            const teacherGrade = typeof data.gradeByTeacher === 'string' 
              ? parseInt(data.gradeByTeacher, 10) 
              : (data.gradeByTeacher || 0);
            
            testResults.push({
              id: doc.id,
              studentId: studentId,
              testGrade: testGrade,
              teacherGrade: teacherGrade,
              date: testDate
            });
            
            console.log("Added document to time series:", {
              id: doc.id,
              studentId,
              teacherId,
              testGrade,
              teacherGrade,
              testDateStr
            });
          }
        });
        
        // Sort results by date
        testResults.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Prepare data for the chart
        if (testResults.length > 0) {
          // Group by date for cleaner chart
          const dataByDate = new Map<string, { testGrades: number[], teacherGrades: number[] }>();
          
          testResults.forEach(test => {
            const dateStr = test.date.toLocaleDateString();
            if (!dataByDate.has(dateStr)) {
              dataByDate.set(dateStr, { testGrades: [], teacherGrades: [] });
            }
            const dateData = dataByDate.get(dateStr)!;
            dateData.testGrades.push(test.testGrade);
            dateData.teacherGrades.push(test.teacherGrade);
          });
          
          // Convert map to arrays for the chart
          const labels: string[] = [];
          const testGrades: number[] = [];
          const teacherGrades: number[] = [];
          
          // Sort dates
          const sortedDates = Array.from(dataByDate.keys()).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
          );
          
          sortedDates.forEach(date => {
            const dateData = dataByDate.get(date)!;
            labels.push(date);
            
            // Calculate average for each date
            const avgTestGrade = dateData.testGrades.reduce((sum, grade) => sum + grade, 0) / dateData.testGrades.length;
            const avgTeacherGrade = dateData.teacherGrades.reduce((sum, grade) => sum + grade, 0) / dateData.teacherGrades.length;
            
            testGrades.push(Math.round(avgTestGrade));
            teacherGrades.push(Math.round(avgTeacherGrade));
          });
          
          console.log("Chart data prepared:", {
            labels,
            testGrades,
            teacherGrades
          });
          
          setTimeSeriesData({
            labels,
            testGrades,
            teacherGrades
          });
        } else {
          // No data
          console.log("No data available for time series chart");
          setTimeSeriesData({
            labels: [],
            testGrades: [],
            teacherGrades: []
          });
        }
      } catch (error) {
        console.error('Error fetching time series data:', error);
        // Reset data
        setTimeSeriesData({
          labels: [],
          testGrades: [],
          teacherGrades: []
        });
      } finally {
        setChartLoading(false);
      }
    };
    
    fetchTimeSeriesData();
  }, [selectedStudent, selectedTeacher, selectedManager, dateRange]);
  
  // Add useEffect to fetch student rankings
  useEffect(() => {
    const fetchStudentRankings = async () => {
      setRankingsLoading(true);
      try {
        console.log("Fetching student rankings");
        
        // Get all student users
        const usersCollection = collection(db, 'users');
        const studentsQuery = query(usersCollection, where('profileType', '==', 'Student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        // Get student IDs and names
        const studentUsers = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || 'Unknown',
          email: doc.data().email || ''
        }));
        
        console.log(`Found ${studentUsers.length} students`);
        
        // Convert date range to strings in YYYY-MM-DD format for string comparison
        const startDateStr = formatDateForInput(dateRange.startDate);
        const endDateStr = formatDateForInput(dateRange.endDate);
        
        console.log("Rankings date range:", {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          startDateStr,
          endDateStr
        });
        
        // Get all test results
        const testsCollection = collection(db, 'testResults');
        const allTestsSnapshot = await getDocs(testsCollection);
        
        console.log(`Found ${allTestsSnapshot.docs.length} total test results`);
        
        // For each student, filter the test results
        const studentTestsPromises = studentUsers.map(async student => {
          // Filter tests for this student
          const studentTests = allTestsSnapshot.docs
            .map(doc => {
              const data = doc.data();
              
              // Check if this test belongs to the student
              if (data.studentId !== student.id) {
                return null;
              }
              
              // Convert string testDate to Date object for comparison
              let testDate: Date;
              if (typeof data.testDate === 'string') {
                testDate = new Date(data.testDate);
                testDate.setHours(12, 0, 0, 0);
              } else if (data.testDate instanceof Timestamp) {
                testDate = data.testDate.toDate();
                testDate.setHours(12, 0, 0, 0);
              } else {
                // Skip if no valid date
                return null;
              }
              
              const testDateStr = formatDateForInput(testDate);
              
              // Filter by date range
              const isInDateRange = testDateStr >= startDateStr && testDateStr <= endDateStr;
              if (!isInDateRange) {
                return null;
              }
              
              return {
                testGrade: typeof data.testGrade === 'string' ? parseInt(data.testGrade, 10) : (data.testGrade || 0),
                teacherGrade: typeof data.gradeByTeacher === 'string' ? parseInt(data.gradeByTeacher, 10) : (data.gradeByTeacher || 0),
                date: testDate
              };
            })
            .filter(Boolean);
          
          // Calculate average scores
          const tests = studentTests.filter(test => test !== null) as Array<{
            testGrade: number;
            teacherGrade: number;
            date: Date;
          }>;
          
          console.log(`Found ${tests.length} tests for student ${student.name}`);
          
          if (tests.length === 0) return null;
          
          const avgTestGrade = tests.reduce((sum, test) => sum + test.testGrade, 0) / tests.length;
          const avgTeacherGrade = tests.reduce((sum, test) => sum + test.teacherGrade, 0) / tests.length;
          
          // Calculate progress (change in test grade between newest and second newest tests)
          tests.sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending (newest first)
          
          // Default progress to 0 if there's only one test
          let progressDiff = 0;
          
          // Only calculate progress if there are at least 2 tests
          if (tests.length >= 2) {
            const newestTest = tests[0];
            const secondNewestTest = tests[1];
            progressDiff = newestTest.testGrade - secondNewestTest.testGrade;
          }
          
          return {
            ...student,
            testGrade: Math.round(avgTestGrade),
            teacherGrade: Math.round(avgTeacherGrade),
            progress: progressDiff,
            testsCount: tests.length
          };
        });
        
        // Resolve all promises and filter out nulls
        const studentTestResults = (await Promise.all(studentTestsPromises)).filter(Boolean) as Array<{
          id: string;
          name: string;
          email: string;
          testGrade: number;
          teacherGrade: number;
          progress: number;
          testsCount: number;
        }>;
        
        // Sort students by test grade and assign rank
        studentTestResults.sort((a, b) => b.testGrade - a.testGrade);
        
        const rankings = studentTestResults.map((student, index) => ({
          id: student.id,
          rank: index + 1,
          name: student.name,
          email: student.email,
          testGrade: student.testGrade,
          teacherGrade: student.teacherGrade,
          progress: student.progress
        }));
        
        console.log("Student rankings:", rankings);
        setStudentRankings(rankings);
      } catch (error) {
        console.error("Error fetching student rankings:", error);
        // Use empty array if there's an error
        setStudentRankings([]);
      } finally {
        setRankingsLoading(false);
      }
    };
    
    fetchStudentRankings();
  }, [dateRange]);
  
  // Add useEffect to calculate overall metrics for all test results
  useEffect(() => {
    const calculateOverallMetrics = async () => {
      try {
        // Get all test results
        const testsCollection = collection(db, 'testResults');
        const testsSnapshot = await getDocs(testsCollection);
        
        // Convert date range to strings for comparison
        const startDateStr = formatDateForInput(dateRange.startDate);
        const endDateStr = formatDateForInput(dateRange.endDate);
        
        // Calculate previous period start and end dates (same duration, previous period)
        const currentPeriodDays = (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24);
        const previousPeriodEndDate = new Date(dateRange.startDate);
        previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 1);
        const previousPeriodStartDate = new Date(previousPeriodEndDate);
        previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - currentPeriodDays);
        
        const previousStartDateStr = formatDateForInput(previousPeriodStartDate);
        const previousEndDateStr = formatDateForInput(previousPeriodEndDate);
        
        console.log("Date ranges for metrics:", {
          current: { startDateStr, endDateStr },
          previous: { previousStartDateStr, previousEndDateStr }
        });
        
        // Arrays to store filtered test results
        const currentPeriodTests: Array<{
          testGrade: number;
          teacherGrade: number;
          isCompleted: boolean;
        }> = [];
        
        const previousPeriodTests: Array<{
          testGrade: number;
          teacherGrade: number;
          isCompleted: boolean;
        }> = [];
        
        // Process all tests and filter by date
        testsSnapshot.forEach(doc => {
          const data = doc.data();
          
          // Extract test date
          let testDate: Date;
          if (typeof data.testDate === 'string') {
            testDate = new Date(data.testDate);
          } else if (data.testDate instanceof Timestamp) {
            testDate = data.testDate.toDate();
          } else {
            return; // Skip invalid dates
          }
          
          const testDateStr = testDate.toISOString().split('T')[0];
          
          // Convert grades to numbers
          const testGrade = typeof data.testGrade === 'string' 
            ? parseInt(data.testGrade, 10) 
            : (data.testGrade || 0);
            
          const teacherGrade = typeof data.gradeByTeacher === 'string' 
            ? parseInt(data.gradeByTeacher, 10) 
            : (data.gradeByTeacher || 0);
          
          // Determine if test is completed (has both grades)
          const isCompleted = testGrade > 0 && teacherGrade > 0;
          
          // Add to appropriate array based on date range
          if (testDateStr >= startDateStr && testDateStr <= endDateStr) {
            currentPeriodTests.push({
              testGrade,
              teacherGrade,
              isCompleted
            });
          } else if (testDateStr >= previousStartDateStr && testDateStr <= previousEndDateStr) {
            previousPeriodTests.push({
              testGrade,
              teacherGrade,
              isCompleted
            });
          }
        });
        
        // Calculate current period metrics
        const currentTestGradeSum = currentPeriodTests.reduce((sum, test) => sum + test.testGrade, 0);
        const currentTeacherGradeSum = currentPeriodTests.reduce((sum, test) => sum + test.teacherGrade, 0);
        const currentCompletedCount = currentPeriodTests.filter(test => test.isCompleted).length;
        
        const currentAvgTestGrade = currentPeriodTests.length > 0 
          ? Math.round(currentTestGradeSum / currentPeriodTests.length) 
          : 0;
        const currentAvgTeacherGrade = currentPeriodTests.length > 0 
          ? Math.round(currentTeacherGradeSum / currentPeriodTests.length) 
          : 0;
        const currentCompletionRate = currentPeriodTests.length > 0 
          ? Math.round((currentCompletedCount / currentPeriodTests.length) * 100) 
          : 0;
        
        // Calculate previous period metrics
        const previousTestGradeSum = previousPeriodTests.reduce((sum, test) => sum + test.testGrade, 0);
        const previousTeacherGradeSum = previousPeriodTests.reduce((sum, test) => sum + test.teacherGrade, 0);
        const previousCompletedCount = previousPeriodTests.filter(test => test.isCompleted).length;
        
        const previousAvgTestGrade = previousPeriodTests.length > 0 
          ? Math.round(previousTestGradeSum / previousPeriodTests.length) 
          : 0;
        const previousAvgTeacherGrade = previousPeriodTests.length > 0 
          ? Math.round(previousTeacherGradeSum / previousPeriodTests.length) 
          : 0;
        const previousCompletionRate = previousPeriodTests.length > 0 
          ? Math.round((previousCompletedCount / previousPeriodTests.length) * 100) 
          : 0;
        
        // Calculate changes
        const testGradeChange = previousAvgTestGrade > 0 
          ? currentAvgTestGrade - previousAvgTestGrade 
          : 0;
        const teacherGradeChange = previousAvgTeacherGrade > 0 
          ? currentAvgTeacherGrade - previousAvgTeacherGrade 
          : 0;
        const completionRateChange = previousCompletionRate > 0 
          ? currentCompletionRate - previousCompletionRate 
          : 0;
        
        console.log("Calculated metrics:", {
          current: {
            avgTestGrade: currentAvgTestGrade,
            avgTeacherGrade: currentAvgTeacherGrade,
            completionRate: currentCompletionRate
          },
          previous: {
            avgTestGrade: previousAvgTestGrade,
            avgTeacherGrade: previousAvgTeacherGrade,
            completionRate: previousCompletionRate
          },
          changes: {
            testGradeChange,
            teacherGradeChange,
            completionRateChange
          }
        });
        
        // Update state with metrics
        setOverallMetrics({
          avgTestGrade: currentAvgTestGrade,
          avgTeacherGrade: currentAvgTeacherGrade,
          testGradeChange,
          teacherGradeChange,
          completionRate: currentCompletionRate,
          completionRateChange
        });
        
      } catch (error) {
        console.error("Error calculating overall metrics:", error);
      }
    };
    
    calculateOverallMetrics();
  }, [dateRange]);
  
  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Test Grade',
        data: timeSeriesData.testGrades,
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      },
      {
        label: 'Grade by Teacher',
        data: timeSeriesData.teacherGrades,
        borderColor: 'rgb(34, 197, 94)', // green-500
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.1
      }
    ]
  };
  
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Grade (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
  };
  
  // Add a function to inspect Firestore collections
  const inspectFirestoreCollections = async () => {
    try {
      // Check available collections
      console.log("Inspecting Firestore collections");
      
      // Try both 'tests' and 'testResults' collections
      const collectionsToCheck = ['tests', 'testResults', 'testResult'];
      
      for (const collectionName of collectionsToCheck) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          console.log(`Collection '${collectionName}' exists with ${snapshot.docs.length} documents`);
          
          // Inspect first document structure if available
          if (snapshot.docs.length > 0) {
            const firstDoc = snapshot.docs[0];
            console.log(`Sample document from '${collectionName}':`, {
              id: firstDoc.id,
              data: firstDoc.data()
            });
          }
        } catch (err) {
          console.log(`Error checking collection '${collectionName}':`, err);
        }
      }
    } catch (error) {
      console.error("Error inspecting Firestore collections:", error);
    }
  };
  
  // Run the collection inspector on component mount
  useEffect(() => {
    inspectFirestoreCollections();
  }, []);
  
  return (
    <RoleBasedRoute 
      requiredRoles={['Owner', 'Manager', 'Teacher']}
      key="report-route"
    >
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Student Report</h1>
          <p className="mt-1 text-sm text-black">
            Track student performance, view rankings and evaluation metrics
          </p>
        </div>
        
        {/* User and Date Filters */}
        <div className="mb-6 bg-[#F8F4EA] rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <FunnelIcon className="h-5 w-5 text-[#8B4513] mr-2" />
            <h2 className="text-lg font-medium text-black">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student Filter */}
            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                id="student-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">All Students (Average)</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Teacher Filter */}
            <div>
              <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Teacher
              </label>
              <select
                id="teacher-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">All Teachers (Average)</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Manager Filter */}
            <div>
              <label htmlFor="manager-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <select
                id="manager-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
              >
                <option value="">All Managers (Average)</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="date"
                    className="block w-full rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
                    value={formatDateForInput(dateRange.startDate)}
                    onChange={handleStartDateChange}
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="date"
                    className="block w-full rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
                    value={formatDateForInput(dateRange.endDate)}
                    onChange={handleEndDateChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Performance Chart - updated to use real data */}
          <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Average Performance</h3>
              <ChartBarIcon className="h-6 w-6 text-[#8B4513]" />
            </div>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8B4513]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <SkillBar label="Test Grade" percentage={performanceData.testGrade} color="bg-blue-500" />
                <SkillBar label="Grade by Teacher" percentage={performanceData.teacherGrade} color="bg-green-500" />
              </div>
            )}
          </div>
          
          {/* Progress Over Time Chart - updated with real chart */}
          <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Progress Over Time</h3>
              <div className="flex space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Test Grade</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Grade by Teacher</span>
                </div>
              </div>
            </div>
            
            {selectedStudent || selectedTeacher || selectedManager ? (
              chartLoading ? (
                <div className="h-64 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8B4513]"></div>
                </div>
              ) : timeSeriesData.labels.length > 0 ? (
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-64 bg-[#FCF8F3] rounded-md border border-[#E6D7B8] flex items-center justify-center">
                  <p className="text-gray-500">No data available for the selected filters</p>
                </div>
              )
            ) : (
              <div className="h-64 bg-[#FCF8F3] rounded-md border border-[#E6D7B8] flex items-center justify-center">
                <p className="text-gray-500">Select a specific user to view progress over time</p>
              </div>
            )}
            
            <p className="mt-2 text-xs text-gray-600 text-center">
              Data from {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Student Rankings Section - Updated with real data */}
        <div className="mb-6">
          <div className="bg-[#F8F4EA] rounded-lg shadow">
            <div className="p-6 border-b border-[#E6D7B8]">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">Student Rankings</h3>
                <AcademicCapIcon className="h-6 w-6 text-[#8B4513]" />
              </div>
              <p className="text-sm text-gray-600">Based on test scores and teacher evaluations</p>
            </div>
            
            {rankingsLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8B4513]"></div>
              </div>
            ) : studentRankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E6D7B8]">
                  <thead className="bg-[#F0E6D2]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Rank</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Test Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Grade by Teacher</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentRankings.map((student) => (
                      <tr key={student.id} className="hover:bg-[#FEFAF0]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`flex items-center justify-center h-6 w-6 rounded-full ${
                              student.rank <= 3 ? 'bg-[#F0E6D2] text-[#8B4513]' : 'bg-gray-100 text-gray-500'
                            } text-xs font-medium`}>
                              {student.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-[#F0E6D2] rounded-full flex items-center justify-center">
                              <UserGroupIcon className="h-4 w-4 text-[#8B4513]" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-black">{student.name}</div>
                              <div className="text-xs text-gray-600">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-black">{student.testGrade}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-blue-400 mr-1" />
                            <span className="text-sm text-black">{student.teacherGrade}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${
                            student.progress > 0 ? 'text-green-600' : student.progress < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {student.progress > 0 ? (
                              <ArrowUpIcon className="h-4 w-4 mr-1" />
                            ) : student.progress < 0 ? (
                              <ArrowDownIcon className="h-4 w-4 mr-1" />
                            ) : (
                              <span className="h-4 w-4 mr-1">-</span>
                            )}
                            <span>{Math.abs(student.progress)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No student data available for the selected date range
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </RoleBasedRoute>
  );
}

// Skill Bar Component
function SkillBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-black">{label}</span>
        <span className="text-sm font-medium text-black">{percentage}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  changeValue
}: { 
  title: string; 
  value: string; 
  change?: string; 
  trend: 'up' | 'down' | 'neutral'; 
  changeValue?: string;
}) {
  return (
    <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-black">{value}</p>
        {change && (
          <p className={`ml-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className="mt-1">
        {changeValue ? (
          <p className="text-xs text-gray-600">{changeValue}</p>
        ) : (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpIcon className="h-3 w-3 mr-1" />
            ) : trend === 'down' ? (
              <ArrowDownIcon className="h-3 w-3 mr-1" />
            ) : null}
            <span>Since previous period</span>
          </div>
        )}
      </div>
    </div>
  );
} 