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
  contentUrl: string;
  studentLevel: string;
  questionTypes: string[];
  numberOfQuestions: number;
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
      
      // Extract a subject from the transcript (first few sentences)
      const firstFewSentences = data.transcript.split(/[.!?]/).slice(0, 3).join('. ');
      let subject = 'Video Content';
      
      if (firstFewSentences.length > 10) {
        // Try to extract a cleaner subject
        subject = firstFewSentences
          .substring(0, 100)
          .replace(/\[[\d:]+\]/g, '') // Remove timestamps
          .trim();
      }
      
      // Generate the test using the transcript
      const contentInfo = `Video transcript: ${data.transcript}`;
      
      console.log("Generating test with OpenAI...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an English language teacher creating tests for business professionals."
          },
          {
            role: "user",
            content: generateTestPrompt(
              data.contentUrl,
              contentInfo,
              {
                professorName: '',
                studentName: '',
                contentUrl: data.contentUrl,
                studentLevel: data.studentLevel as StudentLevel,
                questionTypes: data.questionTypes.map(type => type as QuestionType),
                numberOfQuestions: data.numberOfQuestions,
                additionalNotes: "This test is based on a client-extracted transcript."
              },
              subject,
              new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              "This test is based on a YouTube video transcript."
            )
          }
        ],
        temperature: 0.7,
      });
      
      const result = completion.choices[0].message.content;
      
      if (!result) {
        throw new Error("Failed to generate test content");
      }
      
      // Parse the result to separate questions and answers
      const sections = parseTestSections(result);
      
      return NextResponse.json({
        test: result,
        questions: sections.questions,
        answers: sections.answers,
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

/**
 * Parse test content into sections (questions and answers)
 */
function parseTestSections(content: string) {
  // Default values
  let questions = "";
  let answers = "";
  
  // Look for "Questions:" and "Answers:" sections
  const questionsMatch = content.match(/Questions?:\s*([\s\S]*?)(?=Answers?:|$)/i);
  const answersMatch = content.match(/Answers?:\s*([\s\S]*?)(?=$)/i);
  
  if (questionsMatch && questionsMatch[1]) {
    questions = questionsMatch[1].trim();
  }
  
  if (answersMatch && answersMatch[1]) {
    answers = answersMatch[1].trim();
  }
  
  return { questions, answers };
} 