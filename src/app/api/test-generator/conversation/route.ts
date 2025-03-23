import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateConversationPrompt } from '@/app/lib/prompts/test-generator/conversation';

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

    const prompt = generateConversationPrompt(subject, studentLevel);

    console.log('Generating conversation questions...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert English teacher creating conversation starters for Brazilian students learning English. Your questions should be clear, engaging, and appropriate for the student's level."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const conversationQuestions = completion.choices[0].message.content;
    
    if (!conversationQuestions) {
      throw new Error('Failed to generate conversation questions');
    }

    return NextResponse.json({ 
      conversationQuestions
    });
  } catch (error) {
    console.error('Error generating conversation questions:', error);
    return NextResponse.json(
      { error: `Failed to generate conversation questions: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 