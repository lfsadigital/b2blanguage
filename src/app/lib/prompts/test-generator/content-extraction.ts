/**
 * Prompt for extracting article content as a fallback method
 * Used when direct HTML extraction fails
 */
export const generateContentExtractionPrompt = (url: string): string => `Extract the main article content from this URL: ${url}

VERY IMPORTANT: 
1. If you cannot access the actual content, respond ONLY with: "CANNOT_ACCESS_CONTENT"
2. DO NOT generate or make up ANY content
3. Only return the extracted content if you can actually access it
4. No introduction or explanation - only return the extracted content itself`;

/**
 * System message to pair with the content extraction prompt
 */
export const contentExtractionSystemMessage = `You are a precise content extractor that only extracts real content from web URLs. You MUST NEVER invent or make up content. If you cannot access the real content, clearly state that you cannot extract it rather than generating anything.`; 