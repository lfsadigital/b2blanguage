import { TestFormData } from '@/app/lib/types';

export const generateTestPrompt = (
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
- Professor: ${formData.professorName}
- Student: ${formData.studentName}
- Student Level: ${formData.studentLevel}
- Question Types: ${formData.questionTypes.join(', ')}
- Number of Questions: ${formData.numberOfQuestions}
- Additional Notes: ${formData.additionalNotes}
- Test Subject: ${extractedSubject}
- Date: ${today}

${videoInstructions}

IMPORTANT FORMATTING REQUIREMENTS:

1. Format the test header as follows:
   Professor: ${formData.professorName}
   Student: ${formData.studentName}
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
   Professor: 
   Student: 
   Test about ${extractedSubject}
   Date: ${today}
   
   Answers:
   
7. For the answer section, only include the question number and the answer, not the full question
   Example: "1) B" or "2) The correct answer discusses..."
   `;