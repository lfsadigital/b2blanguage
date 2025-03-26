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
} from '@heroicons/react/24/outline';
import RoleBasedRoute from '@/app/components/RoleBasedRoute';
import { db } from '../../lib/firebase/firebase';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';

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

interface Relationship {
  id: string;
  studentId: string;
  teacherId: string;
  type: string;
}

interface PerformanceData {
  testGrade: number;
  teacherGrade: number;
}

export default function AnalyticsPage() {
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
  
  // Relationships data
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<UserProfile[]>([]);
  
  // Performance data
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    testGrade: 85,
    teacherGrade: 78
  });
  
  // Date range
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });
  
  // Format dates for inputs
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
  
  // Fetch relationships
  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const relationshipsCollection = collection(db, 'relationships');
        const relationshipsSnapshot = await getDocs(relationshipsCollection);
        
        const relationshipsList = relationshipsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            studentId: data.studentId || '',
            teacherId: data.teacherId || '',
            type: data.type || ''
          } as Relationship;
        });
        
        setRelationships(relationshipsList);
      } catch (error) {
        console.error('Error fetching relationships:', error);
      }
    };
    
    fetchRelationships();
  }, []);
  
  // Update available teachers based on selected student
  useEffect(() => {
    if (selectedStudent) {
      // Filter relationships to find teachers for this student
      const studentTeacherRelationships = relationships.filter(
        rel => rel.studentId === selectedStudent && rel.type === 'student-teacher'
      );
      
      // Get teacher IDs
      const teacherIds = studentTeacherRelationships.map(rel => rel.teacherId);
      
      // Filter teachers to only include those related to this student
      const studentTeachers = teachers.filter(teacher => 
        teacherIds.includes(teacher.id)
      );
      
      setAvailableTeachers(studentTeachers);
    } else {
      // If no student selected, all teachers are available
      setAvailableTeachers(teachers);
    }
  }, [selectedStudent, relationships, teachers]);
  
  // Update performance data based on selected filters
  useEffect(() => {
    // In a real app, this would fetch actual data from the database
    // For now, we'll just update with mock data
    if (selectedStudent) {
      const student = studentRankings.find(s => s.id.toString() === selectedStudent);
      if (student) {
        setPerformanceData({
          testGrade: student.testGrade,
          teacherGrade: student.teacherGrade
        });
      }
    } else {
      // Show average data
      const avgTestGrade = Math.round(
        studentRankings.reduce((sum, student) => sum + student.testGrade, 0) / 
        studentRankings.length
      );
      
      const avgTeacherGrade = Math.round(
        studentRankings.reduce((sum, student) => sum + student.teacherGrade, 0) / 
        studentRankings.length
      );
      
      setPerformanceData({
        testGrade: avgTestGrade,
        teacherGrade: avgTeacherGrade
      });
    }
  }, [selectedStudent, selectedTeacher, selectedManager, selectedOwner]);
  
  // Handle filter changes
  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    // Reset teacher selection if we're changing students
    setSelectedTeacher('');
  };
  
  return (
    <RoleBasedRoute 
      requiredRoles={['Owner', 'Manager', 'Teacher']}
      key="analytics-route"
    >
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Student Analytics</h1>
          <p className="mt-1 text-sm text-black">
            Track student performance, view rankings and engagement metrics
          </p>
        </div>
        
        {/* User and Date Filters */}
        <div className="mb-6 bg-[#F8F4EA] rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <FunnelIcon className="h-5 w-5 text-[#8B4513] mr-2" />
            <h2 className="text-lg font-medium text-black">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Student Filter */}
            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <div className="relative">
                <select
                  id="student-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white appearance-none pl-3 pr-10 py-2"
                  value={selectedStudent}
                  onChange={handleStudentChange}
                >
                  <option value="">All Students (Average)</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.displayName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Teacher Filter */}
            <div>
              <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Teacher
              </label>
              <div className="relative">
                <select
                  id="teacher-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white appearance-none pl-3 pr-10 py-2"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="">All Teachers (Average)</option>
                  {availableTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.displayName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Manager Filter */}
            <div>
              <label htmlFor="manager-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <div className="relative">
                <select
                  id="manager-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white appearance-none pl-3 pr-10 py-2"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Owner Filter */}
            <div>
              <label htmlFor="owner-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <div className="relative">
                <select
                  id="owner-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white appearance-none pl-3 pr-10 py-2"
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                >
                  <option value="">All Owners (Average)</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.displayName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white py-2"
                    value={formatDateForInput(dateRange.startDate)}
                    onChange={(e) => {
                      setDateRange(prev => ({
                        ...prev,
                        startDate: new Date(e.target.value)
                      }));
                    }}
                  />
                </div>
                <span className="inline-flex items-center text-gray-500">to</span>
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white py-2"
                    value={formatDateForInput(dateRange.endDate)}
                    onChange={(e) => {
                      setDateRange(prev => ({
                        ...prev,
                        endDate: new Date(e.target.value)
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Performance Chart - Simplified to Test Grade and Grade by Teacher */}
          <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Average Performance</h3>
              <ChartBarIcon className="h-6 w-6 text-[#8B4513]" />
            </div>
            <div className="space-y-4">
              <SkillBar label="Test Grade" percentage={performanceData.testGrade} color="bg-blue-500" />
              <SkillBar label="Grade by Teacher" percentage={performanceData.teacherGrade} color="bg-green-500" />
            </div>
          </div>
          
          {/* Progress Over Time Chart - Only visible when a specific user is selected */}
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
            
            {selectedStudent || selectedTeacher || selectedManager || selectedOwner ? (
              // Simple line chart implementation
              <div className="h-64 bg-[#FCF8F3] rounded-md border border-[#E6D7B8] relative">
                <div className="absolute inset-0 p-4">
                  <SimpleLineChart />
                </div>
              </div>
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
        
        {/* Student Rankings Section - Updated with Test Grade and Grade by Teacher */}
        <div className="mb-6">
          <div className="bg-[#F8F4EA] rounded-lg shadow">
            <div className="p-6 border-b border-[#E6D7B8]">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">Student Rankings</h3>
                <AcademicCapIcon className="h-6 w-6 text-[#8B4513]" />
              </div>
              <p className="text-sm text-gray-600">Based on test scores and teacher evaluations</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E6D7B8]">
                <thead className="bg-[#F0E6D2]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Test Grade</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Grade by Teacher</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Participation</th>
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
                          <span className="text-sm text-black">{student.testGrade}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-blue-400 mr-1" />
                          <span className="text-sm text-black">{student.teacherGrade}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-[#8B4513] h-2.5 rounded-full" style={{ width: `${student.participation}%` }}></div>
                        </div>
                        <div className="mt-1 text-xs text-black">{student.participation}% attendance</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${
                          student.progress > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.progress > 0 ? (
                            <ArrowUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 mr-1" />
                          )}
                          <span>{Math.abs(student.progress)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Additional Metrics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Average Test Grade" 
            value={`${performanceData.testGrade}%`} 
            change={performanceData.testGrade > 85 ? '+3%' : performanceData.testGrade < 85 ? '-3%' : ''} 
            trend={performanceData.testGrade > 85 ? 'up' : performanceData.testGrade < 85 ? 'down' : 'neutral'} 
          />
          <MetricCard 
            title="Average Teacher Grade" 
            value={`${performanceData.teacherGrade}%`} 
            change={performanceData.teacherGrade > 78 ? '+5%' : performanceData.teacherGrade < 78 ? '-5%' : ''} 
            trend={performanceData.teacherGrade > 78 ? 'up' : performanceData.teacherGrade < 78 ? 'down' : 'neutral'} 
          />
          <MetricCard 
            title="Completion Rate" 
            value="92%" 
            change="-2%" 
            trend="down" 
          />
          <MetricCard 
            title="Most Difficult Test" 
            value="Business Grammar" 
            changeValue="63% avg. score" 
            trend="neutral" 
          />
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
        <span className="text-sm font-medium text-black">{percentage}%</span>
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

// Mock student rankings data
const studentRankings = [
  { id: 1, rank: 1, name: 'Eduardo S', email: 'edus@notreal.com', testGrade: 94, teacherGrade: 90, participation: 98, progress: 5 },
  { id: 2, rank: 2, name: 'Rafaela S', email: 'sersunnaoreal@gmail.com', testGrade: 88, teacherGrade: 92, participation: 95, progress: 3 },
  { id: 3, rank: 3, name: 'Serra', email: 'serra_almeida@hotmail.com', testGrade: 84, teacherGrade: 86, participation: 90, progress: 2 },
  { id: 4, rank: 4, name: 'Lucas Ferreira', email: 'lucasf@example.com', testGrade: 83, teacherGrade: 78, participation: 87, progress: -1 },
  { id: 5, rank: 5, name: 'Beatriz Campos', email: 'beatrizc@example.com', testGrade: 76, teacherGrade: 82, participation: 84, progress: 4 },
  { id: 6, rank: 6, name: 'Daniel Santos', email: 'daniels@example.com', testGrade: 74, teacherGrade: 76, participation: 79, progress: -2 },
  { id: 7, rank: 7, name: 'Isabella Melo', email: 'isabellam@example.com', testGrade: 70, teacherGrade: 74, participation: 85, progress: 1 },
];

// Simple Line Chart Component
function SimpleLineChart() {
  // Mock data points (in a real app, these would come from the database)
  const testGradeData = [68, 75, 70, 80, 85, 90, 94];
  const teacherGradeData = [65, 70, 72, 75, 78, 82, 90];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  
  // Chart dimensions
  const width = 100;
  const height = 100;
  const padding = 20;
  
  // Find max value for scaling
  const maxValue = Math.max(
    ...testGradeData,
    ...teacherGradeData
  );
  
  // Create data points (normalized to percentage of chart height)
  const testPoints = testGradeData.map((value, index) => ({
    x: (index / (testGradeData.length - 1)) * width,
    y: height - ((value / maxValue) * (height - padding)),
  }));
  
  const teacherPoints = teacherGradeData.map((value, index) => ({
    x: (index / (teacherGradeData.length - 1)) * width,
    y: height - ((value / maxValue) * (height - padding)),
  }));
  
  // Create SVG path commands for the lines
  const createPathData = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return '';
    
    return points.reduce((path, point, i) => 
      i === 0
        ? `M ${point.x},${point.y}`
        : `${path} L ${point.x},${point.y}`,
      ''
    );
  };
  
  const testGradePath = createPathData(testPoints);
  const teacherGradePath = createPathData(teacherPoints);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
          {/* X axis */}
          <line x1="0" y1={height} x2={width} y2={height} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
          
          {/* Y axis */}
          <line x1="0" y1="0" x2="0" y2={height} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
          
          {/* Test Grade Line */}
          <path
            d={testGradePath}
            fill="none"
            stroke="#3B82F6" // blue-500
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Teacher Grade Line */}
          <path
            d={teacherGradePath}
            fill="none"
            stroke="#10B981" // green-500
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data Points for Test Grade */}
          {testPoints.map((point, index) => (
            <circle
              key={`test-${index}`}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill="#3B82F6" // blue-500
            />
          ))}
          
          {/* Data Points for Teacher Grade */}
          {teacherPoints.map((point, index) => (
            <circle
              key={`teacher-${index}`}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill="#10B981" // green-500
            />
          ))}
        </svg>
        
        {/* Value tooltips - these would be dynamic in a real implementation */}
        <div className="absolute bottom-0 right-0 bg-white/80 rounded px-2 py-1 text-xs">
          Last: {testGradeData[testGradeData.length - 1]}% / {teacherGradeData[teacherGradeData.length - 1]}%
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="h-6 flex justify-between text-xs text-gray-500 mt-1">
        {months.map((month, i) => (
          <div key={month}>{month}</div>
        ))}
      </div>
    </div>
  );
} 