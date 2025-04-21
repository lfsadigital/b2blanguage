export const generateTeacherTipsPrompt = (
  subject: string,
  studentLevel: string
): string => `You are an expert English teacher helping Brazilian instructors teach English.

Create a concise guide with teaching tips related to: "${subject}" for a ${studentLevel} level students.

IMPORTANT:
1. Vocabulary: List up to 30 words (min of 15) with that a student with this level would find challenging and that are relevant to the topic.
2. Grammar: Up to 1 grammar point with brief explanation and example that a student with this level would find challenging and that are relevant to the topic.
3. Pronunciation: Up to 1 simple pronunciation practice tip that a student with this level would find challenging and that are relevant to the topic.

FORMATTING:
Vocabulary:
Subheader: "word" - word in pt-br - definition in English - example sentence using the word

Keep each section short. Use bullet points. Return in this exact format:

Vocabulary:
[vocabulary content]

Grammar:
[grammar content]

Pronunciation:
[pronunciation content]`; 