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
    
    // IMPORTANT: We should ONLY proceed if we have a valid subject from the main content extraction
    // This ensures we don't generate content based solely on URLs when content extraction failed
    if (!subject) {
      console.error('No valid subject provided - this indicates content extraction failed');
      return NextResponse.json(
        { error: "Cannot generate conversation questions without valid content extraction" },
        { status: 400 }
      );
    }
    
    // Use the subject that was provided from the successful content extraction
    const topicSubject = subject;
    
    console.log(`Using subject: "${topicSubject}" for conversation questions`);

    const prompt = generateConversationPrompt(topicSubject, studentLevel);

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