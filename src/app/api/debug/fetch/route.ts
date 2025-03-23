import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Debug API endpoint to test different content fetching approaches
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    console.log(`[DEBUG FETCH] Testing fetch methods for URL: ${url}`);
    
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      url,
      methods: {}
    };
    
    // Method 1: Direct fetch with default options
    try {
      console.log('[DEBUG FETCH] Method 1: Direct fetch with default options');
      const start = Date.now();
      const response = await fetch(url);
      const responseTime = Date.now() - start;
      
      const status = response.status;
      const html = await response.text();
      
      results.methods.direct = {
        success: true,
        status,
        responseTime,
        contentLength: html.length,
        preview: html.substring(0, 200)
      };
    } catch (error) {
      results.methods.direct = {
        success: false,
        error: (error as Error).message,
        stack: (error as Error).stack
      };
    }
    
    // Method 2: Fetch with browser-like headers
    try {
      console.log('[DEBUG FETCH] Method 2: Fetch with browser-like headers');
      const start = Date.now();
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });
      const responseTime = Date.now() - start;
      
      const status = response.status;
      const html = await response.text();
      
      results.methods.browserLike = {
        success: true,
        status,
        responseTime,
        contentLength: html.length,
        preview: html.substring(0, 200)
      };
    } catch (error) {
      results.methods.browserLike = {
        success: false,
        error: (error as Error).message,
        stack: (error as Error).stack
      };
    }
    
    // Method 3: Using OpenAI as a proxy (if available)
    if (openai) {
      try {
        console.log('[DEBUG FETCH] Method 3: Using OpenAI as a proxy');
        const start = Date.now();
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that extracts the main content from article URLs."
            },
            {
              role: "user",
              content: `Visit this URL: ${url} and extract the main article content. Just return the extracted content without any introduction or explanation.`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });
        
        const responseTime = Date.now() - start;
        const extractedContent = completion.choices[0].message.content?.trim() || '';
        
        results.methods.openai = {
          success: true,
          responseTime,
          contentLength: extractedContent.length,
          preview: extractedContent.substring(0, 200)
        };
      } catch (error) {
        results.methods.openai = {
          success: false,
          error: (error as Error).message
        };
      }
    } else {
      results.methods.openai = {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }
    
    // Method 4: Analyze domain and URL structure
    try {
      console.log('[DEBUG FETCH] Method 4: URL and domain analysis');
      const urlObj = new URL(url);
      
      results.methods.urlAnalysis = {
        success: true,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash
      };
    } catch (error) {
      results.methods.urlAnalysis = {
        success: false,
        error: (error as Error).message
      };
    }
    
    console.log('[DEBUG FETCH] Test completed, returning results');
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('[DEBUG FETCH] Error in debug fetch API:', error);
    return NextResponse.json({
      success: false,
      error: `Error in debug fetch API: ${(error as Error).message}`,
      stack: (error as Error).stack
    }, { status: 500 });
  }
} 