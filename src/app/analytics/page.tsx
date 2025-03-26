'use client';

import React, { useState } from 'react';
import DashboardShell from '../../components/ui/dashboard-shell';
import { 
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import RoleBasedRoute from '@/app/components/RoleBasedRoute';

export default function AnalyticsPage() {
  const [timeFrame, setTimeFrame] = useState('month');
  
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
        
        {/* Time frame selector */}
        <div className="mb-6 bg-[#F8F4EA] rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-black">Performance Overview</h2>
            <div className="inline-flex bg-white rounded-md shadow-sm" role="group">
              <button 
                type="button" 
                onClick={() => setTimeFrame('week')}
                className={`px-4 py-2 text-sm font-medium border border-r-0 rounded-l-lg ${
                  timeFrame === 'week' 
                    ? 'bg-[#F0E6D2] text-[#8B4513] border-[#E6D7B8]' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Week
              </button>
              <button 
                type="button" 
                onClick={() => setTimeFrame('month')}
                className={`px-4 py-2 text-sm font-medium border border-r-0 ${
                  timeFrame === 'month' 
                    ? 'bg-[#F0E6D2] text-[#8B4513] border-[#E6D7B8]' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button 
                type="button" 
                onClick={() => setTimeFrame('quarter')}
                className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${
                  timeFrame === 'quarter' 
                    ? 'bg-[#F0E6D2] text-[#8B4513] border-[#E6D7B8]' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Quarter
              </button>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Performance Chart */}
          <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Average Performance by Skill</h3>
              <ChartBarIcon className="h-6 w-6 text-[#8B4513]" />
            </div>
            <div className="space-y-4">
              <SkillBar label="Grammar" percentage={78} color="bg-blue-500" />
              <SkillBar label="Vocabulary" percentage={85} color="bg-green-500" />
              <SkillBar label="Reading" percentage={72} color="bg-purple-500" />
              <SkillBar label="Writing" percentage={68} color="bg-yellow-500" />
              <SkillBar label="Speaking" percentage={75} color="bg-red-500" />
            </div>
          </div>
          
          {/* Progress Over Time Chart */}
          <div className="bg-[#F8F4EA] rounded-lg p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Progress Over Time</h3>
              <div className="flex space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Grammar</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Vocabulary</span>
                </div>
              </div>
            </div>
            
            {/* Placeholder for line chart */}
            <div className="h-64 bg-[#FCF8F3] rounded-md border border-[#E6D7B8] flex items-center justify-center">
              <p className="text-gray-500">Line chart visualization will be implemented here</p>
            </div>
            <p className="mt-2 text-xs text-gray-600 text-center">Data shown for the {timeFrame}</p>
          </div>
        </div>
        
        {/* Student Rankings Section */}
        <div className="mb-6">
          <div className="bg-[#F8F4EA] rounded-lg shadow">
            <div className="p-6 border-b border-[#E6D7B8]">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">Student Rankings</h3>
                <AcademicCapIcon className="h-6 w-6 text-[#8B4513]" />
              </div>
              <p className="text-sm text-gray-600">Based on test scores and participation</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E6D7B8]">
                <thead className="bg-[#F0E6D2]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Average Score</th>
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
                          <span className="text-sm text-black">{student.averageScore}%</span>
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
            title="Average Score" 
            value="78%" 
            change="+3%" 
            trend="up" 
            timeFrame={timeFrame} 
          />
          <MetricCard 
            title="Completion Rate" 
            value="92%" 
            change="+5%" 
            trend="up" 
            timeFrame={timeFrame} 
          />
          <MetricCard 
            title="Engagement" 
            value="84%" 
            change="-2%" 
            trend="down" 
            timeFrame={timeFrame} 
          />
          <MetricCard 
            title="Most Difficult Topic" 
            value="Conditionals" 
            changeValue="63% avg. score" 
            trend="neutral" 
            timeFrame={timeFrame} 
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
  timeFrame,
  changeValue
}: { 
  title: string; 
  value: string; 
  change?: string; 
  trend: 'up' | 'down' | 'neutral'; 
  timeFrame: string;
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
            <span>Since last {timeFrame}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock student rankings data
const studentRankings = [
  { id: 1, rank: 1, name: 'Eduardo S', email: 'edus@notreal.com', averageScore: 92, participation: 98, progress: 5 },
  { id: 2, rank: 2, name: 'Rafaela S', email: 'sersunnaoreal@gmail.com', averageScore: 89, participation: 95, progress: 3 },
  { id: 3, rank: 3, name: 'Serra', email: 'serra_almeida@hotmail.com', averageScore: 85, participation: 90, progress: 2 },
  { id: 4, rank: 4, name: 'Lucas Ferreira', email: 'lucasf@example.com', averageScore: 82, participation: 87, progress: -1 },
  { id: 5, rank: 5, name: 'Beatriz Campos', email: 'beatrizc@example.com', averageScore: 78, participation: 84, progress: 4 },
  { id: 6, rank: 6, name: 'Daniel Santos', email: 'daniels@example.com', averageScore: 75, participation: 79, progress: -2 },
  { id: 7, rank: 7, name: 'Isabella Melo', email: 'isabellam@example.com', averageScore: 72, participation: 85, progress: 1 },
]; 