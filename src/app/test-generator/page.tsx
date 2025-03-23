'use client';

import { useState } from 'react';
import TestGeneratorForm from '@/app/components/TestGeneratorForm';
import { TestFormData } from '@/app/lib/types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

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
            studentLevel: formData.studentLevel
          }),
        });

        const convData = await convResponse.json();
        if (convResponse.ok) {
          setConversationQuestions(convData.conversationQuestions);
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
            studentLevel: formData.studentLevel
          }),
        });

        const tipsData = await tipsResponse.json();
        if (tipsResponse.ok) {
          setTeacherTips(tipsData.teacherTips);
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-light)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold apple-heading">Test Generator</h1>
              <p className="mt-2 text-white/80">
                Create customized English tests from videos or articles for your business professionals
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex">
              <div className="inline-flex items-center px-4 py-2 border border-white/20 rounded-full text-sm text-white backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--success)] mr-2"></span>
                B2B Language Professional Tool
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Generator Form */}
          <div className="apple-card">
            <TestGeneratorForm onSubmit={handleSubmit} isGenerating={isGenerating} />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-[var(--error)]/10 border-l-4 border-[var(--error)] p-4 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-[var(--error)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-[var(--error)]">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Content */}
          {generatedTest && (
            <div className="apple-card">
              <div className="border-b border-[var(--border)]">
                <div className="px-6 py-5">
                  <h3 className="text-lg font-medium text-[var(--foreground)] apple-heading">Generated Materials</h3>
                  <p className="mt-1 text-sm text-[var(--subtle)]">
                    {testHeader.join(' • ')}
                  </p>
                </div>
                <div className="border-b border-[var(--border)]">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('test')}
                      className={`${
                        activeTab === 'test'
                          ? 'border-[var(--primary)] text-[var(--primary)]'
                          : 'border-transparent text-[var(--subtle)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                      } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setActiveTab('conversation')}
                      className={`${
                        activeTab === 'conversation'
                          ? 'border-[var(--primary)] text-[var(--primary)]'
                          : 'border-transparent text-[var(--subtle)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                      } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${!conversationQuestions ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!conversationQuestions}
                    >
                      Conversation Questions
                    </button>
                    <button
                      onClick={() => setActiveTab('tips')}
                      className={`${
                        activeTab === 'tips'
                          ? 'border-[var(--primary)] text-[var(--primary)]'
                          : 'border-transparent text-[var(--subtle)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                      } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${!teacherTips ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!teacherTips}
                    >
                      Teacher Tips
                    </button>
                  </nav>
                </div>
              </div>
              
              <div className="px-6 py-5">
                {activeTab === 'test' && (
                  <div className="space-y-6">
                    {/* Questions */}
                    <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)]">
                      <h4 className="text-lg font-medium text-[var(--foreground)] mb-4 apple-heading">Test Questions</h4>
                      <div className="prose prose-[var(--primary)] max-w-none" dangerouslySetInnerHTML={{ __html: generatedTest || '' }} />
                    </div>
                    
                    {/* Answers */}
                    {answers && (
                      <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)]">
                        <h4 className="text-lg font-medium text-[var(--foreground)] mb-4 apple-heading">Answer Key</h4>
                        <div className="prose prose-[var(--primary)] max-w-none" dangerouslySetInnerHTML={{ __html: answers }} />
                      </div>
                    )}
                    
                    {/* Export Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end pt-4">
                      <button
                        onClick={() => generatePDF(questions || '', 'test_questions.pdf')}
                        className="apple-button-secondary text-sm"
                      >
                        Export Questions PDF
                      </button>
                      <button
                        onClick={() => generatePDF(answers || '', 'answer_key.pdf')}
                        className="apple-button-secondary text-sm"
                      >
                        Export Answers PDF
                      </button>
                      <button
                        onClick={generateCombinedPDF}
                        className="apple-button text-sm"
                      >
                        Export Combined PDF
                      </button>
                      <button
                        onClick={generateWordDocument}
                        className="apple-button text-sm bg-[var(--secondary)] hover:bg-[var(--secondary-light)]"
                      >
                        Export Word Document
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'conversation' && conversationQuestions && (
                  <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)]">
                    <h4 className="text-lg font-medium text-[var(--foreground)] mb-4 apple-heading">Conversation Questions</h4>
                    <div className="prose prose-[var(--primary)] max-w-none" dangerouslySetInnerHTML={{ __html: conversationQuestions }} />
                    
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => generatePDF(conversationQuestions || '', 'conversation_questions.pdf')}
                        className="apple-button-secondary text-sm"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'tips' && teacherTips && (
                  <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)]">
                    <h4 className="text-lg font-medium text-[var(--foreground)] mb-4 apple-heading">Teacher Tips</h4>
                    <div className="prose prose-[var(--primary)] max-w-none" dangerouslySetInnerHTML={{ __html: teacherTips }} />
                    
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => generatePDF(teacherTips || '', 'teacher_tips.pdf')}
                        className="apple-button-secondary text-sm"
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
    </div>
  );
} 