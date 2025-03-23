import { NextResponse } from 'next/server';

/**
 * Debug proxy API that helps troubleshoot content fetching issues
 * This acts as a middle-man between the client and external URLs
 */
export async function POST(request: Request) {
  try {
    // Extract the URL to fetch from the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('[DEBUG PROXY] Failed to parse request JSON:', error);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const { url, headers = {} } = requestBody;
    
    if (!url) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
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
    let response;
    try {
      response = await fetch(url, {
        headers: fetchHeaders
      });
    } catch (fetchError) {
      console.error('[DEBUG PROXY] Fetch error:', fetchError);
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: `Fetch error: ${(fetchError as Error).message}`,
          stack: (fetchError as Error).stack
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Get response status and headers
    const status = response.status;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    console.log(`[DEBUG PROXY] Response status: ${status}`);
    console.log('[DEBUG PROXY] Response headers:', responseHeaders);
    
    // Get response body
    let text;
    try {
      text = await response.text();
    } catch (textError) {
      console.error('[DEBUG PROXY] Error reading response text:', textError);
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: `Error reading response: ${(textError as Error).message}`,
          status,
          headers: responseHeaders
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`[DEBUG PROXY] Response body length: ${text.length}`);
    
    if (text.length < 1000) {
      console.log('[DEBUG PROXY] Short response body:', text);
    } else {
      console.log('[DEBUG PROXY] Response body preview:', text.substring(0, 500) + '...');
    }
    
    // Return all the debug information
    return new NextResponse(
      JSON.stringify({
        success: true,
        url,
        status,
        headers: responseHeaders,
        bodyLength: text.length,
        bodyPreview: text.substring(0, 1000),
        body: text
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('[DEBUG PROXY] Error:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: `Error fetching content: ${(error as Error).message}`,
        stack: (error as Error).stack
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 