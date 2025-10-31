const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

function listModels() {
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1/models?key=${API_KEY}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    console.log('Listing available models...');
    console.log('URL:', `https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);

        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log('Raw response:', responseData);
            try {
                const parsed = JSON.parse(responseData);
                if (parsed.models) {
                    console.log('\n✅ Available models:');
                    parsed.models.forEach(model => {
                        console.log(`- ${model.name}`);
                        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                            console.log(`  ✅ Supports generateContent`);
                        }
                    });
                } else {
                    console.log('❌ No models found in response');
                }
            } catch (error) {
                console.log('❌ Failed to parse response:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error.message);
    });

    req.end();
}

listModels();