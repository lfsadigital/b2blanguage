import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateConversationPrompt } from '@/app/lib/prompts/test-generator/conversation';
import { logger } from '@/app/lib/utils/logger';

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// System message for conversation generation
const conversationSystemMessage = "You are an expert English teacher creating conversation starters for Brazilian students learning English. Your questions should be clear, engaging, and appropriate for the student's level.";

export async function POST(request: Request) {
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

    const { transcript, subject: providedSubject } = await request.json();
    
    if (!transcript) {
      return new NextResponse(
        JSON.stringify({ error: 'Transcript is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Use provided subject or a default
    const topicSubject = providedSubject || 'English conversation practice';
    logger.log(`Using subject: "${topicSubject}" for conversation questions`);
    
    // Generate conversation questions
    logger.log('Generating conversation questions...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: conversationSystemMessage
        },
        {
          role: "user",
          content: generateConversationPrompt(transcript, topicSubject)
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const generatedQuestions = completion.choices[0].message.content;
    
    if (!generatedQuestions) {
      throw new Error('Failed to generate conversation questions');
    }

    return new NextResponse(
      JSON.stringify({ questions: generatedQuestions }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    logger.error('Error generating conversation questions:', error);
    return new NextResponse(
      JSON.stringify({ error: `Failed to generate conversation questions: ${(error as Error).message}` }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 