import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateTranscriptTestPrompt } from '@/app/lib/prompts/test-generator/main-test';
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
      
      // Log the prompt being sent
      const promptForLog = generateTranscriptTestPrompt(
        transcript,
        data.studentLevel,
        data.questionCounts
      );
      console.log("--- PROMPT SENT TO OPENAI ---");
      console.log(promptForLog);
      console.log("-----------------------------");

      const completion = await openai.chat.completions.create({
        model: "gpt-4", 
        messages: [
          {
            role: "system",
            content: "You are an expert English teacher creating a language proficiency test based on the provided transcript."
          },
          {
            role: "user",
            content: promptForLog // Use the logged prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 3000,
      });
      
      const result = completion.choices[0].message.content;
      
      // Log the raw response from OpenAI
      console.log("--- RAW RESPONSE FROM OPENAI ---");
      console.log(result);
      console.log("------------------------------");

      if (!result) {
        throw new Error("Failed to generate test content from transcript");
      }
      
      // Parse the result to separate questions and answers
      const questions = parseQuestions(result);
      
      // Log the parsed questions
      console.log("--- PARSED QUESTIONS ---");
      console.log(JSON.stringify(questions, null, 2));
      console.log("----------------------");
      
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
function parseQuestions(testContent: string): Array<{ type: string; question: string; options?: string[]; answer?: any }> {
  const questions: Array<{ type: string; question: string; options?: string[]; answer?: any }> = [];
  let mode: 'questions' | 'answers' = 'questions';
  let currentQuestion: { type: string; question: string; options?: string[]; answer?: any } | null = null;

  const lines = testContent.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Switch to answer parsing mode on divider or "Answers:" header
    if (line === '---' || /^answers:?$/i.test(line)) {
      mode = 'answers';
      continue;
    }

    if (mode === 'questions') {
      // Parse question section: look for '1) Question text'
      const questionMatch = line.match(/^(\d+)\)\s*(.+)/);
      if (questionMatch) {
        // Save previous question
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        const questionText = questionMatch[2];
        // Determine type based on keywords (multiple choice implied by options later)
        let type = 'open-ended';
        if (/true or false|\(true\/false\)/i.test(questionText)) {
          type = 'true-false';
        }
        currentQuestion = {
          type,
          question: questionText,
          options: type === 'multiple-choice' ? [] : undefined,
          answer: undefined
        };
        continue;
      }
      // Parse multiple-choice options (e.g., 'A) Option text')
      if (currentQuestion && /^[A-D]\)/.test(line)) {
        // Ensure options array exists before pushing (Copied from generate/route.ts fix)
        if (!currentQuestion.options) {
          currentQuestion.options = [];
          currentQuestion.type = 'multiple-choice'; 
        }
        currentQuestion.options!.push(line.replace(/^[A-D]\)\s*/, ''));
      }
    } else {
      // Parse answers section
      // Multiple choice answers: '1) B'
      const mcMatch = line.match(/^(\d+)\)\s*([A-D])/i);
      if (mcMatch) {
        const idx = parseInt(mcMatch[1], 10) - 1;
        const ans = mcMatch[2].toUpperCase();
        if (questions[idx]) {
          questions[idx].answer = ans.toLowerCase();
        }
        continue;
      }
      // True/False answers: '9) True'
      const tfMatch = line.match(/^(\d+)\)\s*(true|false)/i);
      if (tfMatch) {
        const idx = parseInt(tfMatch[1], 10) - 1;
        const ans = tfMatch[2].toLowerCase() === 'true';
        if (questions[idx]) {
          questions[idx].answer = ans;
        }
      }
      // Note: Open-ended answers are not explicitly parsed here based on the latest prompt instructions
      // The prompt asks for brief open-ended answers in the answer key, but this parser focuses on MC/TF.
      // If open-ended answers need parsing, this section might need adjustments.
    }
  }

  // Add last question if we were still in questions mode
  if (currentQuestion && mode === 'questions') {
    questions.push(currentQuestion);
  }
  return questions;
} 