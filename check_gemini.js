
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('No GEMINI_API_KEY found in .env');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log('Fetching models from:', url.replace(API_KEY, 'HIDDEN_KEY'));

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.error) {
                console.error('Error:', response.error);
            } else {
                console.log('Available Models:');
                if (response.models) {
                    response.models.forEach(model => {
                        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                             console.log(`- ${model.name} (${model.version})`);
                        }
                    });
                } else {
                    console.log('No models found in response:', response);
                }
            }
        } catch (e) {
            console.error('Failed to parse response:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Request failed:', err);
});
