export const generateConversationPrompt = (
  subject: string,
  studentLevel: string
): string => `You are an expert English teacher helping Brazilian students practice their conversational skills.

Your task is to create 3-5 open-ended questions that a teacher can use to spark conversation with students at the beginning of a class.

These questions should:
1. Relate to the general subject/topic: "${subject}"
2. Be appropriate for ${studentLevel} level students
3. Encourage students to express opinions, share experiences, or discuss preferences
4. Not require specific knowledge of the content, just general knowledge of the topic area
5. Be engaging and thought-provoking
6. Focus on building speaking confidence and fluency

Examples of good conversation starters on the topic of "LinkedIn's New Video Feature":
- Do you use LinkedIn? What do you primarily use it for?
- How much time do you spend on social media platforms per day?
- What are your favorite social media platforms and why?
- Do you think professional and personal social media should be kept separate?
- How has social media changed professional networking in your opinion?

Please provide ONLY the questions, numbered 1-5, with no additional text, explanations, or headers.`; 