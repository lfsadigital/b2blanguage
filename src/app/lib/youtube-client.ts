/**
 * Client-side YouTube transcript extraction
 * This serves as a fallback when the server-side extraction methods fail
 */

// CORS proxy URL - can be replaced with your own if needed
const CORS_PROXY_URL = 'https://corsproxy.io/?';

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string {
  // Handle youtube.com URLs
  if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v') || '';
  }
  
  // Handle youtu.be URLs
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0];
  }
  
  return '';
}

/**
 * Format timestamp in [MM:SS] format
 */
export function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Get transcript for a YouTube video using client-side extraction
 * This uses a CORS proxy to fetch the YouTube transcript
 */
export async function getYouTubeTranscriptClient(videoId: string): Promise<{ transcript: string, success: boolean }> {
  try {
    console.log('[Client] Attempting to fetch YouTube transcript for:', videoId);
    
    // Attempt to fetch the timedtext API directly with a CORS proxy
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(captionUrl)}`;
    
    console.log('[Client] Fetching from:', proxyUrl);
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error('[Client] Failed to fetch transcript:', response.status);
      throw new Error(`Failed to fetch transcript: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    if (xmlText.length < 100 || !xmlText.includes('<text')) {
      // Try with another language or format
      console.log('[Client] XML response too short or missing text tags, trying alternate format');
      
      // Try JSON format
      const jsonUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
      const jsonProxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(jsonUrl)}`;
      
      const jsonResponse = await fetch(jsonProxyUrl);
      
      if (!jsonResponse.ok) {
        throw new Error(`Failed to fetch JSON transcript: ${jsonResponse.status}`);
      }
      
      const jsonData = await jsonResponse.json();
      
      if (!jsonData.events || jsonData.events.length === 0) {
        throw new Error('No transcript events found in JSON response');
      }
      
      // Extract text from JSON format
      const segments = jsonData.events
        .filter((event: any) => event.segs && event.segs.length > 0)
        .map((event: any) => {
          const start = event.tStartMs / 1000;
          const text = event.segs.map((seg: any) => seg.utf8).join(' ');
          return { start, text };
        });
      
      if (segments.length === 0) {
        throw new Error('No transcript segments found in JSON format');
      }
      
      console.log('[Client] Successfully parsed JSON transcript with', segments.length, 'segments');
      
      const transcript = segments
        .map((segment: { start: number, text: string }) => `[${formatTimestamp(segment.start)}] ${segment.text}`)
        .join(' ');
      
      return { transcript, success: true };
    }
    
    // Parse XML format
    console.log('[Client] Parsing XML transcript format');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textNodes = xmlDoc.getElementsByTagName('text');
    
    if (textNodes.length === 0) {
      throw new Error('No text nodes found in XML response');
    }
    
    const segments = [];
    
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const start = parseFloat(node.getAttribute('start') || '0');
      const text = node.textContent || '';
      
      if (text.trim()) {
        segments.push({ start, text });
      }
    }
    
    console.log('[Client] Successfully parsed XML transcript with', segments.length, 'segments');
    
    const transcript = segments
      .map((segment: { start: number, text: string }) => `[${formatTimestamp(segment.start)}] ${segment.text}`)
      .join(' ');
    
    return { transcript, success: true };
  } catch (error) {
    console.error('[Client] Error in client-side transcript extraction:', error);
    return { 
      transcript: '', 
      success: false 
    };
  }
}

/**
 * Main function to get YouTube transcript with client-side fallback
 */
export async function getYouTubeTranscriptWithClientFallback(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL: could not extract video ID');
  }
  
  // Try to fetch the transcript using the client-side method
  const { transcript, success } = await getYouTubeTranscriptClient(videoId);
  
  if (success && transcript) {
    return transcript;
  } else {
    throw new Error('Client-side transcript extraction failed');
  }
} 