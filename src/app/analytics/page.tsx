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
import { collection, getDocs, query, where } from 'firebase/firestore';

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
  
  // Handle date range changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      startDate: new Date(e.target.value)
    }));
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      endDate: new Date(e.target.value)
    }));
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            
            {/* Owner Filter */}
            <div>
              <label htmlFor="owner-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <select
                id="owner-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
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
            </div>
            
            {/* Date Range Filter */}
            <div className="lg:col-span-1">
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
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
                    value={formatDateForInput(dateRange.startDate)}
                    onChange={handleStartDateChange}
                  />
                </div>
                <span className="inline-flex items-center text-gray-500">to</span>
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] sm:text-sm bg-white"
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
          {/* Performance Chart - Simplified to Test Grade and Grade by Teacher */}
          <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Average Performance</h3>
              <ChartBarIcon className="h-6 w-6 text-[#8B4513]" />
            </div>
            <div className="space-y-4">
              <SkillBar label="Test Grade" percentage={85} color="bg-blue-500" />
              <SkillBar label="Grade by Teacher" percentage={78} color="bg-green-500" />
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
              /* Placeholder for line chart - to be implemented */
              <div className="h-64 bg-[#FCF8F3] rounded-md border border-[#E6D7B8] flex items-center justify-center">
                <p className="text-gray-500">Line chart showing progression over time</p>
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
            value="85%" 
            change="+3%" 
            trend="up" 
          />
          <MetricCard 
            title="Average Teacher Grade" 
            value="78%" 
            change="+5%" 
            trend="up" 
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