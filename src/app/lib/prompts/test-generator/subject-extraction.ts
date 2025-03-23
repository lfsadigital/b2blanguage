export const generateSubjectExtractionPrompt = (
  content: string
): string => `
Generate a concise subject title (5-10 words) for an English test based on this content. 
The subject should reflect the main topic but be suitable for an English language test.
Don't use phrases like "Based on" or "Analysis of" - just provide the direct subject.

Content: ${content.substring(0, 1500)}
`; 