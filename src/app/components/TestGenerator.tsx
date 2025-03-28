import React, { useEffect } from 'react';

// Add a new function to save test data to Firebase after test is generated
const saveTestDataToFirebase = async (data: any) => {
  try {
    // Use our dedicated data logger API endpoint
    const response = await fetch('/api/data-logger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        collection: 'testGenerationData',
        savedFrom: 'client',
        clientTimestamp: new Date().toISOString()
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to save test data:', result.error);
      return false;
    }
    
    console.log('Test data saved to Firebase:', result.docId);
    return true;
  } catch (error) {
    console.error('Error saving test data to Firebase:', error);
    return false;
  }
};

// Update the handleSubmit function to save data after generation
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Existing code...
  setIsLoading(true);
  setError(null);
  setTestResult(null);
  
  try {
    const response = await fetch('/api/test-generator/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setTestResult(data);
      
      // After successful test generation, save data to Firebase
      if (data.questions) {
        const savedSuccessfully = await saveTestDataToFirebase({
          url: formData.contentUrl,
          subject: data.subject || 'Unknown Subject',
          testQuestions: data.questions,
          studentLevel: formData.studentLevel,
          studentId: formData.studentId || 'unknown',
          teacherId: formData.professorId || 'unknown',
          questionCount: formData.numberOfQuestions,
          isVideo: formData.contentUrl?.includes('youtube.com') || formData.contentUrl?.includes('youtu.be'),
          clientGenerated: true
        });
        
        console.log('Firebase save result:', savedSuccessfully);
      }
    } else {
      setError(data.error || 'Failed to generate test');
    }
  } catch (error) {
    setError('Error generating test: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    setIsLoading(false);
  }
};

// Immediately after the test result is displayed, add this function to save to Firebase
useEffect(() => {
  const saveTestToFirebase = async () => {
    if (!testResult || !testResult.questions) return;
    
    try {
      console.log('Attempting to save test data to Firebase from client...');
      const response = await fetch('/api/data-logger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formData.contentUrl,
          subject: testResult.subject || 'Unknown Subject',
          testQuestions: testResult.questions,
          studentLevel: formData.studentLevel,
          studentId: formData.studentId || 'unknown',
          teacherId: formData.professorId || 'unknown',
          questionCount: formData.numberOfQuestions,
          isVideo: formData.contentUrl?.includes('youtube.com') || formData.contentUrl?.includes('youtu.be'),
          savedFrom: 'client-component',
          clientTimestamp: new Date().toISOString(),
          displaySuccess: true
        }),
      });
      
      const result = await response.json();
      console.log('Firebase save result from client:', result);
    } catch (error) {
      console.error('Error saving to Firebase from client:', error);
    }
  };
  
  if (testResult) {
    saveTestToFirebase();
  }
}, [testResult, formData]); 