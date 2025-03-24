'use client';

import { useState } from 'react';
import DashboardShell from '../../components/ui/dashboard-shell';
import TestGeneratorForm from '@/app/components/TestGeneratorForm';
import TestTemplate from './TestTemplate';
import { TestFormData } from '@/app/lib/types';
import { 
  DocumentTextIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  PrinterIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

export default function TestGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testGenerated, setTestGenerated] = useState(false);
  const [currentTab, setCurrentTab] = useState<'test' | 'conversation' | 'teacher-tips'>('test');

  // Single state for all generated content
  const [generatedContent, setGeneratedContent] = useState<{
    // Test data
    testTitle: string;
    testContent: string;
    studentName: string;
    teacherName: string;
    testDate: string;
    subject: string;
    questions: any[];
    // Conversation topics
    conversationTopics: string[];
    // Teaching tips
    teachingTips: any[];
  }>({
    testTitle: '',
    testContent: '',
    studentName: '',
    teacherName: '',
    testDate: new Date().toLocaleDateString(),
    subject: '',
    questions: [],
    conversationTopics: [],
    teachingTips: []
  });

  // This function handles the form submission and generates all content
  const handleSubmit = async (data: TestFormData) => {
    try {
      setIsGenerating(true);
      
      // Make the API call to generate the test based on the URL
      const response = await fetch('/api/test-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Handle non-JSON responses properly
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`API returned non-JSON response: ${text.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate test');
      }
      
      const testData = await response.json();
      
      // In case no test data was returned
      if (!testData || !testData.questions) {
        throw new Error('No test content was generated. Please try again or use a different URL.');
      }
      
      // Extract questions from the generated test
      const parsedQuestions = parseQuestions(testData.questions);
      
      // Get conversation topics
      let conversationTopics = [];
      try {
        const conversationResponse = await fetch('/api/test-generator/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: testData.subject,
            contentUrl: data.contentUrl,
            studentLevel: data.studentLevel
          })
        });
        
        if (conversationResponse.ok) {
          const conversationData = await conversationResponse.json();
          if (conversationData && conversationData.conversationQuestions) {
            // Split the conversation questions into an array
            conversationTopics = conversationData.conversationQuestions
              .split(/\d+\.\s+/)
              .filter((q: string) => q.trim().length > 0);
          }
        }
      } catch (error) {
        console.error('Error fetching conversation topics:', error);
        // Fallback conversation topics
        conversationTopics = [
          "What are your thoughts on the main subject discussed in the content?",
          "Can you relate to any part of this content from your professional experience?",
          "What challenges might someone face when implementing these ideas?",
          "How might these concepts be applied in different industries?",
          "What skills would be necessary to succeed in this area?"
        ];
      }
      
      // Get teaching tips
      let teachingTips = [];
      try {
        const tipsResponse = await fetch('/api/test-generator/teacher-tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: testData.subject,
            contentUrl: data.contentUrl,
            studentLevel: data.studentLevel
          })
        });
        
        if (tipsResponse.ok) {
          const tipsData = await tipsResponse.json();
          if (tipsData && tipsData.teacherTips) {
            // Parse the teaching tips
            const tipsSections = tipsData.teacherTips.split(/\n\s*\n/);
            teachingTips = tipsSections.map((section: string) => {
              const lines = section.split('\n');
              if (lines.length > 0) {
                const category = lines[0].replace(':', '').trim();
                const content = lines.slice(1).join('\n').trim();
                
                return {
                  category,
                  content
                };
              }
              return null;
            }).filter(Boolean);
          }
        }
      } catch (error) {
        console.error('Error fetching teaching tips:', error);
        // Fallback teaching tips
        teachingTips = [
          {
            category: "Vocabulary",
            content: "Identify key terminology from the content and create a pre-teaching vocabulary list. Consider creating flashcards or a matching exercise to help students learn these terms before discussing the content."
          },
          {
            category: "Grammar Focus",
            content: "Use examples from the content to highlight relevant grammar structures. For business content, pay attention to modal verbs, conditionals, and passive voice which are commonly used."
          },
          {
            category: "Discussion Technique",
            content: "Use a think-pair-share technique to encourage full participation. Give students time to think individually about the questions, discuss with a partner, then share with the larger group."
          }
        ];
      }
      
      // Update all generated content at once
      setGeneratedContent({
        testTitle: `English Proficiency Test`,
        testContent: `Test about ${testData.subject}`,
        studentName: data.studentName || '',
        teacherName: data.professorName || '',
        testDate: new Date().toLocaleDateString(),
        subject: testData.subject,
        questions: parsedQuestions,
        conversationTopics: conversationTopics,
        teachingTips: teachingTips
      });
      
      setTestGenerated(true);
    } catch (error) {
      console.error('Error generating content:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate content'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to parse questions from generated test
  const parseQuestions = (testContent: string) => {
    const questions = [];
    const lines = testContent.split('\n');
    let currentQuestion: any = null;
    let optionIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and headers
      if (!line || line.startsWith('Professor:') || line.startsWith('Student:') || 
          line.startsWith('Test about') || line.startsWith('Date:') || 
          line === 'Questions:') {
        continue;
      }
      
      // New question
      if (/^\d+\)/.test(line)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        const questionText = line.replace(/^\d+\)\s*/, '');
        let type = 'open-ended';
        let reference = '';
        
        // Check for reference timestamp
        const refMatch = questionText.match(/\[Ref:\s*(\d+:\d+)\]/);
        if (refMatch) {
          reference = refMatch[1];
        }
        
        // Determine question type based on what follows
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('A)')) {
          type = 'multiple-choice';
        } else if (questionText.toLowerCase().includes('true or false') || 
                  (i + 1 < lines.length && 
                  (lines[i + 1].trim().toLowerCase().includes('true') || 
                   lines[i + 1].trim().toLowerCase().includes('false')))) {
          type = 'true-false';
        }
        
        currentQuestion = {
          type,
          question: questionText.replace(/\[Ref:\s*(\d+:\d+)\]/, '').trim(),
          options: type === 'multiple-choice' ? [] : undefined,
          reference
        };
        
        if (type === 'multiple-choice') {
          optionIndex = 0;
        }
      }
      // Option for multiple choice
      else if (currentQuestion && currentQuestion.type === 'multiple-choice' && /^[A-D]\)/.test(line)) {
        const option = line.replace(/^[A-D]\)\s*/, '');
        currentQuestion.options.push(option);
        optionIndex++;
      }
    }
    
    // Add the last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToWord = () => {
    try {
      // Create the content for Word export
      const docContent = `
${generatedContent.subject}

Student: ${generatedContent.studentName}
Teacher: ${generatedContent.teacherName}
Date: ${generatedContent.testDate}
Grade: _______________

Questions:
${generatedContent.questions.map((q, idx) => {
  let questionText = `${idx + 1}) ${q.question}${q.reference ? ` [Ref: ${q.reference}]` : ''}`;
  
  if (q.type === 'multiple-choice' && q.options) {
    const options = q.options.map((option: string, optIdx: number) => 
      `   ${String.fromCharCode(65 + optIdx)}) ${option}`
    ).join('\n');
    return `${questionText}\n${options}`;
  }
  
  return questionText;
}).join('\n\n')}
`;

      // Create a Blob with Word document content type
      const blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Create download link and trigger click
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${generatedContent.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_test.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('There was an error exporting the test. Please try again.');
    }
  };

  const handleExportTeachingMaterials = () => {
    try {
      // Create the content for PDF export
      const pdfContent = `
${generatedContent.subject} - Teaching Materials

Teacher: ${generatedContent.teacherName}
Level: ${generatedContent.testTitle.split(' for ')[1] || 'Not specified'}
Date: ${generatedContent.testDate}

CONVERSATION TOPICS:
${generatedContent.conversationTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

TEACHING TIPS:
${generatedContent.teachingTips.map(tip => `${tip.category}:\n${tip.content}`).join('\n\n')}
`;

      // Create a Blob with PDF content type
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      
      // Create download link and trigger click
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${generatedContent.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_teaching_materials.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting teaching materials:', error);
      alert('There was an error exporting the teaching materials. Please try again.');
    }
  };

  // Render test content
  const renderTestContent = () => {
    return (
      <div>
        {testGenerated ? (
          <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none">
            <div className="flex justify-between mb-4 print:hidden">
              <div>
                <button
                  onClick={() => setTestGenerated(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create New Test
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportToWord}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B0000] hover:bg-[#A52A2A]"
                >
                  <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5" />
                  Export Questions (Word)
                </button>
                <button
                  onClick={handleExportTeachingMaterials}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B0000] hover:bg-[#A52A2A]"
                >
                  <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5" />
                  Export Teaching Materials (PDF)
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D]"
                >
                  <PrinterIcon className="-ml-1 mr-2 h-5 w-5" />
                  Print Test
                </button>
              </div>
            </div>
            
            <TestTemplate
              title={generatedContent.testTitle}
              studentName={generatedContent.studentName}
              teacherName={generatedContent.teacherName}
              date={generatedContent.testDate}
              subject={generatedContent.subject}
              content={
                <div className="space-y-6">
                  <p className="text-gray-800">{generatedContent.testContent}</p>
                  
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900">Questions:</h2>
                    
                    <div className="mt-4 space-y-6">
                      {generatedContent.questions.map((q, idx) => {
                        if (q.type === 'multiple-choice') {
                          return (
                            <div key={idx} className="space-y-2">
                              <p className="font-medium">{idx + 1}) {q.question}</p>
                              <div className="pl-6 space-y-1">
                                {q.options.map((option: string, optIdx: number) => (
                                  <p key={optIdx}>{String.fromCharCode(65 + optIdx)}) {option}</p>
                                ))}
                              </div>
                              {q.reference && <p className="text-sm text-gray-500">[Ref: {q.reference}]</p>}
                            </div>
                          );
                        } else if (q.type === 'true-false') {
                          return (
                            <div key={idx} className="space-y-2">
                              <p className="font-medium">{idx + 1}) {q.question}</p>
                              {q.reference && <p className="text-sm text-gray-500">[Ref: {q.reference}]</p>}
                            </div>
                          );
                        } else if (q.type === 'open-ended') {
                          return (
                            <div key={idx} className="space-y-2">
                              <p className="font-medium">{idx + 1}) {q.question} (short answer)</p>
                              {q.reference && <p className="text-sm text-gray-500">[Ref: {q.reference}]</p>}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        ) : (
          <TestGeneratorForm onSubmit={handleSubmit} isGenerating={isGenerating} />
        )}
      </div>
    );
  };

  // Render conversation topics content
  const renderConversationContent = () => {
    if (!testGenerated) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-700 mb-4">
              Please generate a test first to see conversation topics related to the content.
            </p>
            <button
              onClick={() => setCurrentTab('test')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D]"
            >
              Go to Test Generator
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Conversation Questions</h2>
        
        <div className="space-y-4">
          {generatedContent.conversationTopics.map((topic, index) => (
            <p key={index} className="text-gray-800">
              {index + 1}. {topic}
            </p>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            These conversation questions are included in the "Export Teaching Materials" PDF available in the Test tab.
          </p>
        </div>
      </div>
    );
  };

  // Render teaching tips content
  const renderTeachingTipsContent = () => {
    if (!testGenerated) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-700 mb-4">
              Please generate a test first to see teaching tips related to the content.
            </p>
            <button
              onClick={() => setCurrentTab('test')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D]"
            >
              Go to Test Generator
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Teacher Tips</h2>
        
        <div className="space-y-6">
          {generatedContent.teachingTips.map((tip, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{tip.category}</h3>
              <p className="text-gray-800 whitespace-pre-line">{tip.content}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            These teacher tips are included in the "Export Teaching Materials" PDF available in the Test tab.
          </p>
        </div>
      </div>
    );
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Test & Class Generator</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create custom tests, conversation topics, and teaching tips based on business content
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setCurrentTab('test')}
            className={`${
              currentTab === 'test'
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <DocumentTextIcon className="mr-2 h-5 w-5" />
            Test
          </button>
          
          <button
            onClick={() => setCurrentTab('conversation')}
            className={`${
              currentTab === 'conversation'
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" />
            Conversation Questions
          </button>
          
          <button
            onClick={() => setCurrentTab('teacher-tips')}
            className={`${
              currentTab === 'teacher-tips'
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <LightBulbIcon className="mr-2 h-5 w-5" />
            Teacher Tips
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {currentTab === 'test' && renderTestContent()}
        {currentTab === 'conversation' && renderConversationContent()}
        {currentTab === 'teacher-tips' && renderTeachingTipsContent()}
      </div>
    </DashboardShell>
  );
} 