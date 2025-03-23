import { NextResponse } from 'next/server';

/**
 * Debug proxy API that helps troubleshoot content fetching issues
 * This acts as a middle-man between the client and external URLs
 */
export async function POST(request: Request) {
  try {
    // Extract the URL to fetch from the request body
    const { url, headers = {} } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    console.log(`[DEBUG PROXY] Fetching content from: ${url}`);
    
    // Prepare headers - use the provided headers and add some defaults
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      ...headers
    };
    
    console.log('[DEBUG PROXY] Using headers:', fetchHeaders);
    
    // Make the request
    const response = await fetch(url, {
      headers: fetchHeaders
    });
    
    // Get response status and headers
    const status = response.status;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    console.log(`[DEBUG PROXY] Response status: ${status}`);
    console.log('[DEBUG PROXY] Response headers:', responseHeaders);
    
    // Get response body
    const text = await response.text();
    console.log(`[DEBUG PROXY] Response body length: ${text.length}`);
    
    if (text.length < 1000) {
      console.log('[DEBUG PROXY] Short response body:', text);
    } else {
      console.log('[DEBUG PROXY] Response body preview:', text.substring(0, 500) + '...');
    }
    
    // Return all the debug information
    return NextResponse.json({
      success: true,
      url,
      status,
      headers: responseHeaders,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 1000),
      body: text
    });
    
  } catch (error) {
    console.error('[DEBUG PROXY] Error:', error);
    return NextResponse.json({
      success: false,
      error: `Error fetching content: ${(error as Error).message}`,
      stack: (error as Error).stack
    }, { status: 500 });
  }
} 