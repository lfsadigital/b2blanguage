'use client';

import { useState } from 'react';
import TestGeneratorForm from '@/app/components/TestGeneratorForm';
import { TestFormData } from '@/app/lib/types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { ArrowLeftIcon, ExclamationCircleIcon, DocumentArrowDownIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export default function TestGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string | null>(null);
  const [conversationQuestions, setConversationQuestions] = useState<string | null>(null);
  const [teacherTips, setTeacherTips] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string>('');
  const [testHeader, setTestHeader] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'test' | 'conversation' | 'tips'>('test');

  const handleSubmit = async (formData: TestFormData) => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedTest(null);
    setQuestions(null);
    setAnswers(null);
    setConversationQuestions(null);
    setTeacherTips(null);
    setTestHeader([]);
    setContentUrl(formData.contentUrl);
    
    try {
      const response = await fetch('/api/test-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to generate test. Please try again.');
        return;
      }

      setGeneratedTest(data.test);
      setQuestions(data.questions);
      setAnswers(data.answers);
      
      // Set test header from the data or create a default
      const header = [];
      if (formData.professorName) header.push(`Teacher: ${formData.professorName}`);
      if (formData.studentName) header.push(`Student: ${formData.studentName}`);
      if (data.subject) header.push(`Subject: ${data.subject}`);
      setTestHeader(header);

      // Generate conversation questions
      try {
        const convResponse = await fetch('/api/test-generator/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentUrl: formData.contentUrl, 
            studentLevel: formData.studentLevel,
            subject: data.subject
          }),
        });

        const convData = await convResponse.json();
        if (convResponse.ok) {
          setConversationQuestions(convData.conversationQuestions);
        } else {
          console.error('Error response from conversation API:', convData.error);
        }
      } catch (error) {
        console.error('Error generating conversation questions:', error);
      }

      // Generate teacher tips
      try {
        const tipsResponse = await fetch('/api/test-generator/teacher-tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentUrl: formData.contentUrl, 
            studentLevel: formData.studentLevel,
            subject: data.subject
          }),
        });

        const tipsData = await tipsResponse.json();
        if (tipsResponse.ok) {
          setTeacherTips(tipsData.teacherTips);
        } else {
          console.error('Error response from teacher tips API:', tipsData.error);
        }
      } catch (error) {
        console.error('Error generating teacher tips:', error);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = (content: string, filename: string) => {
    const doc = new jsPDF();
    
    // Split content into lines and add to PDF
    const lines = content.split('\n');
    let y = 20;
    
    // Add content
    doc.setFontSize(12);
    lines.forEach(line => {
      // Header lines should be bold
      if (line.startsWith('Professor:') || 
          line.startsWith('Student:') || 
          line.startsWith('Test about') || 
          line.startsWith('Date:') ||
          line.startsWith('Questions:') ||
          line.startsWith('Answers:') ||
          line.startsWith('Vocabulary:') ||
          line.startsWith('Grammar:') ||
          line.startsWith('Pronunciation:')) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      // Check if we need to add a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      // Add the line
      doc.text(line, 10, y);
      y += 7;
    });
    
    // Add footer with reference URL
    if (contentUrl) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const footer = `Reference: ${contentUrl}`;
        doc.text(footer, 10, doc.internal.pageSize.height - 10);
      }
    }
    
    // Save the PDF
    doc.save(filename);
  };

  const generateCombinedPDF = () => {
    if (!testHeader || !conversationQuestions || !teacherTips || !answers) return;

    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(12);

    // Add header (Section 0)
    testHeader.forEach(line => {
      if (line.startsWith('Professor:') || 
          line.startsWith('Student:') || 
          line.startsWith('Test about') || 
          line.startsWith('Date:')) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(line, 10, y);
      y += 7;
    });

    y += 7;
    
    // Add Conversation Questions (Section 1)
    doc.setFont('helvetica', 'bold');
    doc.text("Making Conversation:", 10, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    conversationQuestions.split('\n').forEach(line => {
      // Check if we need to add a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(line, 10, y);
      y += 7;
    });

    y += 7;
    
    // Add Teacher Tips (Section 2)
    doc.addPage();
    y = 20;
    
    doc.setFont('helvetica', 'bold');
    doc.text("Teacher's Aid:", 10, y);
    y += 10;

    teacherTips.split('\n').forEach(line => {
      if (line.startsWith('Vocabulary:') || 
          line.startsWith('Grammar:') || 
          line.startsWith('Pronunciation:')) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      // Check if we need to add a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(line, 10, y);
      y += 7;
    });

    y += 7;
    
    // Add Test Answers (Section 3)
    doc.addPage();
    y = 20;
    
    // Extract answer section headers
    const answerLines = answers.split('\n');
    let headerEnded = false;
    
    answerLines.forEach(line => {
      if (!headerEnded) {
        if (line.startsWith('Professor:') || 
            line.startsWith('Student:') || 
            line.startsWith('Test about') || 
            line.startsWith('Date:') ||
            line.startsWith('Answers:')) {
          doc.setFont('helvetica', 'bold');
        } else if (line.trim() === '') {
          doc.setFont('helvetica', 'normal');
        } else {
          doc.setFont('helvetica', 'normal');
          headerEnded = true;
        }
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      // Check if we need to add a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(line, 10, y);
      y += 7;
    });
    
    // Add footer with reference URL
    if (contentUrl) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const footer = `Reference: ${contentUrl}`;
        doc.text(footer, 10, doc.internal.pageSize.height - 10);
      }
    }
    
    // Save the PDF
    doc.save('teacher-complete-guide.pdf');
  };

  const generateWordDocument = () => {
    if (!testHeader || !questions) return;
    
    // Extract the actual test questions (remove header and add it back separately)
    const allLines = questions.split('\n');
    let headerEnded = false;
    const headerLines: string[] = [];
    const questionLines: string[] = [];
    
    allLines.forEach(line => {
      if (!headerEnded) {
        if (line.startsWith('Professor:') || 
            line.startsWith('Student:') || 
            line.startsWith('Test about') || 
            line.startsWith('Date:')) {
          headerLines.push(line);
        } else if (line.trim() === '') {
          headerLines.push(line);
        } else if (line.startsWith('Questions:')) {
          headerLines.push(line);
          headerEnded = true;
        }
      } else {
        questionLines.push(line);
      }
    });
    
    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Add header (Section 0)
            ...headerLines.map(line => {
              if (line.startsWith('Professor:') || 
                  line.startsWith('Student:') || 
                  line.startsWith('Test about') || 
                  line.startsWith('Date:') ||
                  line.startsWith('Questions:')) {
                return new Paragraph({
                  children: [new TextRun({ text: line, bold: true })],
                  spacing: { after: 200 }
                });
              } else {
                return new Paragraph({
                  children: [new TextRun({ text: line })],
                  spacing: { after: 200 }
                });
              }
            }),
            
            // Add a space
            new Paragraph({ text: '' }),
            
            // Add questions (Section 3)
            ...questionLines.map(line => {
              return new Paragraph({
                children: [new TextRun({ text: line })],
                spacing: { after: 200 }
              });
            }),
            
            // Add footer with reference URL
            new Paragraph({
              children: [new TextRun({ text: `Reference: ${contentUrl}`, italics: true })],
              spacing: { before: 400 },
              alignment: AlignmentType.LEFT
            })
          ]
        }
      ]
    });
    
    // Generate and save the document
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'test-questions.docx');
    });
  };
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold text-white">Test Generator</h1>
        <Link 
          href="/"
          className="text-white hover:text-gray-200 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      <div className="space-y-8">
        {/* Generator Form */}
        <div className="apple-card">
          <TestGeneratorForm onSubmit={handleSubmit} isGenerating={isGenerating} />
        </div>

        {/* Loading state */}
        {isGenerating && (
          <div className="bg-white rounded-xl shadow p-6 mb-8 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-24 h-24">
                <div className="absolute top-0 left-0 w-full h-full border-8 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-8 border-t-[var(--primary)] rounded-full animate-spin"></div>
              </div>
              <h3 className="mt-6 text-xl font-medium text-gray-800">Generating Test...</h3>
              <p className="mt-2 text-gray-600">This may take up to a minute. We're analyzing the content and creating a tailored test.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Generating Test</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Content */}
        {generatedTest && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-800">Generated Materials</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {testHeader.join(' • ')}
                </p>
              </div>
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('test')}
                    className={`${
                      activeTab === 'test'
                        ? 'border-[var(--primary)] text-[var(--primary)] font-bold'
                        : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
                  >
                    Test
                  </button>
                  <button
                    onClick={() => setActiveTab('conversation')}
                    className={`${
                      activeTab === 'conversation'
                        ? 'border-[var(--primary)] text-[var(--primary)] font-bold'
                        : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${!conversationQuestions ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!conversationQuestions}
                  >
                    Conversation Questions
                  </button>
                  <button
                    onClick={() => setActiveTab('tips')}
                    className={`${
                      activeTab === 'tips'
                        ? 'border-[var(--primary)] text-[var(--primary)] font-bold'
                        : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${!teacherTips ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!teacherTips}
                  >
                    Teacher Tips
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="px-6 py-5">
              {activeTab === 'test' && questions && (
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="p-6">
                    <div className="prose max-w-none text-gray-800">
                      {testHeader.map((line, i) => (
                        <p key={i} className="font-medium text-black">{line}</p>
                      ))}
                      <div className="whitespace-pre-wrap text-black">{questions}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mt-6 pb-6">
                    <button
                      onClick={() => questions && generatePDF(questions, 'test-questions.pdf')}
                      className="apple-button flex items-center space-x-2 px-4 py-2 text-sm"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      <span>Download Questions</span>
                    </button>
                    <button
                      onClick={() => answers && generatePDF(answers, 'test-answers.pdf')}
                      className="apple-button flex items-center space-x-2 px-4 py-2 text-sm"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span>Download Answers</span>
                    </button>
                    <button
                      onClick={generateCombinedPDF}
                      className="apple-button flex items-center space-x-2 px-4 py-2 text-sm"
                    >
                      <span>Export Combined PDF</span>
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'conversation' && conversationQuestions && (
                <div className="bg-white p-6 rounded-xl">
                  <h4 className="text-lg font-medium text-black mb-4">Conversation Questions</h4>
                  <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: conversationQuestions }} />
                  
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => generatePDF(conversationQuestions || '', 'conversation_questions.pdf')}
                      className="apple-button text-sm"
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'tips' && teacherTips && (
                <div className="bg-white p-6 rounded-xl">
                  <h4 className="text-lg font-medium text-black mb-4">Teacher Tips</h4>
                  <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: teacherTips }} />
                  
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => generatePDF(teacherTips || '', 'teacher_tips.pdf')}
                      className="apple-button text-sm"
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 