'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/ui/dashboard-shell';
import TestGeneratorForm from '@/app/components/TestGeneratorForm';
import TestTemplate from './TestTemplate';
import { TestFormData } from '@/app/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import RoleBasedRoute from '@/app/components/RoleBasedRoute';
import { db } from '../../lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  DocumentTextIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

// Interface for the last class diary entry
interface LastClassDiaryEntry {
  id: string;
  studentName: string;
  studentId: string;
  teacherName: string;
  teacherId: string;
  testDate: string;
  testGrade: string;
  gradeByTeacher: string;
  forNextClass: string;
  notes: string;
  uploadDate: string;
  timestamp: number;
}

export default function TestGeneratorPage() {
  const { user, userProfile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [testGenerated, setTestGenerated] = useState(false);
  const [currentTab, setCurrentTab] = useState<'test' | 'conversation' | 'teacher-tips' | 'last-class-diary'>('test');
  const [docxScript, setDocxScript] = useState<boolean>(false);
  const [pdfScript, setPdfScript] = useState<boolean>(false);
  const [currentTeacher, setCurrentTeacher] = useState<{id: string; displayName: string} | null>(null);
  const [lastClassDiary, setLastClassDiary] = useState<LastClassDiaryEntry | null>(null);
  const [isLoadingDiary, setIsLoadingDiary] = useState(false);

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
    // Add URL to the generatedContent state
    contentUrl: string;
  }>({
    testTitle: '',
    testContent: '',
    studentName: '',
    teacherName: '',
    testDate: new Date().toLocaleDateString(),
    subject: '',
    questions: [],
    conversationTopics: [],
    teachingTips: [],
    contentUrl: ''
  });

  // Fetch current teacher from database
  useEffect(() => {
    const fetchCurrentTeacher = async () => {
      if (user?.email) {
        try {
          // Query for the current user by email
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          );
          
          const querySnapshot = await getDocs(usersQuery);
          
          if (!querySnapshot.empty) {
            // Get the first matching document
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            setCurrentTeacher({
              id: userDoc.id,
              displayName: userData.displayName || user.displayName || user.email
            });
            
            // Update teacher name in generated content
            setGeneratedContent(prev => ({
              ...prev,
              teacherName: userData.displayName || user.displayName || user.email
            }));
            
            console.log("Set current teacher to:", userData.displayName || user.displayName);
          }
        } catch (error) {
          console.error('Error fetching teacher:', error);
        }
      }
    };
    
    fetchCurrentTeacher();
  }, [user]);

  // Load document generation libraries
  useEffect(() => {
    // Load docx.js script
    if (!docxScript) {
      const docxScriptTag = document.createElement('script');
      docxScriptTag.src = 'https://unpkg.com/docx@7.8.2/build/index.js';
      docxScriptTag.async = true;
      docxScriptTag.onload = () => setDocxScript(true);
      document.body.appendChild(docxScriptTag);
    }
    
    // Load jspdf script
    if (!pdfScript) {
      const pdfScriptTag = document.createElement('script');
      pdfScriptTag.src = 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';
      pdfScriptTag.async = true;
      pdfScriptTag.onload = () => setPdfScript(true);
      document.body.appendChild(pdfScriptTag);
    }
  }, [docxScript, pdfScript]);

  // This function fetches the most recent class diary entry for the current teacher and student
  const fetchLastClassDiary = async (teacherId: string, studentId: string) => {
    if (!teacherId || !studentId) return;
    
    try {
      setIsLoadingDiary(true);
      
      // Get all test results
      const testResultsCollection = collection(db, 'testResults');
      
      // Query for the most recent test result matching the teacher and student
      const q = query(
        testResultsCollection,
        where('teacherId', '==', teacherId),
        where('studentId', '==', studentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No previous test results found for this teacher-student combination');
        setLastClassDiary(null);
        return;
      }
      
      // Find the most recent one by timestamp
      let mostRecentResult: LastClassDiaryEntry | null = null;
      let mostRecentTimestamp = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp || 0;
        
        if (timestamp > mostRecentTimestamp) {
          mostRecentTimestamp = timestamp;
          mostRecentResult = {
            id: doc.id,
            studentName: data.studentName || '',
            studentId: data.studentId || '',
            teacherName: data.teacherName || '',
            teacherId: data.teacherId || '',
            testDate: data.testDate || '',
            testGrade: data.testGrade || '',
            gradeByTeacher: data.gradeByTeacher || '',
            forNextClass: data.forNextClass || '',
            notes: data.notes || '',
            uploadDate: data.uploadDate || '',
            timestamp: data.timestamp || 0,
          };
        }
      });
      
      setLastClassDiary(mostRecentResult);
      console.log('Found most recent class diary:', mostRecentResult);
    } catch (error) {
      console.error('Error fetching last class diary:', error);
      setLastClassDiary(null);
    } finally {
      setIsLoadingDiary(false);
    }
  };

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
        body: JSON.stringify({
          ...data,
          // Ensure these parameters are explicitly passed
          studentLevel: data.studentLevel,
          questionTypes: data.questionTypes,
          questionCount: data.numberOfQuestions
        })
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
      
      console.log('API response data:', testData);
      
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
        testTitle: `${data.questionTypes.join(', ')} Test for ${data.studentLevel} Level`,
        testContent: `Test about ${testData.subject}`,
        studentName: data.studentName || '',
        teacherName: data.professorName || '',
        testDate: new Date().toLocaleDateString(),
        subject: testData.subject,
        questions: parsedQuestions,
        conversationTopics: conversationTopics,
        teachingTips: teachingTips,
        contentUrl: data.contentUrl
      });
      
      // Fetch last class diary if we have both teacher and student IDs
      if (data.professorId && data.studentId) {
        await fetchLastClassDiary(data.professorId, data.studentId);
      }
      
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
      if (!docxScript) {
        alert('Document generator is still loading. Please try again in a moment.');
        return;
      }
      
      // Access the docx library through the window
      const docx = (window as any).docx;
      
      // Create paragraphs for the document
      const documentParagraphs = [
        // Header information
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Student: ${generatedContent.studentName}`,
              size: 24,
            }),
          ],
        }),
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Teacher: ${generatedContent.teacherName}`,
              size: 24,
            }),
          ],
        }),
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Subject: ${generatedContent.subject}`,
              size: 24,
            }),
          ],
        }),
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Date: ${generatedContent.testDate}`,
              size: 24,
            }),
          ],
        }),
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Grade: _______________`,
              size: 24,
            }),
          ],
        }),
        // Spacer
        new docx.Paragraph({
          children: [new docx.TextRun({ text: " ", size: 24 })],
        }),
        // Test content
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: generatedContent.testContent,
              size: 24,
            }),
          ],
        }),
        // Spacer
        new docx.Paragraph({
          children: [new docx.TextRun({ text: " ", size: 24 })],
        }),
        // Questions header
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: "Questions:",
              size: 24,
              bold: true,
            }),
          ],
        }),
      ];
      
      // Add all questions to the documentParagraphs array
      generatedContent.questions.forEach((q, idx) => {
        // Add the question text
        documentParagraphs.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `${idx + 1}) ${q.question}${q.reference ? ` [Ref: ${q.reference}]` : ''}`,
                size: 24,
              }),
            ],
          })
        );
        
        // Add options for multiple choice questions
        if (q.type === 'multiple-choice' && q.options) {
          q.options.forEach((option: string, optIdx: number) => {
            documentParagraphs.push(
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `   ${String.fromCharCode(65 + optIdx)}) ${option}`,
                    size: 24,
                  }),
                ],
              })
            );
          });
        }
        
        // Add a spacing paragraph after each question
        documentParagraphs.push(
          new docx.Paragraph({
            children: [new docx.TextRun({ text: " ", size: 24 })],
          })
        );
      });
      
      // Add URL reference at the bottom if available
      if (generatedContent.contentUrl) {
        documentParagraphs.push(
          new docx.Paragraph({
            children: [new docx.TextRun({ text: "\n", size: 24 })],
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `Reference: ${generatedContent.contentUrl}`,
                size: 20,
                italics: true,
                color: "888888"
              }),
            ],
          })
        );
      }
      
      // Create a new document with all paragraphs
      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: documentParagraphs
        }],
      });

      // Generate and download the document
      docx.Packer.toBlob(doc).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const formattedDate = generatedContent.testDate.replace(/\//g, '-');
        const fileName = `${generatedContent.studentName.replace(/\s+/g, '_').toLowerCase()}_${formattedDate}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.docx`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('There was an error exporting to Word. Falling back to text file.');
      
      // Fallback to plain text if document generation fails
      const docContent = `
Student: ${generatedContent.studentName}
Teacher: ${generatedContent.teacherName}
Subject: ${generatedContent.subject}
Date: ${generatedContent.testDate}
Grade: _______________

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

      const element = document.createElement('a');
      const file = new Blob([docContent], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
      element.href = URL.createObjectURL(file);
      
      const formattedDate = generatedContent.testDate.replace(/\//g, '-');
      const fileName = `${generatedContent.studentName.replace(/\s+/g, '_').toLowerCase()}_${formattedDate}`;
      element.download = `${fileName}.docx`;
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleExportTeachingMaterials = () => {
    try {
      if (!pdfScript) {
        alert('PDF generator is still loading. Please try again in a moment.');
        return;
      }
      
      // Create PDF content with student name included and add Last Class Diary content
      const pdfContent = `
${generatedContent.subject} - Teaching Materials

Student: ${generatedContent.studentName}
Teacher: ${generatedContent.teacherName}
Date: ${generatedContent.testDate}
${generatedContent.contentUrl ? `Reference: ${generatedContent.contentUrl}` : ''}

===================== TEST ANSWERS =====================

${generatedContent.questions.map((q, idx) => {
  if (q.type === 'multiple-choice' && q.options) {
    return `${idx + 1}) Answer: ${String.fromCharCode(65 + (q.correctAnswer !== undefined ? q.correctAnswer : 0))}`;
  } else if (q.type === 'true-false') {
    return `${idx + 1}) Answer: ${q.correctAnswer !== undefined ? (q.correctAnswer ? 'True' : 'False') : 'True'}`;
  } else {
    return `${idx + 1}) Sample answer: This is an open-ended question about ${q.question.substring(0, 30)}...`;
  }
}).join('\n')}

===================== CONVERSATION TOPICS =====================

${generatedContent.conversationTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

===================== TEACHING TIPS =====================

${generatedContent.teachingTips.length > 0 ? 
  generatedContent.teachingTips.map(tip => `${tip.category}:\n${tip.content}`).join('\n\n') : 
  `Vocabulary:
1. Extract (verb) - to remove or take out something from a source - "The software can extract data from websites."
2. Automation (noun) - the use of technology to perform tasks with minimal human intervention - "Email automation saves time."
3. Process (noun) - a series of actions taken to achieve a particular result - "The email extraction process is simple."
4. Generate (verb) - to produce or create - "This tool generates leads from Google searches."
5. Implement (verb) - to put a plan or system into action - "Many businesses implement email marketing strategies."

Grammar:
Present Simple Tense for describing processes - Use present simple to describe how technology works or processes function. Example: "The tool extracts emails automatically" not "The tool is extracting emails automatically."

Pronunciation:
Focus on word stress in technology terminology. In 'automation' (au-to-MA-tion), the stress falls on the third syllable. Have students practice by clapping on the stressed syllable while saying tech-related words.`
}

===================== LAST CLASS DIARY =====================

${lastClassDiary ? 
  `Test Date: ${lastClassDiary.testDate}
Upload Date: ${lastClassDiary.uploadDate}
Test Grade: ${lastClassDiary.testGrade || 'Not provided'}
Grade by Teacher: ${lastClassDiary.gradeByTeacher || 'Not provided'}

For Next Class:
${lastClassDiary.forNextClass || 'No recommendations provided'}

Teacher Notes:
${lastClassDiary.notes || 'No notes provided'}`
  : 'No previous class diary entries found for this teacher and student combination.'}
`;

      // Access the jsPDF library through the window
      const jsPDF = (window as any).jspdf.jsPDF;
      
      // Create a new PDF document with smaller margins to fit more content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Use smaller font size and margins for more content
      pdf.setFontSize(10);
      
      // Add content to the PDF with smaller margins
      const splitText = pdf.splitTextToSize(pdfContent, 190); // Wider text area
      pdf.text(splitText, 10, 10); // Smaller margins
      
      // Generate and download the PDF
      const formattedDate = generatedContent.testDate.replace(/\//g, '-');
      const fileName = `${generatedContent.studentName.replace(/\s+/g, '_').toLowerCase()}_${formattedDate}_materials`;
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('There was an error exporting to PDF. Falling back to text file.');
      
      // Fallback to plain text if PDF generation fails
      const pdfContent = `
${generatedContent.subject} - Teaching Materials

Student: ${generatedContent.studentName}
Teacher: ${generatedContent.teacherName}
Date: ${generatedContent.testDate}

===================== TEST ANSWERS =====================

${generatedContent.questions.map((q, idx) => {
  if (q.type === 'multiple-choice' && q.options) {
    return `${idx + 1}) Answer: ${String.fromCharCode(65 + (q.correctAnswer !== undefined ? q.correctAnswer : 0))}`;
  } else if (q.type === 'true-false') {
    return `${idx + 1}) Answer: ${q.correctAnswer !== undefined ? (q.correctAnswer ? 'True' : 'False') : 'True'}`;
  } else {
    return `${idx + 1}) Sample answer: This is an open-ended question about ${q.question.substring(0, 30)}...`;
  }
}).join('\n')}

===================== CONVERSATION TOPICS =====================

${generatedContent.conversationTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

===================== TEACHING TIPS =====================

${generatedContent.teachingTips.map(tip => `${tip.category}:\n${tip.content}`).join('\n\n')}

===================== LAST CLASS DIARY =====================

${lastClassDiary ? 
  `Test Date: ${lastClassDiary.testDate}
Upload Date: ${lastClassDiary.uploadDate}
Test Grade: ${lastClassDiary.testGrade || 'Not provided'}
Grade by Teacher: ${lastClassDiary.gradeByTeacher || 'Not provided'}

For Next Class:
${lastClassDiary.forNextClass || 'No recommendations provided'}

Teacher Notes:
${lastClassDiary.notes || 'No notes provided'}`
  : 'No previous class diary entries found for this teacher and student combination.'}
`;

      const element = document.createElement('a');
      const file = new Blob([pdfContent], {type: 'application/pdf'});
      element.href = URL.createObjectURL(file);
      
      const formattedDate = generatedContent.testDate.replace(/\//g, '-');
      const fileName = `${generatedContent.studentName.replace(/\s+/g, '_').toLowerCase()}_${formattedDate}_materials`;
      element.download = `${fileName}.pdf`;
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Update the full PDF export to include URL reference and improved teaching tips
  const handleExportFullPDF = () => {
    try {
      if (!pdfScript) {
        alert('PDF generator is still loading. Please try again in a moment.');
        return;
      }
      
      // Create PDF content with both test questions and materials
      const pdfContent = `
${generatedContent.subject}

Student: ${generatedContent.studentName}
Teacher: ${generatedContent.teacherName}
Date: ${generatedContent.testDate}
${generatedContent.contentUrl ? `Reference: ${generatedContent.contentUrl}` : ''}

===================== TEST QUESTIONS =====================

${generatedContent.testContent}

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

===================== TEST ANSWERS =====================

${generatedContent.questions.map((q, idx) => {
  if (q.type === 'multiple-choice' && q.options) {
    return `${idx + 1}) Answer: ${String.fromCharCode(65 + (q.correctAnswer !== undefined ? q.correctAnswer : 0))}`;
  } else if (q.type === 'true-false') {
    return `${idx + 1}) Answer: ${q.correctAnswer !== undefined ? (q.correctAnswer ? 'True' : 'False') : 'True'}`;
  } else {
    return `${idx + 1}) Sample answer: This is an open-ended question about ${q.question.substring(0, 30)}...`;
  }
}).join('\n')}

===================== CONVERSATION TOPICS =====================

${generatedContent.conversationTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

===================== TEACHING TIPS =====================

${generatedContent.teachingTips.length > 0 ? 
  generatedContent.teachingTips.map(tip => `${tip.category}:\n${tip.content}`).join('\n\n') : 
  `Vocabulary:
1. Extract (verb) - to remove or take out something from a source - "The software can extract data from websites."
2. Automation (noun) - the use of technology to perform tasks with minimal human intervention - "Email automation saves time."
3. Process (noun) - a series of actions taken to achieve a particular result - "The email extraction process is simple."
4. Generate (verb) - to produce or create - "This tool generates leads from Google searches."
5. Implement (verb) - to put a plan or system into action - "Many businesses implement email marketing strategies."

Grammar:
Present Simple Tense for describing processes - Use present simple to describe how technology works or processes function. Example: "The tool extracts emails automatically" not "The tool is extracting emails automatically."

Pronunciation:
Focus on word stress in technology terminology. In 'automation' (au-to-MA-tion), the stress falls on the third syllable. Have students practice by clapping on the stressed syllable while saying tech-related words.`
}

===================== LAST CLASS DIARY =====================

${lastClassDiary ? 
  `Test Date: ${lastClassDiary.testDate}
Upload Date: ${lastClassDiary.uploadDate}
Test Grade: ${lastClassDiary.testGrade || 'Not provided'}
Grade by Teacher: ${lastClassDiary.gradeByTeacher || 'Not provided'}

For Next Class:
${lastClassDiary.forNextClass || 'No recommendations provided'}

Teacher Notes:
${lastClassDiary.notes || 'No notes provided'}`
  : 'No previous class diary entries found for this teacher and student combination.'}
`;

      // Access the jsPDF library through the window
      const jsPDF = (window as any).jspdf.jsPDF;
      
      // Create a new PDF document with smaller margins for more content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Use smaller font size for more content
      pdf.setFontSize(10);
      
      // Add content to the PDF with smaller margins
      const splitText = pdf.splitTextToSize(pdfContent, 190); // Wider text area
      pdf.text(splitText, 10, 10); // Smaller margins
      
      // Generate and download the PDF
      const formattedDate = generatedContent.testDate.replace(/\//g, '-');
      const fileName = `${generatedContent.studentName.replace(/\s+/g, '_').toLowerCase()}_${formattedDate}_full`;
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating full PDF:', error);
      alert('There was an error exporting to PDF. Please try the separate exports instead.');
    }
  };

  // Render test content
  const renderTestContent = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {!testGenerated ? (
          <TestGeneratorForm 
            onSubmit={handleSubmit} 
            isGenerating={isGenerating} 
            defaultTeacherName={currentTeacher?.displayName || user?.displayName || ''}
            currentTeacher={currentTeacher}
          />
        ) : (
          <div className="p-6">
            {/* Tabs for Test and Export */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Generated Test</h2>
              <div className="flex space-x-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                >
                  <PrinterIcon className="mr-1.5 h-4 w-4 text-gray-500" />
                  Print
                </button>
                <button
                  onClick={handleExportToWord}
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                >
                  <DocumentDuplicateIcon className="mr-1.5 h-4 w-4 text-gray-500" />
                  Export to Word
                </button>
                <button
                  onClick={handleExportTeachingMaterials}
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                >
                  <DocumentDuplicateIcon className="mr-1.5 h-4 w-4 text-gray-500" />
                  Teacher Materials PDF
                </button>
              </div>
            </div>
            
            {/* Test content */}
            <div className="border-t pt-6">
              <TestTemplate 
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
          </div>
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
            <h2 className="text-xl font-bold mb-4">Conversation Questions</h2>
            <p className="text-gray-700 mb-4">
              Generate conversation topics based on business content for your English lessons.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Create a test first to generate conversation topics based on the content.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentTab('test')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D]"
              >
                Go to Test Generator
              </button>
            </div>
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
            <h2 className="text-xl font-bold mb-4">Teacher Tips</h2>
            <p className="text-gray-700 mb-4">
              Get customized teaching tips based on the content for more effective English lessons.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Create a test first to generate teaching tips based on the business content.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentTab('test')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D]"
              >
                Go to Test Generator
              </button>
            </div>
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

  // Render last class diary content
  const renderLastClassDiaryContent = () => {
    if (!testGenerated) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-4">Last Class Diary</h2>
            <p className="text-gray-700 mb-4">
              View information from the last class with the selected student to help with continuity.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Select a teacher and student in the Test tab and generate a test to see their last class diary entry.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentTab('test')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8B4513] hover:bg-[#A0522D]"
              >
                Go to Test Generator
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isLoadingDiary) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8B4513]"></div>
            <span className="ml-3 text-gray-700">Loading last class information...</span>
          </div>
        </div>
      );
    }

    if (!lastClassDiary) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-700 mb-4">
              No previous class diary entries found for this teacher and student combination.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Last Class Diary</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Test Date</h3>
              <p className="mt-1 text-base font-medium text-gray-900">{lastClassDiary.testDate}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Upload Date</h3>
              <p className="mt-1 text-base font-medium text-gray-900">{lastClassDiary.uploadDate}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Test Grade</h3>
              <p className="mt-1 text-base font-medium text-gray-900">{lastClassDiary.testGrade || 'Not provided'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Grade by Teacher</h3>
              <p className="mt-1 text-base font-medium text-gray-900">{lastClassDiary.gradeByTeacher || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">For Next Class</h3>
            <p className="mt-1 text-base text-gray-900">{lastClassDiary.forNextClass || 'No recommendations provided'}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Teacher Notes</h3>
            <p className="mt-1 text-base text-gray-900">{lastClassDiary.notes || 'No notes provided'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <RoleBasedRoute 
      requiredRoles={['Teacher', 'Manager', 'Owner']}
      key="test-generator-route"
    >
      <DashboardShell>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Test & Class Generator</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create custom tests, conversation topics, and teaching tips based on business content
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
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
              
              <button
                onClick={() => setCurrentTab('last-class-diary')}
                className={`${
                  currentTab === 'last-class-diary'
                    ? 'border-[#8B4513] text-[#8B4513]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ClipboardDocumentIcon className="mr-2 h-5 w-5" />
                Last Class Diary
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div>
            {currentTab === 'test' && renderTestContent()}
            {currentTab === 'conversation' && renderConversationContent()}
            {currentTab === 'teacher-tips' && renderTeachingTipsContent()}
            {currentTab === 'last-class-diary' && renderLastClassDiaryContent()}
          </div>
        </div>
      </DashboardShell>
    </RoleBasedRoute>
  );
} 