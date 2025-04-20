import { TestFormData, QuestionType, StudentLevel } from '@/app/lib/types';

// This function now uses the older, more detailed prompt structure
export function generateTestPrompt(
  content: string,
  studentLevel: StudentLevel,
  questionCounts: { [key in QuestionType]: number },
  formData: Omit<TestFormData, 'questionCounts' | 'studentLevel'>,
  url: string,
  contentInfo: string,
  extractedSubject: string,
  today: string,
  videoInstructions: string
): string {
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  
  // Construct the question counts string dynamically
  const questionCountsString = Object.entries(questionCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `- ${count} ${type.replace('-', ' ')} questions`)
    .join('\n');

  // The restored detailed prompt template
  return `You are an expert English teacher creating a language proficiency test for Brazilian students. 
Your task is to create an English test (with questions and answers) based ONLY on the provided content, focusing primarily on assessing English language skills (grammar, vocabulary, comprehension) rather than subject knowledge.

DO NOT make up or invent any facts, information, or data that is not present in the content. Stick strictly to what's in the provided text.

Remember that this is primarily an ENGLISH TEST - use the content as material to test language skills, not to test deep knowledge about the subject itself.

For example, if the content is about soccer, focus on testing vocabulary used in the video/article, grammar structures, reading/listening comprehension, etc. - not on testing the student's knowledge of soccer rules or techniques.

At least one question should be directly based on a small excerpt (no longer than three paragraphs) from the content, asking students to interpret, summarize, or identify key information from it. However, avoid simply copying large portions of the text
as part of the question—focus on testing understanding rather than memorization. 

Make sure to vary the wording when crating the questions (for instance, don't repreat 'according to the content xxx' in 2+ questions).

For multiple choice questions, make sure to vary the answers (A, B, C, D and not always the same letter as the correct answer). Same for true/false questions.

If you do not receive content to use it for the test, do not create the test. You are not to make up any information, nor any input.
Content URL: ${url}
${contentInfo}

Test information:
- Professor: ${formData.professorName || 'Not specified'}
- Student: ${formData.studentName || 'Not specified'}
- Student Level: ${studentLevel || 'Intermediate'}
Please generate exactly:
${questionCountsString}
- Total questions: ${totalQuestions} (IMPORTANT: You MUST create EXACTLY this total number of questions, respecting the counts per type)
- Additional Notes: ${formData.additionalNotes || 'None'}
- Test Subject: ${extractedSubject}
- Date: ${today}

${videoInstructions}

IMPORTANT FORMATTING REQUIREMENTS:

1. Format the test header as follows:
   Professor: ${formData.professorName || 'Not specified'}
   Student: ${formData.studentName || 'Not specified'}
   Test about ${extractedSubject}
   Date: ${today}
   
   Questions:
   
2. Number questions using the format "1)" rather than "1."

3. For multiple choice questions:
   - Provide options as A), B), C), and D)
   - Only provide one correct answer
   - Include an appropriate reference timestamp for video content when possible

4. For open-ended questions:
   - Make clear what type of answer is expected (short answer, complete sentence, etc.)
   
5. After all questions, include a divider line "---" on its own line

6. After the divider, format the answer key header the same way:
   Professor: ${formData.professorName || 'Not specified'}
   Student: ${formData.studentName || 'Not specified'}
   Test about ${extractedSubject}
   Date: ${today}
   
   Answers:
   
7. For the answer section:
   - For multiple-choice questions: Only include the question number and the letter answer (e.g., "1) B")
   - For true/false questions: Only include the question number and "True" or "False" (e.g., "7) True")
   - For open-ended questions: Include a VERY brief answer of MAXIMUM 1 sentence (e.g., "3) Key characteristics of effective communication")
   
8. DO NOT include phrases like "This is an open-ended question about..." in your answers. Keep answers direct and concise.
   `;
}

// New prompt function specifically for pre-processed transcripts
export function generateTranscriptTestPrompt(
  transcript: string,
  studentLevel: StudentLevel,
  questionCounts: { [key in QuestionType]: number }
): string {
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  
  const questionCountsString = Object.entries(questionCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `- ${count} ${type.replace('-', ' ')} questions`)
    .join('\n');

  // Simplified prompt focusing only on the provided transcript
  // Using basic student/teacher names as placeholders since full formData isn't available
  const today = new Date().toLocaleDateString();
  const subject = 'Video Transcript Content'; // Generic subject

  return `You are an expert English teacher creating a language proficiency test for Brazilian students. 
Your task is to create an English test (with questions and answers) based ONLY on the provided TRANSCRIPT CONTENT below, focusing primarily on assessing English language skills (grammar, vocabulary, comprehension).

TRANSCRIPT CONTENT:
${transcript}

DO NOT make up or invent any facts, information, or data that is not present in the transcript.
Remember that this is primarily an ENGLISH TEST - use the transcript as material to test language skills.
At least one question should be directly based on a small excerpt from the transcript.
Make sure to vary the wording when creating the questions.
For multiple choice questions, make sure to vary the answers (A, B, C, D).

Test information:
- Professor: Teacher
- Student: Student
- Student Level: ${studentLevel || 'Intermediate'}
Please generate exactly:
${questionCountsString}
- Total questions: ${totalQuestions} (IMPORTANT: You MUST create EXACTLY this total number of questions, respecting the counts per type)
- Test Subject: ${subject}
- Date: ${today}

IMPORTANT FORMATTING REQUIREMENTS:

1. Format the test header as follows:
   Professor: Teacher
   Student: Student
   Test about ${subject}
   Date: ${today}
   
   Questions:
   
2. Number questions using the format "1)" rather than "1."

3. For multiple choice questions:
   - Provide options as A), B), C), and D)
   - Only provide one correct answer
   - Include an appropriate reference timestamp (e.g., [1:23]) if present in the transcript content before the question.

4. For open-ended questions:
   - Make clear what type of answer is expected (short answer, complete sentence, etc.)
   
5. After all questions, include a divider line "---" on its own line

6. After the divider, format the answer key header the same way:
   Professor: Teacher
   Student: Student
   Test about ${subject}
   Date: ${today}
   
   Answers:
   
7. For the answer section:
   - For multiple-choice questions: Only include the question number and the letter answer (e.g., "1) B")
   - For true/false questions: Only include the question number and "True" or "False" (e.g., "7) True")
   - For open-ended questions: Include a VERY brief answer of MAXIMUM 1 sentence.
   
8. DO NOT include phrases like "This is an open-ended question about..." in your answers. Keep answers direct and concise.
   `;
}

// Remove the old prompt function as it's no longer used and causes type errors
/*
export const generateTestPromptOld = (
  url: string,
  contentInfo: string,
  formData: TestFormData,
  extractedSubject: string,
  today: string,
  videoInstructions: string
): string => `You are an expert English teacher creating a language proficiency test for Brazilian students. 
Your task is to create an English test based ONLY on the provided content, focusing primarily on assessing English language skills (grammar, vocabulary, comprehension) rather than subject knowledge.

DO NOT make up or invent any facts, information, or data that is not present in the content. Stick strictly to what's in the provided text.

Remember that this is primarily an ENGLISH TEST - use the content as material to test language skills, not to test knowledge about the subject itself.

For example, if the content is about soccer, focus on testing vocabulary used in the video/article, grammar structures, reading/listening comprehension, etc. - not on testing the student's knowledge of soccer rules or techniques.

DO NOT include any political or economic bias in your questions. Keep questions neutral and focused on language skills.

At least one question should be directly based on a small excerpt (no longer than three paragraphs) from the content, asking students to interpret, summarize, or identify key information from it. However, avoid simply copying large portions of the text
as part of the question—focus on testing understanding rather than memorization.
If you do not receive content to use it for the test, do not create the test. You are not to make up any information, nor any input.
Content URL: ${url}
${contentInfo}

Test information:
- Professor: ${formData.professorName || 'Not specified'}
- Student: ${formData.studentName || 'Not specified'}
- Student Level: ${formData.studentLevel || 'Intermediate'}
- Question Types: ${formData.questionTypes ? formData.questionTypes.join(', ') : 'multiple-choice, open-ended'}
- Number of Questions: ${formData.numberOfQuestions || 5} (IMPORTANT: You MUST create EXACTLY this number of questions, no more, no less)
- Additional Notes: ${formData.additionalNotes || 'None'}
- Test Subject: ${extractedSubject}
- Date: ${today}

${videoInstructions}

IMPORTANT FORMATTING REQUIREMENTS:

1. Format the test header as follows:
   Professor: ${formData.professorName || 'Not specified'}
   Student: ${formData.studentName || 'Not specified'}
   Test about ${extractedSubject}
   Date: ${today}
   
   Questions:
   
2. Number questions using the format "1)" rather than "1."

3. For multiple choice questions:
   - Provide options as A), B), C), and D)
   - Only provide one correct answer
   - Include an appropriate reference timestamp for video content when possible

4. For open-ended questions:
   - Make clear what type of answer is expected (short answer, complete sentence, etc.)
   
5. After all questions, include a divider line "---" on its own line

6. After the divider, format the answer key header the same way:
   Professor: ${formData.professorName || 'Not specified'}
   Student: ${formData.studentName || 'Not specified'}
   Test about ${extractedSubject}
   Date: ${today}
   
   Answers:
   
7. For the answer section:
   - For multiple-choice questions: Only include the question number and the letter answer (e.g., "1) B")
   - For true/false questions: Only include the question number and "True" or "False" (e.g., "7) True")
   - For open-ended questions: Include a VERY brief answer of MAXIMUM 8 WORDS (e.g., "3) Key characteristics of effective communication")
   
8. DO NOT include phrases like "This is an open-ended question about..." in your answers. Keep answers direct and concise.
   `;
*/