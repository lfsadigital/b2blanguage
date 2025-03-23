'use client';

import { useState, useMemo } from 'react';
import DashboardShell from '@/components/ui/dashboard-shell';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Mock data for the class diary
const mockStudents = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Corp',
    level: 'Advanced',
    lastClass: '2023-03-10',
    nextClass: '2023-03-17',
    progress: 'Good progress with business vocabulary. Needs to work on presentation skills.',
  },
  {
    id: '2',
    name: 'Emma Johnson',
    company: 'Global Tech',
    level: 'Intermediate',
    lastClass: '2023-03-12',
    nextClass: '2023-03-19',
    progress: 'Improving in conversation fluency. Should focus on email writing.',
  },
  {
    id: '3',
    name: 'Michael Brown',
    company: 'Finance Plus',
    level: 'Beginner',
    lastClass: '2023-03-08',
    nextClass: '2023-03-15',
    progress: 'Building basic vocabulary. Struggles with speaking confidence.',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    company: 'Marketing Solutions',
    level: 'Intermediate',
    lastClass: '2023-03-11',
    nextClass: '2023-03-18',
    progress: 'Good grammar knowledge but needs to expand industry-specific terms.',
  },
  {
    id: '5',
    name: 'David Lee',
    company: 'Tech Innovations',
    level: 'Advanced',
    lastClass: '2023-03-09',
    nextClass: '2023-03-16',
    progress: 'Excellent conversational skills. Working on advanced writing.',
  }
];

export default function ClassDiaryPage() {
  const [students, setStudents] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students
  const sortedStudents = useMemo(() => {
    let sortableStudents = [...filteredStudents];
    if (sortConfig !== null) {
      sortableStudents.sort((a, b) => {
        if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Student detail view
  const studentDetail = selectedStudent 
    ? students.find(s => s.id === selectedStudent)
    : null;

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Class Diary</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your students, track their progress, and plan your lessons
        </p>
      </div>

      {selectedStudent ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Student Details</h2>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to List
            </button>
          </div>
          
          {studentDetail && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="h-32 w-32 rounded-full bg-[#F5DEB3] flex items-center justify-center">
                    <UserCircleIcon className="h-24 w-24 text-[#8B4513]" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{studentDetail.name}</h3>
                    <p className="text-sm text-gray-500">{studentDetail.company} • {studentDetail.level} Level</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-gray-500">
                        <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                        Last Class
                      </div>
                      <p className="mt-1 text-gray-900">{studentDetail.lastClass}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-gray-500">
                        <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                        Next Class
                      </div>
                      <p className="mt-1 text-gray-900">{studentDetail.nextClass}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Progress Notes</h4>
                    <div className="mt-2 bg-[#FFF8DC] p-4 rounded-lg border border-[#DEB887]">
                      <p className="text-gray-800">{studentDetail.progress}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900">Recent Classes</h4>
                    <div className="mt-2 space-y-3">
                      <div className="bg-white p-3 border border-gray-200 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">March 10, 2023</span>
                          <span className="text-xs text-gray-500">60 min</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Covered market analysis vocabulary and practiced presentation skills.</p>
                      </div>
                      <div className="bg-white p-3 border border-gray-200 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">March 3, 2023</span>
                          <span className="text-xs text-gray-500">60 min</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Reviewed email writing best practices and common expressions.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#8B4513] hover:bg-[#A0522D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]">
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit Student
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]">
                      <DocumentTextIcon className="mr-2 h-4 w-4" />
                      Add Class Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search students..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add New Student
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        Student
                        {sortConfig?.key === 'name' && (
                          sortConfig.direction === 'ascending' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('company')}
                    >
                      <div className="flex items-center">
                        Company
                        {sortConfig?.key === 'company' && (
                          sortConfig.direction === 'ascending' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('level')}
                    >
                      <div className="flex items-center">
                        Level
                        {sortConfig?.key === 'level' && (
                          sortConfig.direction === 'ascending' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('nextClass')}
                    >
                      <div className="flex items-center">
                        Next Class
                        {sortConfig?.key === 'nextClass' && (
                          sortConfig.direction === 'ascending' 
                            ? <ArrowUpIcon className="ml-1 h-4 w-4" /> 
                            : <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#F5DEB3] flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-[#8B4513]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.level === 'Beginner' ? 'bg-green-100 text-green-800' : 
                          student.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {student.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.nextClass}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit action
                          }}
                          className="text-[#8B4513] hover:text-[#A0522D] mr-4"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete action
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="px-6 py-4 text-center text-sm text-gray-500">
                No students found. Try a different search term or add a new student.
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
} 