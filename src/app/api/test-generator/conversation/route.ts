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
    
    // If subject is not provided directly, extract it from the URL
    let topicSubject = subject;
    
    if (!topicSubject && contentUrl) {
      console.log('No subject provided, attempting to extract from URL...');
      
      try {
        // Simple extraction from YouTube title or URL
        if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
          // Try to extract from URL parameters
          const urlObj = new URL(contentUrl);
          const titleParam = urlObj.searchParams.get('title');
          if (titleParam) {
            topicSubject = decodeURIComponent(titleParam).replace(/\+/g, ' ');
          } else {
            // Extract video ID and use that for now
            let videoId = '';
            if (contentUrl.includes('youtube.com/watch')) {
              videoId = urlObj.searchParams.get('v') || '';
            } else if (contentUrl.includes('youtu.be/')) {
              videoId = contentUrl.split('youtu.be/')[1].split('?')[0];
            }
            topicSubject = `English Practice with Video ${videoId}`;
          }
        } else {
          // Try to extract from article URL
          const urlParts = new URL(contentUrl).pathname.split('/');
          const lastUrlPart = urlParts[urlParts.length - 1];
          topicSubject = lastUrlPart
            .replace(/-/g, ' ')
            .replace(/\.(html|php|aspx)$/, '')
            .replace(/[0-9]/g, '')
            .trim() || 'English Practice';
        }
      } catch (error) {
        console.error('Error extracting subject from URL:', error);
        topicSubject = 'English Conversation Practice';
      }
    }

    if (!topicSubject) {
      topicSubject = 'English Conversation Practice';
    }
    
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