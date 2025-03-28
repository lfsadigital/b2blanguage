/**
 * Client-side Firebase utility functions
 */

/**
 * Saves test generation data to Firebase using the data-logger API
 */
export async function saveTestData(data: any): Promise<{success: boolean, docId?: string, error?: string}> {
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
      return { success: false, error: result.error };
    }
    
    console.log('Test data saved to Firebase:', result.docId);
    return { success: true, docId: result.docId };
  } catch (error) {
    console.error('Error saving test data to Firebase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 