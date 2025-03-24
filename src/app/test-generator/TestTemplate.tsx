'use client';

import React from 'react';

interface TestTemplateProps {
  title?: string;
  studentName?: string;
  teacherName?: string;
  date?: string;
  subject: string;
  content: React.ReactNode;
}

export default function TestTemplate({
  subject,
  content
}: TestTemplateProps) {
  return (
    <div className="p-4 print:p-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 print:text-xl mb-2">
          {subject}
        </h1>
      </div>
      
      <div className="prose max-w-none print:text-sm">
        {content}
      </div>
    </div>
  );
} 