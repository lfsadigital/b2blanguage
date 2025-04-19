import { TestFormData } from '@/app/lib/types';

export function generateTestPrompt(
  content: string,
  studentLevel: string,
  questionCounts: {
    'multiple-choice': number;
    'open-ended': number;
    'true-false': number;
  }
): string {
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  
  return `Create an English test based on the following content. The test should be appropriate for a ${studentLevel.toLowerCase()} level student.

Content:
${content}

Please generate exactly:
- ${questionCounts['multiple-choice']} multiple choice questions
- ${questionCounts['open-ended']} open-ended questions
- ${questionCounts['true-false']} true/false questions

Total questions: ${totalQuestions}

Please arrange the questions in order: first all Multiple Choice, then Open Ended, and finally True/False.

Format each question type as follows:

Multiple Choice:
Q1. [Question text]
a) [Option]
b) [Option]
c) [Option]
d) [Option]
Answer: [Correct option letter]

Open Ended:
Q1. [Question text]
Sample Answer: [Expected answer or key points]

True/False:
Q1. [Statement]
Answer: [True/False]

Make sure the questions:
1. Test comprehension of the content
2. Are appropriate for the ${studentLevel.toLowerCase()} level
3. Have clear and unambiguous answers
4. Are grammatically correct
5. Follow the exact format specified above
6. Use the exact phrase 'according to the transcript' at most once; for other questions use varied phrasing such as 'based on the content' or 'from the material provided'.
7. Vary the correct multiple choice answer positions across A–D (do not always use A).
8. For true/false questions, mix True and False answers so they are not always True.

Return ONLY the questions and answers, formatted exactly as shown above.`;
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