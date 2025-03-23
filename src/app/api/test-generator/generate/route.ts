import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TestFormData } from '@/app/lib/types';
import { YoutubeTranscript } from 'youtube-transcript';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import youtubeDl from 'youtube-dl-exec';
import { generateSubjectExtractionPrompt } from '@/app/lib/prompts/test-generator/subject-extraction';
import { generateTestPrompt } from '@/app/lib/prompts/test-generator/main-test';

const execAsync = promisify(exec);

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function getArticleContent(url: string): Promise<string> {
  console.log(`Fetching article content from: ${url}`);
  try {
    // First try using Vercel's built-in fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch article: HTTP ${response.status}`);
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`Received HTML content of length: ${html.length}`);
    
    if (html.length < 1000) {
      console.log('HTML content might be too short, possibly blocked or empty:', html.substring(0, 200));
    }
    
    return processHtmlContent(html);
  } catch (error) {
    console.error('Error with direct fetch approach:', error);
    
    // Try another method if direct fetch fails - sometimes CORS or other issues prevent direct fetching
    console.log('Attempting alternative article extraction method...');
    
    try {
      // We'll use an external API service that specializes in content extraction
      // For demonstration, we'll use another approach where we check through our proxy
      const proxyUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api/proxy`
        : 'http://localhost:3000/api/proxy';
      
      console.log(`Using proxy at ${proxyUrl} to fetch content`);
      
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
        console.error('Proxy fetch failed:', proxyData.error);
        throw new Error(`Proxy fetch failed: ${proxyData.error}`);
      }
      
      console.log(`Proxy successful, received body of length: ${proxyData.bodyLength}`);
      
      return processHtmlContent(proxyData.body);
    } catch (proxyError) {
      console.error('Proxy approach also failed:', proxyError);
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
  
  console.log(`Extracted text content of length: ${text.length}`);
  
  if (!text || text.length < 100) {
    console.error('Article content is too short or empty after extraction');
    throw new Error('Article content is too short or empty');
  }
  
  // Take a larger portion for better context
  return text.substring(0, 6000); // Increased from 4000 to 6000
}

async function getArticleContentFallback(url: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured for fallback content extraction');
  }
  
  console.log(`Using OpenAI to extract content from URL: ${url}`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a precise content extractor that only extracts real content from web URLs. You MUST NEVER invent or make up content. If you cannot access the real content, clearly state that you cannot extract it rather than generating anything."
        },
        {
          role: "user",
          content: `Extract the main article content from this URL: ${url}

VERY IMPORTANT: 
1. If you cannot access the actual content, respond ONLY with: "CANNOT_ACCESS_CONTENT"
2. DO NOT generate or make up ANY content
3. Only return the extracted content if you can actually access it
4. No introduction or explanation - only return the extracted content itself`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const extractedContent = completion.choices[0].message.content?.trim();
    
    if (!extractedContent || extractedContent.includes("CANNOT_ACCESS_CONTENT") || extractedContent.length < 100) {
      throw new Error('Unable to extract article content - AI could not access the content');
    }
    
    console.log(`Successfully extracted content using OpenAI: ${extractedContent.length} characters`);
    return extractedContent;
  } catch (error) {
    console.error('Error using OpenAI to extract content:', error);
    throw new Error(`OpenAI content extraction failed: ${(error as Error).message}`);
  }
}

async function getVideoTranscriptWithWhisper(url: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    // Create a temp directory - use /tmp which is writable in Vercel
    const tempDir = '/tmp';
    const randomId = Math.random().toString(36).substring(2, 15);
    const tmpDir = path.join(tempDir, `yt-${randomId}`);
    
    // Debug trace for deployment verification (23-Mar-2024)
    console.log(`[DEBUG v1.2.0] Starting YouTube download process for ${url}`);
    
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating temp directory: ${error}`);
    }
    
    console.log(`Created temp directory: ${tmpDir}`);
    const outputFile = path.join(tmpDir, `audio_${randomId}.mp3`);
    
    // Download audio from YouTube using youtube-dl-exec with minimal options
    console.log(`Downloading audio from ${url} using youtube-dl-exec (simpler config)...`);
    
    try {
      // Use simpler options for better Vercel compatibility
      await youtubeDl(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: outputFile,
        noWarnings: true
      });
      
      console.log(`Checking for downloaded file at: ${outputFile}`);
      
      // Check if file exists and has size
      if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size === 0) {
        throw new Error(`Downloaded audio file is empty or does not exist at path: ${outputFile}`);
      }
      
      console.log(`Audio downloaded to ${outputFile}. Size: ${fs.statSync(outputFile).size} bytes`);
      console.log('Transcribing with Whisper...');
      
      // Use OpenAI's Whisper API for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(outputFile),
        model: "whisper-1",
      });
      
      // Clean up temp files
      try {
        fs.unlinkSync(outputFile);
        fs.rmdirSync(tmpDir);
      } catch (e) {
        console.error('Error cleaning up temp files:', e);
      }
      
      console.log('Transcription completed successfully');
      return transcription.text;
    } catch (error) {
      console.error('Detailed error info:', error);
      // Try alternative YouTube transcript method
      throw new Error(`Failed to download/process YouTube audio: ${(error as Error).message}`);
    }
  } catch (error) {
    console.error('Error transcribing with Whisper:', error);
    throw new Error('Failed to transcribe with Whisper: ' + (error as Error).message);
  }
}

// Update the getVideoTranscript function to remove the OpenAI fallback
async function getVideoTranscript(url: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    console.log(`Getting transcript for ${url}...`);
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
    
    console.log(`Video ID: ${videoId}`);
    
    // Track all errors for better debugging
    let ytError = null;
    let whisperError = null;
    
    try {
      console.log('Attempting to get YouTube captions directly...');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video');
      }
      
      console.log('Successfully retrieved YouTube captions!');
      // Join all transcript parts with timestamps
      return { 
        transcript: transcript.map(part => `[${formatTimestamp(part.offset)}] ${part.text}`).join(' '),
        isYouTubeTranscript: true
      };
    } catch (error: any) {
      console.log('YouTube transcript API failed with error:', error);
      ytError = error;
      console.log('Falling back to Whisper transcription...');
      
      // Try Whisper transcription
      try {
        const whisperTranscript = await getVideoTranscriptWithWhisper(url);
        return { transcript: whisperTranscript, isYouTubeTranscript: false };
      } catch (wError: any) {
        console.error('Whisper transcription also failed:', wError);
        whisperError = wError;
        
        // No more fallbacks - all methods failed
        throw new Error(`All transcript methods failed. YouTube error: ${ytError.message}, Whisper error: ${whisperError.message}`);
      }
    }
  } catch (error) {
    console.error('Error getting video transcript:', error);
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
          console.log(`Generated subject: ${generatedSubject}`);
          return generatedSubject;
        }
      } catch (aiError) {
        console.error('Error generating subject with AI:', aiError);
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
    console.error('Error extracting subject:', error);
    return 'Content Analysis';
  }
}

export async function POST(request: Request) {
  // Version identifier for deployment verification
  console.log("=== TEST GENERATOR API v1.2.1 (DEBUG BUILD) ===");
  
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.error("API ERROR: OpenAI API key is not configured");
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
    
    console.log("Starting test generation request processing...");
    let formData: TestFormData;
    
    try {
      formData = await request.json();
      console.log(`Received form data with contentUrl: ${formData.contentUrl?.substring(0, 30)}...`);
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
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
      console.error("Missing contentUrl in request");
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
        console.error('Error getting video transcript:', error);
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
          console.log('Trying direct method to get article content...');
          articleContent = await getArticleContent(url);
        } catch (directError) {
          console.error('Direct method failed, trying fallback for article content:', directError);
          
          try {
            articleContent = await getArticleContentFallback(url);
          } catch (fallbackError) {
            // Do not generate content about the URL - that's not acceptable
            console.error('All extraction methods failed, we cannot process this URL:', fallbackError);
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
        console.error('All article content methods failed:', error);
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
    console.log('Extracting subject from content...');
    try {
      extractedSubject = await extractSubject(url, contentText);
      console.log(`Extracted subject: "${extractedSubject}"`);
    } catch (subjectError) {
      console.error('Error during subject extraction:', subjectError);
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
    console.log('Generating test...');
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
      max_tokens: 2000,
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
    console.error('Error generating test:', error);
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