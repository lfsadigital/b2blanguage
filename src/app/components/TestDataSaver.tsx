import { useEffect } from 'react';

interface TestDataSaverProps {
  testResult: any;
  formData: {
    contentUrl?: string;
    studentLevel?: string;
    studentId?: string;
    professorId?: string;
    numberOfQuestions?: number;
  };
  transcriptSource?: string;
}

export default function TestDataSaver({ testResult, formData, transcriptSource }: TestDataSaverProps) {
  useEffect(() => {
    const saveTestToFirebase = async () => {
      if (!testResult || !testResult.questions) return;
      
      try {
        console.log('Attempting to save test data to Firebase from TestDataSaver...');
        const response = await fetch('/api/data-logger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: formData.contentUrl || 'unknown',
            subject: testResult.subject || 'Unknown Subject',
            testQuestions: testResult.questions,
            studentLevel: formData.studentLevel || 'unknown',
            studentId: formData.studentId || 'unknown',
            teacherId: formData.professorId || 'unknown',
            questionCount: formData.numberOfQuestions || 0,
            isVideo: formData.contentUrl?.includes('youtube.com') || formData.contentUrl?.includes('youtu.be'),
            transcriptSource: transcriptSource || testResult.transcriptSource || 'client-component',
            savedFrom: 'TestDataSaver-component',
            clientTimestamp: new Date().toISOString(),
            displaySuccess: true
          }),
        });
        
        const result = await response.json();
        console.log('Firebase save result from TestDataSaver:', result);
      } catch (error) {
        console.error('Error saving to Firebase from TestDataSaver:', error);
      }
    };
    
    if (testResult) {
      saveTestToFirebase();
    }
  }, [testResult, formData, transcriptSource]);

  // This component doesn't render anything
  return null;
} 