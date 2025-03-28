import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TestFormData } from '@/app/lib/types';
import { YoutubeTranscript } from 'youtube-transcript';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import youtubeDl from 'youtube-dl-exec';
import { generateSubjectExtractionPrompt } from '@/app/lib/prompts/test-generator/subject-extraction';
import { generateTestPrompt } from '@/app/lib/prompts/test-generator/main-test';
import { generateContentExtractionPrompt, contentExtractionSystemMessage } from '@/app/lib/prompts/test-generator/content-extraction';
import { logger } from '@/app/lib/utils/logger';

// Supadata API Key (will be moved to environment variables)
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || '';

const execAsync = promisify(exec);

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function getArticleContent(url: string): Promise<string> {
  logger.log(`Fetching article content from: ${url}`);
  try {
    // First try using Vercel's built-in fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      logger.error(`Failed to fetch article: HTTP ${response.status}`);
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const html = await response.text();
    logger.log(`Received HTML content of length: ${html.length}`);
    
    if (html.length < 1000) {
      logger.log('HTML content might be too short, possibly blocked or empty:', html.substring(0, 200));
    }
    
    return processHtmlContent(html);
  } catch (error) {
    logger.error('Error with direct fetch approach:', error);
    
    // Try another method if direct fetch fails - sometimes CORS or other issues prevent direct fetching
    logger.log('Attempting alternative article extraction method...');
    
    try {
      // We'll use an external API service that specializes in content extraction
      // For demonstration, we'll use another approach where we check through our proxy
      const proxyUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api/proxy`
        : 'http://localhost:3000/api/proxy';
      
      logger.log(`Using proxy at ${proxyUrl} to fetch content`);
      
      const proxyResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          }
        }),
      });
      
      const proxyData = await proxyResponse.json();
      
      if (!proxyData.success) {
        logger.error('Proxy fetch failed:', proxyData.error);
        throw new Error(`Proxy fetch failed: ${proxyData.error}`);
      }
      
      logger.log(`Proxy successful, received body of length: ${proxyData.bodyLength}`);
      
      return processHtmlContent(proxyData.body);
    } catch (proxyError) {
      logger.error('Proxy approach also failed:', proxyError);
      throw new Error(`All direct extraction methods failed: ${(error as Error).message}. Proxy error: ${(proxyError as Error).message}`);
    }
  }
}

// Helper function to process HTML content into plain text
function processHtmlContent(html: string): string {
  // Basic HTML to text conversion
  const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                   .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                   .replace(/<[^>]*>/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
  
  logger.log(`Extracted text content of length: ${text.length}`);
  
  if (!text || text.length < 100) {
    logger.error('Article content is too short or empty after extraction');
    throw new Error('Article content is too short or empty');
  }
  
  // Process content based on length
  const maxLength = 6000;
  
  // For very long content, take beginning + middle + end for better context
  if (text.length > maxLength * 1.5) {
    const beginning = text.substring(0, Math.floor(maxLength * 0.4));
    const middle = text.substring(
      Math.floor(text.length/2 - maxLength * 0.3), 
      Math.floor(text.length/2 + maxLength * 0.3)
    );
    const end = text.substring(text.length - Math.floor(maxLength * 0.4));
    
    logger.log(`Content too long (${text.length} chars), using segmented approach`);
    return `${beginning}...[content truncated]...${middle}...[content truncated]...${end}`;
  }
  
  // For regular content, just take the beginning up to maxLength
  return text.substring(0, maxLength);
}

async function getArticleContentFallback(url: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured for fallback content extraction');
  }
  
  logger.log(`Using OpenAI to extract content from URL: ${url}`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: contentExtractionSystemMessage
        },
        {
          role: "user",
          content: generateContentExtractionPrompt(url)
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const extractedContent = completion.choices[0].message.content?.trim();
    
    if (!extractedContent || extractedContent.includes("CANNOT_ACCESS_CONTENT") || extractedContent.length < 100) {
      throw new Error('Unable to extract article content - AI could not access the content');
    }
    
    logger.log(`Successfully extracted content using OpenAI: ${extractedContent.length} characters`);
    return extractedContent;
  } catch (error) {
    logger.error('Error using OpenAI to extract content:', error);
    throw new Error(`OpenAI content extraction failed: ${(error as Error).message}`);
  }
}

async function getVideoTranscriptWithWhisper(url: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }
  
  // Create a temp directory - use /tmp which is writable in Vercel
  const tempDir = '/tmp';
  const randomId = crypto.randomBytes(8).toString('hex');
  const tmpDir = path.join(tempDir, `yt-${randomId}`);
  let outputFile = path.join(tmpDir, `audio_${randomId}.mp3`);
  
  try {
    // Debug trace for deployment verification
    logger.log(`Starting YouTube download process for ${url}`);
    
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
    } catch (error) {
      logger.error(`Error creating temp directory: ${error}`);
    }
    
    logger.log(`Created temp directory: ${tmpDir}`);
    
    // Download audio from YouTube using youtube-dl-exec with minimal options
    logger.log(`Downloading audio from ${url} using youtube-dl-exec...`);
    
    // Use simpler options for better Vercel compatibility
    await youtubeDl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: outputFile,
      noWarnings: true
    });
    
    logger.log(`Checking for downloaded file at: ${outputFile}`);
    
    // Check if file exists and has size
    if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size === 0) {
      throw new Error(`Downloaded audio file is empty or does not exist at path: ${outputFile}`);
    }
    
    logger.log(`Audio downloaded to ${outputFile}. Size: ${fs.statSync(outputFile).size} bytes`);
    logger.log('Transcribing with Whisper...');
    
    // Use OpenAI's Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputFile),
      model: "whisper-1",
    });
    
    logger.log('Transcription completed successfully');
    return transcription.text;
  } catch (error) {
    logger.error('Error transcribing with Whisper:', error);
    throw new Error('Failed to transcribe with Whisper: ' + (error as Error).message);
  } finally {
    // Always clean up temp files, even if errors occur
    try {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
        logger.log(`Cleaned up temp file: ${outputFile}`);
      }
      if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir);
        logger.log(`Cleaned up temp directory: ${tmpDir}`);
      }
    } catch (cleanupError) {
      logger.error('Error cleaning up temp files:', cleanupError);
    }
  }
}

// Add this new helper function near the top of the file after the other imports
async function fetchYouTubeTranscriptDirect(videoId: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    logger.log(`Attempting direct YouTube transcript fetch for video ID: ${videoId}`);
    
    // Fetch the YouTube video page with proper headers
    logger.log(`Fetching YouTube page with video ID: ${videoId}`);
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Cookie': 'CONSENT=YES+; GPS=1; VISITOR_INFO1_LIVE=somevalue'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      logger.log(`Failed to fetch YouTube page: ${response.status}`);
      throw new Error(`Failed to fetch YouTube page: ${response.status}`);
    }
    
    const html = await response.text();
    logger.log(`Received YouTube page HTML (${html.length} chars)`);
    
    // Save first 1000 and last 1000 chars for debugging
    logger.log(`HTML start: ${html.substring(0, 1000)}`);
    logger.log(`HTML end: ${html.substring(html.length - 1000)}`);
    
    // Try multiple approaches to find caption data
    logger.log(`Starting caption URL extraction attempts`);
    
    // Approach 1: Check for timedtext in various formats
    let captionUrl = null;
    
    // Look for timedtext URL directly
    const patterns = [
      /https:\/\/www.youtube.com\/api\/timedtext[^"'\s]+/,
      /playerCaptionsTracklistRenderer.*?url":"(https:\/\/www.youtube.com\/api\/timedtext[^"]+)"/,
      /"captionTracks":\s*\[\s*\{\s*"baseUrl":\s*"([^"]+)"/,
      /"captionTracks":.*?"kind":"asr".*?"baseUrl":"([^"]+)"/  // Specific pattern for auto-generated captions
    ];
    
    for (const pattern of patterns) {
      logger.log(`Trying caption pattern: ${pattern}`);
      const match = html.match(pattern);
      if (match) {
        captionUrl = match[1] || match[0];
        captionUrl = captionUrl.replace(/\\u0026/g, '&').replace(/\\/g, '');
        logger.log(`Found caption URL with pattern: ${captionUrl}`);
        break;
      } else {
        logger.log(`Pattern did not match`);
      }
    }
    
    // Approach 2: Check for inner JSON data
    if (!captionUrl) {
      logger.log(`Trying to extract caption URL from embedded JSON data...`);
      
      // Look for player_response or ytInitialPlayerResponse in the HTML
      const dataMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/) || 
                        html.match(/player_response\s*=\s*'(.+?)'/) ||
                        html.match(/"player_response":"(.+?)"/);
                        
      if (dataMatch) {
        logger.log(`Found data match: ${dataMatch[0].substring(0, 100)}...`);
        try {
          const jsonStr = dataMatch[1].replace(/\\(.)/g, "$1"); // Basic unescaping
          logger.log(`Parsed JSON string length: ${jsonStr.length}`);
          
          const data = JSON.parse(dataMatch[1].includes('{') ? dataMatch[1] : jsonStr);
          logger.log(`Successfully parsed JSON data`);
          
          // Log available properties for debugging
          logger.log(`Top-level properties in data: ${Object.keys(data).join(', ')}`);
          
          if (data.captions) {
            logger.log(`Found captions object in data`);
          } else {
            logger.log(`No captions object found in data`);
          }
          
          if (data.playerResponse) {
            logger.log(`Found playerResponse object in data`);
          }
          
          // Check if there's a captionTracks property anywhere in the data
          const jsonString = JSON.stringify(data);
          if (jsonString.includes('captionTracks')) {
            logger.log(`Found captionTracks somewhere in the data`);
            
            // Find all occurrences of captionTracks
            const captionTracksIndices = [];
            let idx = jsonString.indexOf('captionTracks');
            while (idx !== -1) {
              captionTracksIndices.push(idx);
              idx = jsonString.indexOf('captionTracks', idx + 1);
            }
            
            logger.log(`Found captionTracks at indices: ${captionTracksIndices.join(', ')}`);
            
            // Extract snippets around these occurrences
            for (let i = 0; i < captionTracksIndices.length; i++) {
              const idx = captionTracksIndices[i];
              const snippet = jsonString.substring(Math.max(0, idx - 50), Math.min(jsonString.length, idx + 200));
              logger.log(`Caption context ${i}: ${snippet}`);
            }
          }
          
          // Extract caption info from the parsed data
          let captions = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || 
                          data?.playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          
          // Log what we found
          if (captions) {
            logger.log(`Found captions array with ${captions.length} items`);
          } else {
            logger.log(`Captions not found in standard locations`);
          }
          
          // Look in alternate locations for captions data
          if (!captions && data?.playerConfig?.captions) {
            logger.log(`Trying playerConfig.captions location`);
            captions = data.playerConfig.captions.playerCaptionsTracklistRenderer?.captionTracks;
            if (captions) {
              logger.log(`Found captions in playerConfig`);
            }
          }
          
          // Try to find captions in the playerResponse
          if (!captions && data?.playerResponse) {
            logger.log(`Trying to parse nested playerResponse`);
            try {
              const playerResponse = typeof data.playerResponse === 'string' 
                ? JSON.parse(data.playerResponse) 
                : data.playerResponse;
              
              logger.log(`playerResponse properties: ${Object.keys(playerResponse).join(', ')}`);
              
              if (playerResponse.captions) {
                logger.log(`Found captions in playerResponse`);
              }
              
              captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
              
              if (captions) {
                logger.log(`Successfully extracted captions from playerResponse`);
              }
            } catch (e) {
              logger.log(`Error parsing nested playerResponse:`, e);
            }
          }
          
          // Additional search in playerConfig structure
          if (!captions && data?.playerConfig?.audioConfig?.captionList) {
            logger.log(`Trying audioConfig.captionList location`);
            captions = data.playerConfig.audioConfig.captionList;
            if (captions) {
              logger.log(`Found captions in audioConfig`);
            }
          }
                          
          if (captions && captions.length > 0) {
            logger.log(`Processing ${captions.length} caption tracks`);
            
            // Log all caption tracks for debugging
            captions.forEach((track: any, index: number) => {
              logger.log(`Caption track ${index}:`, 
                `kind=${track.kind || 'N/A'}`, 
                `name=${track.name?.simpleText || track.name || 'N/A'}`,
                `baseUrl length=${track.baseUrl ? track.baseUrl.length : 0}`);
            });
            
            // First try to find auto-captions if they exist
            const autoCaption = captions.find((track: { kind: string, baseUrl: string }) => track.kind === 'asr');
            if (autoCaption) {
              captionUrl = autoCaption.baseUrl;
              logger.log(`Found auto-generated caption URL: ${captionUrl}`);
            } else {
              // Fall back to first available caption
              captionUrl = captions[0].baseUrl;
              logger.log(`Found caption URL in JSON data: ${captionUrl}`);
            }
          } else {
            logger.log(`No caption tracks found in JSON data`);
          }
        } catch (jsonError) {
          logger.error(`Error parsing JSON data from HTML:`, jsonError);
        }
      } else {
        logger.log(`No JSON data match found in HTML`);
      }
    }
    
    // Additional search for timedtext using simplified approach
    if (!captionUrl) {
      logger.log(`Trying simplified timedtext search`);
      // Simply look for text matching timedtext with video ID
      if (html.includes(`timedtext?v=${videoId}`)) {
        logger.log(`Found basic timedtext reference for video ID`);
        
        // Extract minimal working URL
        const basicUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
        logger.log(`Generated basic caption URL: ${basicUrl}`);
        
        // Verify if this URL works by making a request
        try {
          const testResponse = await fetch(basicUrl);
          if (testResponse.ok) {
            logger.log(`Basic caption URL is valid`);
            captionUrl = basicUrl;
          } else {
            logger.log(`Basic caption URL returned ${testResponse.status}`);
          }
        } catch (e) {
          logger.log(`Error testing basic caption URL:`, e);
        }
      }
    }
    
    // If no caption URL found after all attempts
    if (!captionUrl) {
      logger.log(`No caption URL found after all attempts`);
      
      // Search for specific indicators that captions exist but couldn't be accessed
      const hasCaptionsIndicator = html.includes('"hasCaptions":true') || 
                                html.includes('"hasClosedCaptions":true') ||
                                html.includes('{"captionTracks":');
                                
      if (hasCaptionsIndicator) {
        logger.log(`Found indicators that captions exist but couldn't be accessed`);
      }
      
      // Check for a specific indicator that captions are disabled
      if (html.includes('"playerCaptionsTracklistRenderer":{}') || 
          html.includes('"captionTracks":[]')) {
        logger.log(`Found explicit indicators that captions are disabled`);
        throw new Error('Captions are disabled for this video');
      }
      
      throw new Error('Could not find transcript URL in the YouTube page');
    }
    
    captionUrl = decodeURIComponent(captionUrl);
    logger.log(`Processing transcript URL: ${captionUrl}`);
    
    // Add parameters if they're not present (lang, format, etc.)
    if (!captionUrl.includes('&lang=')) {
      // Check if there's a tlang parameter already
      if (!captionUrl.includes('&tlang=')) {
        logger.log(`Adding lang parameter`);
        captionUrl += '&lang=en';
      }
    }
    if (!captionUrl.includes('&fmt=')) {
      logger.log(`Adding fmt parameter`);
      captionUrl += '&fmt=json3';
    }
    
    // Try different formats if the first one fails
    let transcriptData = null;
    let format = 'xml';
    
    // First try with JSON format
    try {
      const jsonUrl = captionUrl.includes('&fmt=') 
        ? captionUrl.replace(/&fmt=[^&]+/, '&fmt=json3') 
        : captionUrl + '&fmt=json3';
        
      logger.log(`Trying JSON format: ${jsonUrl}`);
      const jsonResponse = await fetch(jsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
      });
      
      if (jsonResponse.ok) {
        logger.log(`JSON response OK, status: ${jsonResponse.status}`);
        const jsonData = await jsonResponse.json();
        logger.log(`JSON data parsed successfully`);
        
        if (jsonData.events && jsonData.events.length > 0) {
          logger.log(`Found ${jsonData.events.length} JSON events`);
          transcriptData = jsonData;
          format = 'json';
        } else {
          logger.log(`JSON data doesn't contain events or is empty`);
        }
      } else {
        logger.log(`JSON response failed with status: ${jsonResponse.status}`);
      }
    } catch (jsonError) {
      logger.log(`JSON format failed with error:`, jsonError);
      logger.log(`Falling back to XML format`);
    }
    
    // If JSON failed, try XML format
    if (!transcriptData) {
      const xmlUrl = captionUrl.includes('&fmt=') 
        ? captionUrl.replace(/&fmt=[^&]+/, '&fmt=srv1') 
        : captionUrl + '&fmt=srv1';
        
      logger.log(`Trying XML format: ${xmlUrl}`);
      const xmlResponse = await fetch(xmlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
      });
      
      if (!xmlResponse.ok) {
        logger.log(`XML response failed with status: ${xmlResponse.status}`);
        throw new Error(`Failed to fetch transcript: ${xmlResponse.status}`);
      }
      
      transcriptData = await xmlResponse.text();
      logger.log(`XML data retrieved, length: ${transcriptData.length}`);
    }
    
    // Try a direct YouTube API request if we still don't have data
    if (!transcriptData) {
      logger.log(`All caption format attempts failed, trying direct API request`);
      
      // Create a very basic YouTube API URL for captions
      const directApiUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3&xorb=2&xobt=3&xovt=3`;
      logger.log(`Making direct API request: ${directApiUrl}`);
      
      try {
        const directResponse = await fetch(directApiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Referer': `https://www.youtube.com/watch?v=${videoId}`,
            'Origin': 'https://www.youtube.com'
          }
        });
        
        if (directResponse.ok) {
          logger.log(`Direct API request successful`);
          const directData = await directResponse.text();
          
          if (directData && directData.length > 100) {
            logger.log(`Direct API data retrieved, length: ${directData.length}`);
            transcriptData = directData;
            format = 'xml'; // Assume XML format for this request
          } else {
            logger.log(`Direct API returned empty or too short data: ${directData}`);
          }
        } else {
          logger.log(`Direct API request failed: ${directResponse.status}`);
        }
      } catch (directError) {
        logger.log(`Direct API request error:`, directError);
      }
    }
    
    // If we still don't have data, try with some hardcoded language options
    if (!transcriptData) {
      logger.log(`Trying with specific language options`);
      const languagesToTry = ['en', 'en-US', 'en-GB', 'pt', 'pt-BR', 'es', 'fr', ''];
      
      for (const lang of languagesToTry) {
        try {
          const langUrl = `https://www.youtube.com/api/timedtext?v=${videoId}${lang ? `&lang=${lang}` : ''}&fmt=json3`;
          logger.log(`Trying language: ${lang || 'default'} with URL: ${langUrl}`);
          
          const langResponse = await fetch(langUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            }
          });
          
          if (langResponse.ok) {
            const langData = await langResponse.json();
            if (langData.events && langData.events.length > 0) {
              logger.log(`Found working language: ${lang || 'default'}`);
              transcriptData = langData;
              format = 'json';
              break;
            } else {
              logger.log(`No events found for language: ${lang || 'default'}`);
            }
          } else {
            logger.log(`Failed for language: ${lang || 'default'} with status: ${langResponse.status}`);
          }
        } catch (langError) {
          logger.log(`Error trying language ${lang || 'default'}:`, langError);
        }
      }
    }
    
    // If we still don't have transcript data after all attempts
    if (!transcriptData) {
      logger.log(`All caption retrieval methods failed`);
      throw new Error('Could not retrieve caption data after multiple attempts');
    }
    
    // Parse based on the format we got
    const segments = [];
    logger.log(`Parsing transcript data in ${format} format`);
    
    if (format === 'json') {
      // Parse JSON format
      for (const event of transcriptData.events) {
        if (event.segs && event.segs.length > 0) {
          const start = event.tStartMs / 1000;
          const duration = (event.dDurationMs || 1000) / 1000;
          const text = event.segs.map((seg: { utf8: string }) => seg.utf8).join(' ');
          
          if (text.trim()) {
            segments.push({ start, duration, text });
          }
        }
      }
    } else {
      // Parse XML format
      const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>(.*?)<\/text>/g;
      
      let matchText;
      while ((matchText = textRegex.exec(transcriptData)) !== null) {
        const start = parseFloat(matchText[1]);
        const duration = parseFloat(matchText[2]);
        const text = matchText[3]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/<[^>]*>/g, ''); // Remove any HTML tags
        
        segments.push({ start, duration, text });
      }
    }
    
    if (segments.length === 0) {
      logger.log(`No transcript segments found after parsing`);
      throw new Error('No transcript segments found');
    }
    
    logger.log(`Parsed ${segments.length} transcript segments`);
    
    // Format the transcript with timestamps
    const formattedTranscript = segments.map(
      part => `[${formatTimestamp(part.start)}] ${part.text}`
    ).join(' ');
    
    logger.log(`Final transcript length: ${formattedTranscript.length}`);
    
    return { 
      transcript: formattedTranscript,
      isYouTubeTranscript: true
    };
  } catch (error) {
    logger.error(`Error in direct YouTube transcript fetch:`, error);
    throw error;
  }
}

/**
 * Get YouTube transcript using Supadata API
 */
async function getTranscriptWithSupadata(videoId: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    logger.log(`Fetching transcript for video ID: ${videoId}`);
    
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Set up timeout handling with AbortController (8 seconds to stay under Vercel's 10s limit)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.log(`Request timed out, aborting...`);
      controller.abort();
    }, 8000);
    
    try {
      // Try with URL parameter and text=true for plaintext response (recommended in docs)
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
        logger.error(`API Error (${response.status}): ${errorText}`);
        
        // If language might be the issue, try again with explicit English
        if (response.status === 404 || errorText.includes('language')) {
          logger.log(`Trying with explicit language parameter (en)...`);
          
          // Set up a new timeout for the second request
          const langController = new AbortController();
          const langTimeoutId = setTimeout(() => {
            logger.log(`Language-specific request timed out, aborting...`);
            langController.abort();
          }, 8000);
          
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
            
            return {
              transcript: formattedTranscript,
              isYouTubeTranscript: true
            };
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
        logger.log(`Plain text content empty, trying structured format...`);
        
        // Set up a new timeout for the structured format request
        const structController = new AbortController();
        const structTimeoutId = setTimeout(() => {
          logger.log(`Structured format request timed out, aborting...`);
          structController.abort();
        }, 8000);
        
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
          
          logger.log(`Successfully retrieved structured transcript (${structuredData.content.length} segments)`);
          
          return {
            transcript: formattedTranscript,
            isYouTubeTranscript: true
          };
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
      
      logger.log(`Successfully retrieved plain text transcript (${lines.length} lines)`);
      
      return {
        transcript: formattedTranscript,
        isYouTubeTranscript: true
      };
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
    logger.error(`Error fetching transcript:`, error);
    throw error;
  }
}

/**
 * Get YouTube transcript using our custom service
 */
async function getTranscriptWithCustomService(videoId: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    logger.log(`Fetching transcript for video ID: ${videoId}`);
    
    // Set up timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.log(`Request timed out, aborting...`);
      controller.abort();
    }, 30000); // 30 second timeout
    
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
        logger.error(`API Error (${response.status}): ${errorText}`);
        throw new Error(`Custom API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.transcript) {
        throw new Error('No transcript returned from custom API');
      }
      
      logger.log(`Successfully retrieved transcript (${data.transcript.length} chars)`);
      
      return {
        transcript: data.transcript,
        isYouTubeTranscript: true
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Custom API request timed out');
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error fetching transcript:`, error);
    throw error;
  }
}

async function getVideoTranscript(url: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    logger.log(`Getting transcript for ${url}...`);
    // Extract video ID from URL
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }
    
    logger.log(`Video ID: ${videoId}`);
    
    // Track all errors for better debugging
    let customApiError: Error | null = null;
    let supadataError: Error | null = null;
    let directError: Error | null = null;
    let ytError = null;
    let whisperError = null;
    
    // Method 1: Try Custom API first
    try {
      logger.log('Attempting to get transcript via Custom API...');
      return await getTranscriptWithCustomService(videoId);
    } catch (error) {
      logger.log('Custom API failed with error:', error);
      customApiError = error as Error;
      logger.log('Falling back to Supadata API...');
    }
    
    // Method 2: Try Supadata API as fallback
    try {
      logger.log('Attempting to get transcript via Supadata API...');
      return await getTranscriptWithSupadata(videoId);
    } catch (error) {
      logger.log('Supadata API failed with error:', error);
      supadataError = error as Error;
      logger.log('Falling back to direct method...');
    }
    
    // Method 3: Try our direct fetching method
    try {
      logger.log('Attempting direct method to get YouTube captions...');
      return await fetchYouTubeTranscriptDirect(videoId);
    } catch (error) {
      logger.log('Direct caption fetch method failed with error:', error);
      directError = error as Error;
      logger.log('Falling back to YouTube transcript library...');
    }
    
    // Method 4: Try original YouTube transcript method
    try {
      logger.log('Attempting to get YouTube captions via library...');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video');
      }
      
      logger.log('Successfully retrieved YouTube captions!');
      // Join all transcript parts with timestamps
      return { 
        transcript: transcript.map(part => `[${formatTimestamp(part.offset)}] ${part.text}`).join(' '),
        isYouTubeTranscript: true
      };
    } catch (error: any) {
      logger.log('YouTube transcript API failed with error:', error);
      ytError = error;
      logger.log('Falling back to Whisper transcription...');
      
      // Method 5: Try Whisper transcription
      try {
        const whisperTranscript = await getVideoTranscriptWithWhisper(url);
        return { transcript: whisperTranscript, isYouTubeTranscript: false };
      } catch (wError: any) {
        logger.error('Whisper transcription also failed:', wError);
        whisperError = wError;
        
        // No more fallbacks - all methods failed
        throw new Error(`All transcript methods failed. Custom API error: ${customApiError ? customApiError.message : 'N/A'}, Supadata error: ${supadataError ? supadataError.message : 'N/A'}, Direct method error: ${directError ? directError.message : 'N/A'}, YouTube error: ${ytError.message}, Whisper error: ${whisperError.message}`);
      }
    }
  } catch (error) {
    logger.error('Error getting video transcript:', error);
    throw new Error('Failed to get video transcript: ' + (error as Error).message);
  }
}

// Format seconds into mm:ss format
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Extract a meaningful subject from the URL or content
async function extractSubject(url: string, content: string): Promise<string> {
  try {
    // First, try using the OpenAI to generate a concise subject
    if (openai) {
      try {
        const subjectPrompt = generateSubjectExtractionPrompt(content);
        
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert at identifying main topics and themes in content."
            },
            {
              role: "user",
              content: subjectPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 50,
        });
        
        const generatedSubject = response.choices[0].message.content?.trim();
        if (generatedSubject && generatedSubject.length > 3) {
          logger.log(`Generated subject: ${generatedSubject}`);
          return generatedSubject;
        }
      } catch (aiError) {
        logger.error('Error generating subject with AI:', aiError);
        // Continue with fallback methods
      }
    }
    
    // Try to extract title from URL if it's YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Get the title part from the URL if available
      const titleMatch = url.match(/title=([^&]+)/);
      if (titleMatch && titleMatch[1]) {
        return decodeURIComponent(titleMatch[1]).replace(/\+/g, ' ');
      }
    }
    
    // Fallback: Extract likely subject from the first few sentences
    const firstFewSentences = content.split(/[.!?]/).slice(0, 3).join('. ');
    
    if (firstFewSentences.length > 10) {
      // Try to extract a cleaner subject
      const cleanSubject = firstFewSentences
        .substring(0, 100)
        .replace(/\[[\d:]+\]/g, '') // Remove timestamps
        .trim();
      
      return cleanSubject;
    }
    
    // Default
    return 'Content Analysis';
  } catch (error) {
    logger.error('Error extracting subject:', error);
    return 'Content Analysis';
  }
}

export async function POST(request: Request) {
  // Version identifier for deployment verification
  logger.log("=== TEST GENERATOR API v1.2.1 (DEBUG BUILD) ===");
  
  try {
    // Check if OpenAI client is available
    if (!openai) {
      logger.error("API ERROR: OpenAI API key is not configured");
      return new NextResponse(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    logger.log("Starting test generation request processing...");
    let formData: TestFormData;
    
    try {
      formData = await request.json();
      logger.log(`Received form data with contentUrl: ${formData.contentUrl?.substring(0, 30)}...`);
    } catch (parseError) {
      logger.error("Failed to parse request JSON:", parseError);
      return new NextResponse(
        JSON.stringify({ error: "Invalid request data format" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const url = formData.contentUrl;
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!url) {
      logger.error("Missing contentUrl in request");
      return new NextResponse(
        JSON.stringify({ error: 'Content URL is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // For articles, get the content
    // For videos, use YouTube Transcript API with Whisper fallback
    let contentInfo = "";
    let hasContent = false;
    let isVideo = false;
    let hasTimestamps = false;
    let extractedSubject = "";
    let contentText = ""; // Store raw content for subject extraction
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      isVideo = true;
      try {
        const { transcript, isYouTubeTranscript } = await getVideoTranscript(url);
        hasTimestamps = isYouTubeTranscript;
        
        if (transcript && transcript.length > 100) {
          contentInfo = `Video transcript: ${transcript}`;
          contentText = transcript; // Store for subject extraction
          hasContent = true;
        } else {
          return new NextResponse(
            JSON.stringify({ error: 'Video transcript is too short or empty' }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }
      } catch (error) {
        logger.error('Error getting video transcript:', error);
        return new NextResponse(
          JSON.stringify({ error: `Unable to transcribe video: ${(error as Error).message}` }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } else {
      try {
        let articleContent;
        
        try {
          logger.log('Trying direct method to get article content...');
          articleContent = await getArticleContent(url);
        } catch (directError) {
          logger.error('Direct method failed, trying fallback for article content:', directError);
          
          try {
            articleContent = await getArticleContentFallback(url);
          } catch (fallbackError) {
            // Do not generate content about the URL - that's not acceptable
            logger.error('All extraction methods failed, we cannot process this URL:', fallbackError);
            throw new Error('Unable to extract real content from this URL. Please try a different article URL or a YouTube video instead.');
          }
        }
        
        if (articleContent && articleContent.length > 100) {
          contentInfo = `Article content: ${articleContent}`;
          contentText = articleContent; // Store for subject extraction
          hasContent = true;
        } else {
          return new NextResponse(
            JSON.stringify({ error: 'Article content is too short or empty' }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }
      } catch (error) {
        logger.error('All article content methods failed:', error);
        return new NextResponse(
          JSON.stringify({ error: `Unable to extract content from URL: ${(error as Error).message}` }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }
    
    // Verify we have content before proceeding
    if (!hasContent) {
      return new NextResponse(
        JSON.stringify({ error: 'No content was extracted from the provided URL' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Step 1: Extract subject from content (as a separate step)
    logger.log('Extracting subject from content...');
    try {
      extractedSubject = await extractSubject(url, contentText);
      logger.log(`Extracted subject: "${extractedSubject}"`);
    } catch (subjectError) {
      logger.error('Error during subject extraction:', subjectError);
      extractedSubject = 'English Language Test';
    }

    const videoInstructions = isVideo ? `
    - Mark each question with a reference to the specific timestamp in the video as [Ref: MM:SS] at the end of the question
    - Format timestamps as [Ref: 01:13] with minutes and seconds 
    - ${hasTimestamps ? "Use the exact timestamps from the transcript whenever possible" : "Create appropriate timestamps based on when the content appears in the video"}
    ` : '';

    const prompt = generateTestPrompt(
      url,
      contentInfo,
      formData,
      extractedSubject,
      today,
      videoInstructions
    );

    // Step 2: Generate the test based on content and extracted subject
    logger.log('Generating test...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert English teacher creating tests to assess language proficiency for Brazilian students. Your tests focus on grammar, vocabulary, reading comprehension, and language use in context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedTest = completion.choices[0].message.content;
    
    if (!generatedTest) {
      throw new Error('Failed to generate test content');
    }
    
    // Split the test into questions and answers
    const parts = generatedTest.split('---');
    const questions = parts[0].trim();
    const answers = parts.length > 1 ? parts[1].trim() : '';

    return new NextResponse(
      JSON.stringify({ 
        test: generatedTest,
        questions: questions,
        answers: answers,
        subject: extractedSubject
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    logger.error('Error generating test:', error);
    return new NextResponse(
      JSON.stringify({ error: `Failed to generate test: ${(error as Error).message}` }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}