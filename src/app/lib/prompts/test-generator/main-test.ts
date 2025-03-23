import { TestFormData } from '@/app/lib/types';

export const generateTestPrompt = (
  url: string,
  contentInfo: string,
  formData: TestFormData,
  extractedSubject: string,
  today: string,
  videoInstructions: string
): string => `You are an expert English teacher creating a language proficiency test for Brazilian students. 
Your task is to create an English test based on the provided content, focusing primarily on assessing English language skills (grammar, vocabulary, comprehension) rather than subject knowledge.

Remember that this is primarily an ENGLISH TEST - use the content as material to test language skills, not to test knowledge about the subject itself.

For example, if the content is about soccer, focus on testing vocabulary used in the video/article, grammar structures, reading/listening comprehension, etc. - not on testing the student's knowledge of soccer rules or techniques.

DO NOT include any political or economic bias in your questions. Keep questions neutral and focused on language skills.

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

4. For open-ended questions:
   - Make clear what type of answer is expected (short answer, complete sentence, etc.)
   
5. After all questions, include a divider line "---" on its own line

6. After the divider, format the answer key header the same way:
   Professor: 
   Student: ${formData.studentName}
   Test about ${extractedSubject}
   Date: ${today}
   
   Answers:
   
7. For the answer section, only include the question number and the answer, not the full question
   Example: "1) B" or "2) The correct answer discusses..."
   
ENSURE that all questions focus on English language skills using the content as context, rather than testing specific knowledge about the content subject.`; 