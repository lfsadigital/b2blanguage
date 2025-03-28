export const generateSubjectExtractionPrompt = (
  content: string
): string => `
Generate a concise subject title (3-7 words) for an English test based on this content. 
The subject should be short, direct, and reflect the main topic but be suitable for an English language test.
Rules to follow:
1. Do NOT use phrases like "Based on" or "Analysis of" - just provide the direct subject.
2. Do NOT use commas, colons, or semicolons in the title.
3. Do NOT begin with articles (the, a, an) or question words (how, what, why, when).
4. Do NOT include "about", "regarding", or similar context words.
5. Keep it simple and noun-focused when possible.

Example good titles:
- Six Figure Business Without Software Costs
- AI System for Task Automation
- YouTube Marketing Strategies
- Email Extraction Techniques

Content: ${content.substring(0, 1500)}
`; 