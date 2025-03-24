'use client';

import React from 'react';

interface TestTemplateProps {
  title?: string; // Making this optional since we're not displaying it
  studentName: string;
  teacherName: string;
  date: string;
  subject: string;
  content: React.ReactNode;
}

const TestTemplate: React.FC<TestTemplateProps> = ({
  studentName,
  teacherName,
  date,
  subject,
  content
}) => {
  return (
    <div className="font-serif max-w-[8.5in] mx-auto bg-white p-8 shadow-md print:shadow-none">
      {/* Header with simple grade line */}
      <div className="mb-8">
        <div className="text-sm">
          <p className="mb-1"><span className="font-semibold text-gray-700">Student:</span> <span className="text-gray-900">{studentName}</span></p>
          <p className="mb-1"><span className="font-semibold text-gray-700">Teacher:</span> <span className="text-gray-900">{teacherName}</span></p>
          <p className="mb-1"><span className="font-semibold text-gray-700">Subject:</span> <span className="text-gray-900">{subject}</span></p>
          <p className="mb-1"><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{date}</span></p>
          <p className="mb-1"><span className="font-semibold text-gray-700">Grade:</span> <span className="text-gray-900">_______________</span></p>
        </div>
      </div>
      
      {/* Test content */}
      <div className="text-gray-900">
        {content}
      </div>
      
      {/* Footer with teacher signature */}
      <div className="mt-16 pt-4 border-t border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="text-sm"><span className="font-semibold text-gray-700">Teacher Comments:</span></p>
            <div className="mt-2 border-b border-gray-400 w-64 h-12"></div>
          </div>
          <div className="text-right">
            <p className="text-sm"><span className="font-semibold text-gray-700">Teacher Signature:</span></p>
            <div className="mt-2 border-b border-gray-400 w-48 h-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTemplate; 