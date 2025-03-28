#!/bin/bash
# YouTube Transcript API Service Setup Script
# For Digital Ocean Droplet (Ubuntu)
# IP Address: 134.199.229.165

# Generate a secure API key
API_KEY=$(openssl rand -hex 16)
echo "Your generated API key: $API_KEY"
echo "SAVE THIS KEY - you'll need it for your application!"
echo ""

# Update system and install dependencies
echo "Updating system packages..."
apt update
apt upgrade -y

echo "Installing Node.js, npm and other required packages..."
apt install -y nodejs npm git curl

# Check versions
echo "Checking Node.js and npm versions..."
node -v
npm -v

# Install PM2 for process management
echo "Installing PM2 for process management..."
npm install -g pm2

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/transcript-api
cd /opt/transcript-api

# Initialize Node.js project
echo "Initializing Node.js project..."
npm init -y

# Install required packages
echo "Installing required npm packages..."
npm install express cors axios dotenv helmet rate-limiter-flexible

# Create server.js file
echo "Creating main server application file..."
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'change-me-to-secure-key';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://b2blanguage.vercel.app'];

// Set up rate limiting (100 requests per 15 minutes per IP)
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 15 * 60,
});

// Middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON bodies

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'GET']
}));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    const clientIp = req.ip;
    await rateLimiter.consume(clientIp);
    next();
  } catch (error) {
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

// API key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }
  next();
};

// Helper function to extract YouTube video ID
const extractVideoId = (url) => {
  const videoIdRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(videoIdRegex);
  return match ? match[1] : null;
};

// Function to get transcript using multiple approaches
async function getTranscript(videoId) {
  try {
    console.log(`Attempting method 1 for video ID: ${videoId}`);
    // Method 1: youtubetranscript.com API
    const response = await axios.get(`https://youtubetranscript.com/?server_vid=${videoId}`, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (response.data && response.data.length > 0) {
      // Format the transcript with timestamps
      console.log('Method 1 successful');
      return response.data.map(item => 
        `[${Math.floor(item.offset/60)}:${(item.offset % 60).toString().padStart(2, '0')}] ${item.text}`
      ).join(' ');
    }
    
    throw new Error('No transcript found with method 1');
  } catch (error) {
    console.log('Method 1 failed, trying method 2');
    // Fallback to method 2
    try {
      // Method 2: Using alternative API
      const secondResponse = await axios.get(`https://yt-subtitle.herokuapp.com/api/youtube-subtitle?v=${videoId}`, {
        timeout: 8000
      });
      
      if (secondResponse.data && secondResponse.data.subtitles && secondResponse.data.subtitles.length > 0) {
        console.log('Method 2 successful');
        return secondResponse.data.subtitles.map(item => 
          `[${Math.floor(item.start/60)}:${(item.start % 60).toString().padStart(2, '0')}] ${item.text}`
        ).join(' ');
      }
      
      throw new Error('No transcript found with method 2');
    } catch (secondError) {
      console.log('Method 2 failed, trying method 3');
      // Try method 3 as last resort
      try {
        // Method 3: Another alternative API
        const thirdResponse = await axios.get(`https://youtube-transcriptor.vercel.app/api?id=${videoId}`, {
          timeout: 8000
        });
        
        if (thirdResponse.data && thirdResponse.data.transcript) {
          console.log('Method 3 successful');
          
          // Format might be different, handle accordingly
          if (Array.isArray(thirdResponse.data.transcript)) {
            return thirdResponse.data.transcript.map(item => 
              `[${Math.floor(item.start/60)}:${(item.start % 60).toString().padStart(2, '0')}] ${item.text}`
            ).join(' ');
          }
          
          return thirdResponse.data.transcript;
        }
        
        throw new Error('No transcript found with method 3');
      } catch (thirdError) {
        console.error('All transcript methods failed:', thirdError.message);
        throw new Error('Failed to get transcript from all available methods');
      }
    }
  }
}

// Transcript endpoint
app.post('/api/transcript', validateApiKey, async (req, res) => {
  try {
    const { url, videoId: directVideoId } = req.body;
    
    if (!url && !directVideoId) {
      return res.status(400).json({ error: 'Either URL or videoId is required' });
    }
    
    // Extract video ID from URL or use provided ID
    const videoId = directVideoId || extractVideoId(url);
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL or video ID' });
    }
    
    console.log(`Fetching transcript for video ID: ${videoId}`);
    
    // Get transcript
    const transcript = await getTranscript(videoId);
    
    if (!transcript || transcript.length < 50) {
      return res.status(404).json({
        error: 'No usable transcript found for this video',
        success: false
      });
    }
    
    return res.json({ 
      transcript,
      videoId,
      success: true
    });
  } catch (error) {
    console.error('Error in transcript endpoint:', error.message);
    return res.status(500).json({ 
      error: `Failed to get transcript: ${error.message}`,
      success: false
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>YouTube Transcript API</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1>YouTube Transcript API</h1>
        <p>Service is running. Use POST /api/transcript with your API key to fetch transcripts.</p>
        <p>Current server time: ${new Date().toISOString()}</p>
        <p><a href="/health">Check API Health</a></p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Transcript API server running on port ${port}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
EOF

# Create .env file with our generated API key
echo "Creating environment configuration file..."
cat > .env << EOF
PORT=3000
API_KEY=${API_KEY}
ALLOWED_ORIGINS=https://b2blanguage.vercel.app,http://localhost:3000
EOF

# Create a start script
echo "Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/transcript-api
pm2 start server.js --name transcript-api
EOF

chmod +x start.sh

# Configure PM2 to run the application
echo "Setting up PM2 to manage the application..."
pm2 start server.js --name transcript-api
pm2 save

# Configure PM2 to start on system boot
echo "Configuring PM2 to start on system boot..."
pm2 startup

# Set up firewall
echo "Setting up firewall..."
apt install -y ufw
ufw allow ssh
ufw allow 3000
echo "y" | ufw enable

# Print success message and next steps
echo ""
echo "==============================================="
echo "Setup completed successfully!"
echo "==============================================="
echo ""
echo "Your YouTube Transcript API is running at: http://134.199.229.165:3000"
echo "API Key: ${API_KEY}"
echo ""
echo "Test your API with:"
echo "curl -X POST -H \"Content-Type: application/json\" -H \"x-api-key: ${API_KEY}\" -d '{\"videoId\": \"dQw4w9WgXcQ\"}' http://134.199.229.165:3000/api/transcript"
echo ""
echo "To check if the service is running:"
echo "curl http://134.199.229.165:3000/health"
echo ""
echo "The service will automatically restart when the server reboots."
echo ""
echo "Now update your B2B Languages app to use this new API instead of Supadata."
echo "===============================================" 