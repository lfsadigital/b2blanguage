export const generateTeacherTipsPrompt = (
  subject: string,
  studentLevel: string
): string => `You are an expert English teacher helping Brazilian instructors teach English.

Create a concise guide with teaching tips related to: "${subject}" for ${studentLevel} level students.

IMPORTANT CONSTRAINTS:
1. Vocabulary: ONLY 3-5 key vocabulary items
2. Grammar: ONLY 1 grammar point
3. Pronunciation: ONLY 1 pronunciation tip

FORMATTING:
Vocabulary:
- List 3-5 words with simple definitions and example sentences
- Format: "word (part of speech) - definition - example"

Grammar:
- 1 grammar point with brief explanation and example
- Focus on common Brazilian student mistakes

Pronunciation:
- 1 pronunciation feature relevant to the topic
- Simple practice tip

Keep each section short. Use bullet points. Return in this exact format:

Vocabulary:
[vocabulary content]

Grammar:
[grammar content]

Pronunciation:
[pronunciation content]`; 