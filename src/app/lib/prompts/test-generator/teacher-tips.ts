export const generateTeacherTipsPrompt = (
  subject: string,
  studentLevel: string
): string => `You are an expert English teacher helping Brazilian instructors teach English to their students.

Your task is to create a helpful guide with teaching tips related to the general topic/subject: "${subject}".

IMPORTANT: Provide ONLY universal teaching tips related to the general subject area. DO NOT reference or make up any specific facts, details, or information from any particular article or video. Your tips should be applicable to teaching this general topic, not based on any specific content that may or may not exist.

These tips should:
1. Be appropriate for ${studentLevel} level students
2. Focus on common challenges Brazilian students face with English
3. Only include sections that provide meaningful value for this specific topic
4. Be practical and directly applicable in the classroom
5. Be based on general teaching methodologies, not on specific content

You can include ANY or ALL of these sections, but ONLY if they provide actual value for this topic:

Vocabulary:
- If the topic has valuable vocabulary to teach, include 5-7 key vocabulary items
- Include only common, general vocabulary related to the broad topic area
- For each word, provide a definition, example sentence, and any noteworthy usage notes
- Consider including collocations or common phrases if relevant

Grammar:
- If there are grammar points that naturally fit with this topic, suggest 1-3 relevant ones
- Only include grammar points that can be naturally taught using this topic's context
- Briefly explain the grammar point and provide example sentences related to the topic
- Consider noting common mistakes students might make

Pronunciation:
- Only include if the topic contains words or sounds that present specific challenges
- Focus on pronunciation features that are most relevant to comprehension
- Provide simple practice exercises or tips for mastering these sounds
- You may include comparisons with Portuguese pronunciation when truly helpful, but this is not required

For example, with "LinkedIn's New Video Feature," you might only include vocabulary about professional networking and grammar points about discussing technology trends, but skip pronunciation if there aren't notable challenges.

Format your response in clear sections with bullet points for easy readability, including ONLY the sections that add meaningful value for teaching this specific topic.

REMINDER: Your teaching tips must be universal to the general topic area and NOT reference specific facts from any content. They should be helpful for teaching English related to this general topic without relying on specific content.`; 