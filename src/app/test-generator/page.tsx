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
      
      // Use static mock data for now to debug the frontend
      // This guarantees we'll have valid data even if the API calls fail
      const mockQuestions = [
        {
          type: 'multiple-choice',
          question: 'What is the main purpose of the solution described in the video?',
          options: [
            'To write marketing content',
            'To extract emails from Google',
            'To design websites',
            'To create Google accounts'
          ],
          correctAnswer: 1,
          reference: '00:00'
        },
        {
          type: 'multiple-choice',
          question: 'According to the video, which of the following is needed to implement the solution?',
          options: [
            'A marketing degree',
            'A table or Google sheet',
            'A paid subscription',
            'A social media account'
          ],
          correctAnswer: 1,
          reference: '00:40'
        },
        {
          type: 'true-false',
          question: 'The solution described can only be used in one city.',
          correctAnswer: false,
          reference: '01:00'
        },
        {
          type: 'open-ended',
          question: 'What type of information is primarily returned by the solution?',
          reference: '01:13'
        },
        {
          type: 'true-false',
          question: 'The solution uses complex coding techniques.',
          correctAnswer: false,
          reference: '02:00'
        }
      ];
      
      // Generate conversation topics based on the subject
      const conversationTopics = [
        "How do you think technology has changed the way we communicate through emails?",
        "Do you prefer receiving automated emails or personalized messages? Why?",
        "Have you ever had an interesting experience with automated email responses?",
        "What are some advantages and disadvantages of using automated tools for email extraction?",
        "How do you feel about the increasing automation of tasks in our daily lives?"
      ];
      
      // Generate teaching tips based on the subject
      const teachingTips = [
        {
          category: "Vocabulary",
          content: "1. Extract (verb) - Definition: To take or pull out something - Example sentence: The software can extract important information from emails. 2. Automated (adjective) - Definition: Operating by machines or technology, not requiring human intervention - Example sentence: Automated systems can save time and effort in processing emails. 3. Email (noun) - Definition: Messages distributed electronically - Example sentence: I received an important email from my boss yesterday. 4. Test (noun) - Definition: A procedure intended to establish the quality, performance, or reliability of something - Example sentence: We have a grammar test next week."
        },
        {
          category: "Grammar",
          content: "1. Present Simple Tense - Explanation: Used to describe routine actions or facts - Example sentence: The software automatically extracts emails from Google every morning."
        },
        {
          category: "Pronunciation",
          content: "The pronunciation of \"automated\" can be challenging for Brazilian students, especially the stress on the second syllable (-mo-ted). Encourage students to practice saying the word slowly, focusing on each syllable, and gradually increasing speed."
        }
      ];
      
      // Update all generated content at once
      setGeneratedContent({
        testTitle: `${data.questionTypes.join(', ')} Test for ${data.studentLevel} Level`,
        testContent: `Test about Automated Email Extraction from Google for English Test.`,
        studentName: data.studentName || 'Student Name',
        teacherName: data.professorName || 'Teacher Name',
        testDate: new Date().toLocaleDateString(),
        subject: "Automated Email Extraction from Google for English Test.",
        questions: mockQuestions,
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
      // Create a plain text version for Word export
      const textContent = `
${generatedContent.testTitle}

Student: ${generatedContent.studentName}
Teacher: ${generatedContent.teacherName}
Subject: ${generatedContent.subject}
Date: ${generatedContent.testDate}

${generatedContent.testContent}

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

      // Create a Blob with the content
      const blob = new Blob([textContent], { type: 'text/plain' });
      
      // Create download link and trigger click
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${generatedContent.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_test.txt`;
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
      // Create a plain text version for PDF export
      const textContent = `
${generatedContent.subject} - Teaching Materials

Teacher: ${generatedContent.teacherName}
Level: ${generatedContent.testTitle.split(' for ')[1] || 'Not specified'}
Date: ${generatedContent.testDate}

CONVERSATION TOPICS:
${generatedContent.conversationTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

TEACHING TIPS:
${generatedContent.teachingTips.map(tip => `${tip.category}:\n${tip.content}`).join('\n\n')}
`;

      // Create a Blob with the content
      const blob = new Blob([textContent], { type: 'text/plain' });
      
      // Create download link and trigger click
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${generatedContent.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_teaching_materials.txt`;
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