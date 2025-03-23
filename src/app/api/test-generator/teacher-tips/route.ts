import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateTeacherTipsPrompt } from '@/app/lib/prompts/test-generator/teacher-tips';

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const { contentUrl, subject, studentLevel } = await request.json();

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    const prompt = generateTeacherTipsPrompt(subject, studentLevel);

    console.log('Generating teacher tips...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert English teacher creating practical teaching resources for Brazilian instructors. Focus only on aspects that provide meaningful value for the specific topic - don't include sections that wouldn't add significant teaching value."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const teacherTips = completion.choices[0].message.content;
    
    if (!teacherTips) {
      throw new Error('Failed to generate teacher tips');
    }

    return NextResponse.json({ 
      teacherTips
    });
  } catch (error) {
    console.error('Error generating teacher tips:', error);
    return NextResponse.json(
      { error: `Failed to generate teacher tips: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 