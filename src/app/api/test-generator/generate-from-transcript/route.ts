import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateTestPrompt } from '@/app/lib/prompts/test-generator/main-test';
import { StudentLevel, QuestionType } from '@/app/lib/types';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface TranscriptRequest {
  transcript: string;
  contentUrl?: string;
  teacherName?: string;
  studentName?: string;
  studentLevel: StudentLevel;
  questionCounts: {
    'multiple-choice': number;
    'open-ended': number;
    'true-false': number;
  };
}

export async function POST(request: Request) {
  console.log("=== TRANSCRIPT-BASED TEST GENERATOR API ===");
  
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.error("API ERROR: OpenAI API key is not configured");
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }
    
    console.log("Processing transcript-based test generation request...");
    
    try {
      const data = await request.json() as TranscriptRequest;
      console.log(`Received transcript length: ${data.transcript.length} characters`);
      
      if (!data.transcript || data.transcript.length < 100) {
        return NextResponse.json(
          { error: "Transcript is too short or empty" },
          { status: 400 }
        );
      }
      
      // Limit transcript size to reduce processing time
      const MAX_TRANSCRIPT_LENGTH = 10000;
      const transcript = data.transcript.length > MAX_TRANSCRIPT_LENGTH 
        ? data.transcript.substring(0, MAX_TRANSCRIPT_LENGTH) + "... [transcript truncated for processing]"
        : data.transcript;
      
      // AI-based subject extraction from transcript
      let subject = 'Video Transcript Content';
      if (openai) {
        try {
          const subResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'Create a brief, descriptive title (3-7 words) for this transcript.' },
              { role: 'user', content: transcript }
            ],
            temperature: 0.3,
            max_tokens: 10
          });
          const generatedTitle = subResponse.choices[0].message.content?.trim();
          if (generatedTitle) subject = generatedTitle;
        } catch (e) {
          console.error('Subject extraction error:', e);
        }
      }
      
      console.log("Generating test with OpenAI...");
      
      // Prepare arguments for the detailed generateTestPrompt function
      const today = new Date().toLocaleDateString();
      const formDataForPrompt = {
        professorName: data.teacherName || 'Teacher',
        studentName: data.studentName || 'Student',
        professorId: '', // Not available in this request
        studentId: '',   // Not available in this request
        contentUrl: data.contentUrl || '', // Use contentUrl if provided
        additionalNotes: '', // Not available in this request
        useTranscriptApproach: true, // Explicitly set for this route
        youtubeVideoId: '' // Not directly used by prompt, but required by type
      };
      const urlForPrompt = data.contentUrl || 'Transcript Source';
      const contentInfoForPrompt = 'Transcript provided directly.'; // Placeholder
      const videoInstructionsForPrompt = ''; // No video instructions for transcript

      const completion = await openai.chat.completions.create({
        model: "gpt-4", 
        messages: [
          {
            role: "system",
            content: "You are an English language teacher creating tests..."
          },
          {
            role: "user",
            content: generateTestPrompt(
              transcript,
              data.studentLevel,
              data.questionCounts,
              formDataForPrompt,
              urlForPrompt,
              contentInfoForPrompt,
              subject,
              today,
              videoInstructionsForPrompt
            )
          }
        ],
        temperature: 0.6,
        max_tokens: 3000,
      });
      
      const result = completion.choices[0].message.content;
      
      if (!result) {
        throw new Error("Failed to generate test content from transcript");
      }
      
      // Parse the result to separate questions and answers
      const questions = parseQuestions(result);
      
      return NextResponse.json({
        testContent: result, // Return the raw content as well
        questions,
        subject
      });
      
    } catch (parseError) {
      console.error("Failed to parse request or generate test:", parseError);
      return NextResponse.json(
        { error: `Invalid request data or generation error: ${(parseError as Error).message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in transcript-based test generation:", error);
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Update the parseQuestions function to match the one in the main generate route
function parseQuestions(testContent: string) {
  const questions = [];
  let currentType = '';
  let currentQuestion: any = {};

  const lines = testContent.split('\n').filter(line => line.trim());

  for (let line of lines) {
    line = line.trim();

    // Detect question type headers
    if (line.toLowerCase().startsWith('multiple choice:')) {
      currentType = 'multiple-choice';
      continue;
    } else if (line.toLowerCase().startsWith('open ended:')) {
      currentType = 'open-ended';
      continue;
    } else if (line.toLowerCase().startsWith('true/false:')) {
      currentType = 'true-false';
      continue;
    }

    // Parse question line
    if (line.match(/^Q\d+\./)) {
      if (currentQuestion.question) {
        questions.push(currentQuestion); // Save the previous question
      }
      currentQuestion = {
        type: currentType,
        question: line.replace(/^Q\d+\./, '').trim(),
        options: currentType === 'multiple-choice' ? [] : undefined,
        answer: undefined
      };
    } 
    // Parse multiple choice options
    else if (currentType === 'multiple-choice' && line.match(/^[a-d]\)/)) {
      if (!currentQuestion.options) currentQuestion.options = [];
      currentQuestion.options.push(line.replace(/^[a-d]\)/, '').trim());
    } 
    // Parse answer line
    else if (line.startsWith('Answer:')) {
      const answerText = line.replace('Answer:', '').trim();
      if (currentType === 'multiple-choice') {
        currentQuestion.answer = answerText.charAt(0).toLowerCase(); // Store only the letter
      } else if (currentType === 'true-false') {
        currentQuestion.answer = answerText.toLowerCase() === 'true'; // Store boolean
      } else {
        currentQuestion.answer = answerText; // Store the full text for open-ended
      }
      questions.push(currentQuestion);
      currentQuestion = {}; // Reset for the next question
    } 
    // Parse sample answer line (for open-ended)
    else if (line.startsWith('Sample Answer:')) {
      currentQuestion.answer = line.replace('Sample Answer:', '').trim();
      questions.push(currentQuestion);
      currentQuestion = {}; // Reset for the next question
    }
  }

  // Add the last parsed question if it exists
  if (currentQuestion.question) {
    questions.push(currentQuestion);
  }

  return questions;
} 