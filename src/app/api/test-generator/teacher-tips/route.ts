import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateTeacherTipsPrompt } from '@/app/lib/prompts/test-generator/teacher-tips';

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Define default teacher tips for fallback
const DEFAULT_TEACHER_TIPS = `Vocabulary:
1. Extract (verb) - to remove or take out something from a source - "The software can extract data from websites."
2. Automation (noun) - the use of technology to perform tasks with minimal human intervention - "Email automation saves time."
3. Process (noun) - a series of actions taken to achieve a particular result - "The email extraction process is simple."
4. Generate (verb) - to produce or create - "This tool generates leads from Google searches."
5. Implement (verb) - to put a plan or system into action - "Many businesses implement email marketing strategies."

Grammar:
Present Simple Tense for describing processes - Use present simple to describe how technology works or processes function. Example: "The tool extracts emails automatically" not "The tool is extracting emails automatically."

Pronunciation:
Focus on word stress in technology terminology. In 'automation' (au-to-MA-tion), the stress falls on the third syllable. Have students practice by clapping on the stressed syllable while saying tech-related words.`;

export async function POST(request: Request) {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.log('OpenAI API key not configured, returning default teaching tips');
      return NextResponse.json({ teacherTips: DEFAULT_TEACHER_TIPS }, { status: 200 });
    }

    const { contentUrl, subject, studentLevel } = await request.json();
    
    // IMPORTANT: We should ONLY proceed if we have a valid subject from the main content extraction
    // This ensures we don't generate content based solely on URLs when content extraction failed
    if (!subject) {
      console.error('No valid subject provided - this indicates content extraction failed');
      return NextResponse.json({ teacherTips: DEFAULT_TEACHER_TIPS }, { status: 200 });
    }
    
    // Use the subject that was provided from the successful content extraction
    const topicSubject = subject;
    
    console.log(`Using subject: "${topicSubject}" for teacher tips`);

    const prompt = generateTeacherTipsPrompt(topicSubject, studentLevel);

    // Set a timeout to make sure we don't exceed Vercel's function limit
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Teacher tips generation timed out')), 8000);
    });

    try {
      console.log('Generating teacher tips...');
      // Race the OpenAI call against the timeout
      const completionPromise = openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert English teacher creating concise teaching resources for Brazilian instructors. Be brief and focused."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 700,
      });
      
      // Use Promise.race to implement timeout
      const completion = await Promise.race([completionPromise, timeoutPromise]) as any;
      const teacherTips = completion.choices[0].message.content;
      
      if (!teacherTips) {
        throw new Error('Empty response from OpenAI');
      }

      return NextResponse.json({ teacherTips });
    } catch (timeoutError) {
      console.error('Teacher tips generation timed out or failed:', timeoutError);
      return NextResponse.json({ teacherTips: DEFAULT_TEACHER_TIPS }, { status: 200 });
    }
  } catch (error) {
    console.error('Error generating teacher tips:', error);
    // Return default tips instead of an error
    return NextResponse.json({ teacherTips: DEFAULT_TEACHER_TIPS }, { status: 200 });
  }
} 