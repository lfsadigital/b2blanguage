import { NextResponse } from 'next/server';

// Supadata API Key (should be moved to environment variables)
const SUPADATA_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImtpZCI6IjEifQ.eyJpc3MiOiJuYWRsZXMiLCJpYXQiOiIxNzQyNzYwMzA0IiwicHVycG9zZSI6ImFwaV9hdXRoZW50aWNhdGlvbiIsInN1YiI6ImU1OWI0Y2MyZWNmNzQwOTBhZTgzN2ZmZWQ3NjY3NjkyIn0.0ee3lode52dXvdaQKVC79oaAyNDdftSciOzP2-GeFXI';

// Helper function to format timestamps
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get YouTube transcript using Supadata API
 */
async function getTranscriptWithSupadata(videoId: string): Promise<string> {
  try {
    console.log(`[Supadata] Fetching transcript for video ID: ${videoId}`);
    
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Set up timeout handling with AbortController (30 seconds for Vercel's extended function)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Supadata] Request timed out, aborting...');
      controller.abort();
    }, 30000);
    
    try {
      // Try with URL parameter and text=true for plaintext response
      const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true`, {
        headers: {
          'x-api-key': SUPADATA_API_KEY,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Supadata] API Error (${response.status}): ${errorText}`);
        
        // If language might be the issue, try again with explicit English
        if (response.status === 404 || errorText.includes('language')) {
          console.log('[Supadata] Trying with explicit language parameter (en)...');
          
          // Set up a new timeout for the second request
          const langController = new AbortController();
          const langTimeoutId = setTimeout(() => {
            console.log('[Supadata] Language-specific request timed out, aborting...');
            langController.abort();
          }, 30000);
          
          try {
            const langResponse = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true&lang=en`, {
              headers: {
                'x-api-key': SUPADATA_API_KEY,
                'Content-Type': 'application/json'
              },
              signal: langController.signal
            });
            
            // Clear the timeout
            clearTimeout(langTimeoutId);
            
            if (!langResponse.ok) {
              throw new Error(`Supadata API error with explicit language: ${langResponse.status}`);
            }
            
            const langData = await langResponse.json();
            
            if (!langData.content || typeof langData.content !== 'string' || langData.content.length === 0) {
              throw new Error('No transcript content returned with explicit language');
            }
            
            // Format the plain text into our timestamp format (approximate)
            const lines = langData.content.split('\n');
            const formattedTranscript = lines.map((line: string, index: number) => 
              `[${formatTimestamp(index * 5)}] ${line}`
            ).join(' ');
            
            return formattedTranscript;
          } catch (langError: unknown) {
            // Clear any pending timeout if there was an error
            clearTimeout(langTimeoutId);
            
            // Handle timeout errors specifically
            if (langError instanceof Error && langError.name === 'AbortError') {
              throw new Error('Supadata API language-specific request timed out');
            }
            throw langError;
          }
        }
        
        throw new Error(`Supadata API error: ${response.status} ${errorText}`);
      }
      
      // Handle successful response
      const data = await response.json();
      
      if (!data.content || typeof data.content !== 'string' || data.content.length === 0) {
        // If plain text is empty, try with structured format
        console.log('[Supadata] Plain text content empty, trying structured format...');
        
        // Set up a new timeout for the structured format request
        const structController = new AbortController();
        const structTimeoutId = setTimeout(() => {
          console.log('[Supadata] Structured format request timed out, aborting...');
          structController.abort();
        }, 30000);
        
        try {
          const structuredResponse = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}`, {
            headers: {
              'x-api-key': SUPADATA_API_KEY,
              'Content-Type': 'application/json'
            },
            signal: structController.signal
          });
          
          // Clear the timeout
          clearTimeout(structTimeoutId);
          
          if (!structuredResponse.ok) {
            throw new Error(`Supadata API error with structured format: ${structuredResponse.status}`);
          }
          
          const structuredData = await structuredResponse.json();
          
          if (!structuredData.content || !Array.isArray(structuredData.content) || structuredData.content.length === 0) {
            throw new Error('No transcript segments available in structured format');
          }
          
          // Format the structured response
          const formattedTranscript = structuredData.content
            .map((segment: any) => {
              const timestamp = segment.offset ? segment.offset / 1000 : 0;
              return `[${formatTimestamp(timestamp)}] ${segment.text}`;
            })
            .join(' ');
          
          console.log(`[Supadata] Successfully retrieved structured transcript (${structuredData.content.length} segments)`);
          
          return formattedTranscript;
        } catch (structError: unknown) {
          // Clear any pending timeout if there was an error
          clearTimeout(structTimeoutId);
          
          // Handle timeout errors specifically
          if (structError instanceof Error && structError.name === 'AbortError') {
            throw new Error('Supadata API structured format request timed out');
          }
          throw structError;
        }
      }
      
      // Format the plain text into our timestamp format (approximate)
      const lines = data.content.split('\n');
      const formattedTranscript = lines.map((line: string, index: number) => 
        `[${formatTimestamp(index * 5)}] ${line}`
      ).join(' ');
      
      console.log(`[Supadata] Successfully retrieved plain text transcript (${lines.length} lines)`);
      
      return formattedTranscript;
    } catch (fetchError: unknown) {
      // Clear any pending timeout if there was an error
      clearTimeout(timeoutId);
      
      // Handle timeout errors specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Supadata API request timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(`[Supadata] Error fetching transcript:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId } = body;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }
    
    console.log(`Processing transcript request for video ID: ${videoId}`);
    
    // Get transcript using Supadata (our most reliable method)
    const transcript = await getTranscriptWithSupadata(videoId);
    
    return NextResponse.json({ 
      transcript,
      videoId 
    });
  } catch (error) {
    console.error('Transcript extraction error:', error);
    return NextResponse.json({ 
      error: `Failed to get transcript: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 