# YouTube Transcript API Service Setup Instructions

This guide will help you set up a custom YouTube transcript API service on your Digital Ocean droplet and integrate it with your B2B Languages application.

## Part 1: Server Setup

### Step 1: Log in to your server

Connect to your Digital Ocean droplet using SSH:

```bash
ssh root@134.199.229.165
```

Enter the password you set up when creating the droplet.

### Step 2: Copy and run the setup script

1. After logging in, create a setup script file:

```bash
nano setup.sh
```

2. Copy and paste the entire content from the `transcript-api-setup.sh` file I provided
3. Press Ctrl+X, then Y, then Enter to save
4. Make the script executable:

```bash
chmod +x setup.sh
```

5. Run the script:

```bash
./setup.sh
```

6. **IMPORTANT**: When the script completes, it will display your generated API key. Make sure to save this key - you'll need it for your application!

7. Test that your service is working by running the curl command provided at the end of the script output.

## Part 2: B2B Languages Application Integration

### Step 1: Update environment variables

Add the following to your `.env.local` file in your B2B Languages application:

```
TRANSCRIPT_API_URL=http://134.199.229.165:3000
TRANSCRIPT_API_KEY=your-generated-api-key
```

Replace `your-generated-api-key` with the key that was displayed when you ran the setup script.

### Step 2: Create a custom transcript service function

1. Open `src/app/api/test-generator/generate/route.ts`
2. Find the existing `getTranscriptWithSupadata` function
3. Replace it with this new function:

```typescript
/**
 * Get YouTube transcript using our own transcript service
 */
async function getTranscriptWithCustomService(videoId: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  try {
    console.log(`[Custom Service] Fetching transcript for video ID: ${videoId}`);
    
    // Set up timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Custom Service] Request timed out, aborting...');
      controller.abort();
    }, 30000); // Increase timeout to 30 seconds
    
    try {
      // Call our custom transcript API service
      const response = await fetch(`${process.env.TRANSCRIPT_API_URL}/api/transcript`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.TRANSCRIPT_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId }),
        signal: controller.signal
      });
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Custom Service] API Error (${response.status}): ${errorText}`);
        throw new Error(`Custom API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.transcript) {
        throw new Error('No transcript returned from custom API');
      }
      
      console.log(`[Custom Service] Successfully retrieved transcript (${data.transcript.length} chars)`);
      
      return {
        transcript: data.transcript,
        isYouTubeTranscript: true
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Custom API request timed out');
      }
      throw error;
    }
  } catch (error) {
    console.error(`[Custom Service] Error fetching transcript:`, error);
    throw error;
  }
}
```

### Step 3: Update the getVideoTranscript function

Find the `getVideoTranscript` function in the same file and modify it to use your custom service instead of Supadata:

```typescript
async function getVideoTranscript(url: string): Promise<{ transcript: string, isYouTubeTranscript: boolean }> {
  // Extract videoId from the URL
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }
  
  let customServiceError: Error | null = null;
  let directError: Error | null = null;
  
  try {
    // Method 1: Try our custom transcript service first (most reliable)
    console.log('Attempting to get transcript via custom transcript service...');
    return await getTranscriptWithCustomService(videoId);
  } catch (error) {
    console.log('Custom service failed with error:', error);
    customServiceError = error as Error;
    
    // Method 2: Try direct YouTube transcript fetch
    try {
      console.log('Attempting direct YouTube transcript fetch...');
      return await fetchYouTubeTranscriptDirect(videoId);
    } catch (ytError) {
      console.log('Direct fetch method failed with error:', ytError);
      directError = ytError as Error;
      
      // Method 3: Last resort - try to get the transcript using Whisper
      try {
        console.log('Attempting whisper method as last resort...');
        return await getVideoTranscriptWithWhisper(url);
      } catch (whisperError) {
        console.error('All transcript methods failed');
        throw new Error(`All transcript methods failed. Custom service error: ${customServiceError ? customServiceError.message : 'N/A'}, Direct method error: ${directError ? directError.message : 'N/A'}, Whisper error: ${whisperError.message}`);
      }
    }
  }
}
```

### Step 4: Update the API endpoint for transcript-first approach

If you're using the transcript-first approach in `src/app/test-generator/page.tsx`, make sure the API endpoint is updated to use your custom service:

```typescript
// If using direct transcript API endpoint, update it as well
// Look for this in the handleSubmit function in the transcript-first approach:
const transcriptResponse = await fetch('/api/test-generator/generate-from-transcript/transcript', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ videoId: data.youtubeVideoId }),
});
```

### Step 5: Deploy the changes

Commit and push your changes to GitHub:

```bash
git add .
git commit -m "Replace Supadata with custom YouTube transcript service"
git push origin stable-version
```

## Part 3: Testing and Verification

1. After your changes are deployed, test the transcript API by generating a test from a YouTube video
2. Check your server logs for any errors:
   ```bash
   ssh root@134.199.229.165
   cd /opt/transcript-api
   pm2 logs transcript-api
   ```

3. Monitor the performance to ensure the service is working correctly

## Benefits of Your Custom Service

1. **Complete Control**: You now have full control over the transcript service
2. **Cost Savings**: No more dependency on third-party services
3. **Better Reliability**: Multiple fallback methods for getting transcripts
4. **Improved Performance**: Dedicated service for your application
5. **Privacy**: All requests go through your server, not third parties

## Maintenance

- Periodically check for server updates: `apt update && apt upgrade`
- Monitor server logs: `pm2 logs transcript-api`
- Restart the service if needed: `pm2 restart transcript-api`
- Check service status: `pm2 status` 