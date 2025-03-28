// This file contains the changes needed to update the B2B Languages application
// to use the new transcript API service instead of Supadata.

// Step 1: Add the new transcript service URL and API key to your .env file
// Add these lines to your .env.local file:
/*
TRANSCRIPT_API_URL=http://134.199.229.165:3000
TRANSCRIPT_API_KEY=your-generated-api-key
*/

// Step 2: Update src/app/api/test-generator/generate/route.ts
// Replace the existing getTranscriptWithSupadata function with this:

/**
 * Get YouTube transcript using our own transcript service
 */
async function getTranscriptWithCustomService(videoId: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    console.log(`[Custom Service] Fetching transcript for video ID: ${videoId}`);
    
    // Set up timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Custom Service] Request timed out, aborting...');
      controller.abort();
    }, 30000); // Increase timeout to 30 seconds
    
    try {
      // Call our custom transcript API service
      const response = await fetch(`${process.env.TRANSCRIPT_API_URL}/api/transcript`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.TRANSCRIPT_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId }),
        signal: controller.signal
      });
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Custom Service] API Error (${response.status}): ${errorText}`);
        throw new Error(`Custom API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.transcript) {
        throw new Error('No transcript returned from custom API');
      }
      
      console.log(`[Custom Service] Successfully retrieved transcript (${data.transcript.length} chars)`);
      
      return {
        transcript: data.transcript,
        isYouTubeTranscript: true
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Custom API request timed out');
      }
      throw error;
    }
  } catch (error) {
    console.error(`[Custom Service] Error fetching transcript:`, error);
    throw error;
  }
}

// Step 3: Update the getVideoTranscript function in the same file
// Change the first method from Supadata to our custom service:

// Now modify the getVideoTranscript function to use our custom service first
async function getVideoTranscript(url: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  // Extract videoId from the URL
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }
  
  let customServiceError: Error | null = null;
  let directError: Error | null = null;
  
  try {
    // Method 1: Try our custom transcript service first (most reliable)
    console.log('Attempting to get transcript via custom transcript service...');
    return await getTranscriptWithCustomService(videoId);
  } catch (error) {
    console.log('Custom service failed with error:', error);
    customServiceError = error as Error;
    
    // Method 2: Try direct YouTube transcript fetch
    try {
      console.log('Attempting direct YouTube transcript fetch...');
      return await fetchYouTubeTranscriptDirect(videoId);
    } catch (ytError) {
      console.log('Direct fetch method failed with error:', ytError);
      directError = ytError as Error;
      
      // Method 3: Last resort - try to get the transcript using Whisper
      try {
        console.log('Attempting whisper method as last resort...');
        return await getVideoTranscriptWithWhisper(url);
      } catch (whisperError) {
        console.error('All transcript methods failed');
        throw new Error(`All transcript methods failed. Custom service error: ${customServiceError ? customServiceError.message : 'N/A'}, Direct method error: ${directError ? directError.message : 'N/A'}, Whisper error: ${whisperError.message}`);
      }
    }
  }
}

// Step 4: In src/app/test-generator/page.tsx
// Update the transcript API call in the handleSubmit function, when using the transcript approach:

// Step 1: Get transcript
const transcriptResponse = await fetch('/api/test-generator/generate-from-transcript/transcript', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ videoId: data.youtubeVideoId }),
}); 