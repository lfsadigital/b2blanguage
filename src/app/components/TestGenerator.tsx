import React, { useState, useEffect } from 'react';

interface TestFormData {
  contentUrl?: string;
  studentLevel?: string;
  studentId?: string;
  professorId?: string;
  numberOfQuestions?: number;
}

interface TestGeneratorProps {
  onSubmit?: (formData: TestFormData) => Promise<void>;
}

export default function TestGenerator({ onSubmit }: TestGeneratorProps) {
  const [formData, setFormData] = useState<TestFormData>({
    contentUrl: '',
    studentLevel: 'Advanced',
    numberOfQuestions: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Function to save test data to Firebase after test generation
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      // If an external onSubmit handler is provided, use it
      if (onSubmit) {
        await onSubmit(formData);
        return;
      }
      
      // Otherwise, handle submission internally
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

  // Save test data to Firebase when test result changes
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="test-generator">
      {/* Form section */}
      {!testResult && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700">Content URL</label>
            <input
              type="text"
              id="contentUrl"
              name="contentUrl"
              value={formData.contentUrl}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="studentLevel" className="block text-sm font-medium text-gray-700">Student Level</label>
            <select
              id="studentLevel"
              name="studentLevel"
              value={formData.studentLevel}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Medium">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-gray-700">Number of Questions</label>
            <input
              type="number"
              id="numberOfQuestions"
              name="numberOfQuestions"
              value={formData.numberOfQuestions}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Generating...' : 'Generate Test'}
          </button>
          
          {error && (
            <div className="text-red-600 mt-2">
              {error}
            </div>
          )}
        </form>
      )}
      
      {/* Results section */}
      {testResult && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Test</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <pre className="whitespace-pre-wrap">{testResult.test}</pre>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="mt-4 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate Another Test
          </button>
        </div>
      )}
    </div>
  );
} 