const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8787;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting
const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 50, // Number of requests
    duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
}));

app.use(cors({
    origin: ['chrome-extension://*', 'http://localhost:*'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Main Gemini API endpoint
app.post('/gemini', async (req, res) => {
    try {
        const { prompt, systemPrompt, temperature = 0.7, maxTokens = 1000 } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: 'Missing required parameter',
                message: 'Prompt is required'
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: 'Configuration error',
                message: 'Gemini API key not configured'
            });
        }

        // Get the generative model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: maxTokens,
            }
        });

        // Combine system prompt and user prompt
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

        console.log('Processing request:', {
            promptLength: fullPrompt.length,
            temperature,
            maxTokens,
            timestamp: new Date().toISOString()
        });

        // Generate content
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        res.json({
            response: text,
            usage: {
                promptTokens: fullPrompt.length / 4, // Rough estimate
                completionTokens: text.length / 4,
                totalTokens: (fullPrompt.length + text.length) / 4
            },
            model: 'gemini-2.5-flash',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Gemini API error:', error);
        
        let statusCode = 500;
        let errorMessage = 'Internal server error';
        
        if (error.message.includes('API key')) {
            statusCode = 401;
            errorMessage = 'Invalid API key';
        } else if (error.message.includes('quota')) {
            statusCode = 429;
            errorMessage = 'API quota exceeded';
        } else if (error.message.includes('safety')) {
            statusCode = 400;
            errorMessage = 'Content filtered for safety';
        }

        res.status(statusCode).json({
            error: 'AI generation failed',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Streaming endpoint for real-time responses
app.post('/gemini/stream', async (req, res) => {
    try {
        const { prompt, systemPrompt, temperature = 0.7 } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: 'Missing required parameter',
                message: 'Prompt is required'
            });
        }

        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: temperature,
            }
        });

        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

        // For now, Gemini doesn't support streaming, so we'll simulate it
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Simulate streaming by sending chunks
        const words = text.split(' ');
        for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(' ') + ' ';
            res.write(chunk);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        res.end();

    } catch (error) {
        console.error('Streaming error:', error);
        res.write(`Error: ${error.message}`);
        res.end();
    }
});

// Batch processing endpoint for multiple requests
app.post('/gemini/batch', async (req, res) => {
    try {
        const { requests } = req.body;

        if (!Array.isArray(requests) || requests.length === 0) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Requests array is required'
            });
        }

        if (requests.length > 5) {
            return res.status(400).json({
                error: 'Too many requests',
                message: 'Maximum 5 requests per batch'
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const results = [];

        for (const request of requests) {
            try {
                const { prompt, systemPrompt } = request;
                const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
                
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                
                results.push({
                    success: true,
                    response: response.text(),
                    id: request.id || null
                });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    id: request.id || null
                });
            }
        }

        res.json({
            results,
            processed: results.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({
            error: 'Batch processing failed',
            message: error.message
        });
    }
});

// Analytics endpoint
app.get('/analytics', (req, res) => {
    // This could be expanded to provide usage analytics
    res.json({
        message: 'Analytics endpoint - implement as needed',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'Endpoint not found',
        availableEndpoints: [
            'GET /health',
            'POST /gemini',
            'POST /gemini/stream',
            'POST /gemini/batch',
            'GET /analytics'
        ]
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 CoachLens Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Gemini API: http://localhost:${PORT}/gemini`);
    console.log(`📡 Streaming API: http://localhost:${PORT}/gemini/stream`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  WARNING: GEMINI_API_KEY not set in environment variables');
        console.warn('   Please create a .env file with your Gemini API key');
    }
});

module.exports = app;