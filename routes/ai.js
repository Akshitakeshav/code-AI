/**
 * AI Routes - Multi-Provider Support
 * ===================================
 * AI-powered code generation using Gemini or Groq APIs
 * 
 * This module provides endpoints for:
 * - Generating complete multi-file websites from prompts
 * - Modifying existing code with AI
 * - Explaining code for learning
 * - Analyzing URLs to generate similar designs
 */

const express = require('express');
const puppeteer = require('puppeteer');
const router = express.Router();
const { deductTokens } = require('./payment');

// ==========================================
// API CONFIGURATIONS
// ==========================================

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using gemini-2.0-flash as it is available for this key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Groq API configuration  
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Perplexity API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Check if API keys are configured
function isGeminiConfigured() {
    return GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
}

function isGroqConfigured() {
    return GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here';
}

function isOpenAIConfigured() {
    return OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here';
}

function isOpenRouterConfigured() {
    return OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';
}

function isPerplexityConfigured() {
    return PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'your_perplexity_api_key_here';
}

function isApiKeyConfigured(provider = 'gemini') {
    if (provider === 'groq') return isGroqConfigured();
    if (provider === 'openai') return isOpenAIConfigured();
    if (provider === 'openrouter') return isOpenRouterConfigured();
    if (provider === 'perplexity') return isPerplexityConfigured();
    return isGeminiConfigured();
}

// ==========================================
// COLOR VALIDATION & THEME CONFIGURATION
// ==========================================

// Check if a color value is valid (not transparent or empty)
function isValidColor(color) {
    if (!color || typeof color !== 'string') return false;
    const trimmed = color.trim().toLowerCase();

    // Invalid patterns
    const invalidPatterns = [
        'rgba(0, 0, 0, 0)',
        'rgba(0,0,0,0)',
        'transparent',
        'inherit',
        'initial',
        'unset',
        ''
    ];

    if (invalidPatterns.includes(trimmed)) return false;

    // Check for rgba with 0 alpha
    if (trimmed.match(/rgba?\([^)]*,\s*0\s*\)/)) return false;

    return true;
}

// Filter out invalid colors from an array
function filterValidColors(colors) {
    return colors.filter(c => isValidColor(c));
}

// Comprehensive color theme configurations with specific CSS values
const COLOR_THEME_CONFIG = {
    'dark-blue-purple': {
        name: 'Dark with Blue & Purple',
        background: '#0f172a',
        surface: '#1e293b',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        description: 'Dark navy background with vibrant blue (#3b82f6) and purple (#8b5cf6) accents'
    },
    'dark-green-cyan': {
        name: 'Dark with Green & Cyan',
        background: '#0a0f0d',
        surface: '#1a2420',
        primary: '#10b981',
        secondary: '#06b6d4',
        accent: '#22d3ee',
        text: '#f0fdf4',
        textMuted: '#86efac',
        gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        description: 'Dark forest background with emerald green (#10b981) and cyan (#06b6d4) accents'
    },
    'light-blue': {
        name: 'Light with Blue',
        background: '#f8fafc',
        surface: '#ffffff',
        primary: '#2563eb',
        secondary: '#3b82f6',
        accent: '#0ea5e9',
        text: '#0f172a',
        textMuted: '#64748b',
        gradient: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
        description: 'Clean white background with professional blue (#2563eb) accents'
    },
    'light-purple': {
        name: 'Light with Purple',
        background: '#faf5ff',
        surface: '#ffffff',
        primary: '#7c3aed',
        secondary: '#a855f7',
        accent: '#c084fc',
        text: '#1e1b4b',
        textMuted: '#6b7280',
        gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        description: 'Soft lavender background with vibrant purple (#7c3aed) accents'
    },
    'dark-orange-red': {
        name: 'Dark with Orange & Red',
        background: '#18181b',
        surface: '#27272a',
        primary: '#f97316',
        secondary: '#ef4444',
        accent: '#fbbf24',
        text: '#fafafa',
        textMuted: '#a1a1aa',
        gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
        description: 'Dark charcoal background with warm orange (#f97316) and red (#ef4444) accents'
    },
    'dark-pink-rose': {
        name: 'Dark with Pink & Rose',
        background: '#1a1a2e',
        surface: '#16213e',
        primary: '#ec4899',
        secondary: '#f43f5e',
        accent: '#fb7185',
        text: '#fdf2f8',
        textMuted: '#f9a8d4',
        gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        description: 'Deep indigo background with vibrant pink (#ec4899) and rose (#f43f5e) accents'
    }
};

// Get color theme config by key or return default
function getColorThemeConfig(themeKey) {
    // Normalize key
    const normalizedKey = themeKey?.toLowerCase().replace(/[^a-z-]/g, '-') || 'dark-blue-purple';
    return COLOR_THEME_CONFIG[normalizedKey] || COLOR_THEME_CONFIG['dark-blue-purple'];
}

// Generate fallback color palette based on detected colors or theme
function generateColorPalette(detectedColors, themeKey) {
    const theme = getColorThemeConfig(themeKey);
    const validDetected = filterValidColors(detectedColors?.accents || []);

    // If we have at least 2 valid detected colors, use them
    if (validDetected.length >= 2) {
        return {
            primary: validDetected[0],
            secondary: validDetected[1],
            accent: validDetected[2] || theme.accent,
            background: isValidColor(detectedColors?.background) ? detectedColors.background : theme.background,
            text: isValidColor(detectedColors?.text) ? detectedColors.text : theme.text
        };
    }

    // Otherwise, use the theme defaults
    return {
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        background: theme.background,
        text: theme.text,
        gradient: theme.gradient
    };
}

// ==========================================
// AI PROVIDER CALLS
// ==========================================

// Call Gemini API
async function callGemini(prompt, systemInstruction = '') {
    if (!isGeminiConfigured()) {
        throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
    }

    const requestBody = {
        contents: [{
            parts: [{
                text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            topP: 0.95
        }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Call Groq API
async function callGroq(prompt, systemInstruction = '') {
    if (!isGroqConfigured()) {
        throw new Error('Groq API key not configured. Please add GROQ_API_KEY to your .env file.');
    }

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.7,
            max_tokens: 8192,
            top_p: 0.95
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Call OpenAI API
async function callOpenAI(prompt, systemInstruction = '') {
    if (!isOpenAIConfigured()) {
        throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 8192,
            top_p: 0.95
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Call OpenRouter API
async function callOpenRouter(prompt, systemInstruction = '') {
    if (!isOpenRouterConfigured()) {
        throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env file.');
    }

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://codekotha.ai',
            'X-Title': 'CodeKotha Voice Assistant'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenRouter API request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Call Perplexity API
async function callPerplexity(prompt, systemInstruction = '') {
    if (!isPerplexityConfigured()) {
        throw new Error('Perplexity API key not configured. Please add PERPLEXITY_API_KEY to your .env file.');
    }

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
            model: 'sonar',
            messages: messages,
            temperature: 0.2,
            top_p: 0.9,
            return_citations: false
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Perplexity API request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Check if an error is a quota/rate limit error
function isQuotaError(errorMessage) {
    const quotaPatterns = [
        'quota',
        'rate limit',
        'rate_limit',
        'exceeded',
        'too many requests',
        '429',
        'limit'
    ];
    const lowerError = errorMessage.toLowerCase();
    return quotaPatterns.some(pattern => lowerError.includes(pattern));
}

// Get the list of available providers (configured with valid API keys)
function getAvailableProviders() {
    const providers = [];
    if (isGroqConfigured()) providers.push('groq');
    if (isOpenAIConfigured()) providers.push('openai');
    if (isPerplexityConfigured()) providers.push('perplexity');
    if (isGeminiConfigured()) providers.push('gemini');
    return providers;
}

// Call a specific provider directly
async function callProvider(provider, prompt, systemInstruction) {
    switch (provider) {
        case 'groq': return await callGroq(prompt, systemInstruction);
        case 'openai': return await callOpenAI(prompt, systemInstruction);
        case 'perplexity': return await callPerplexity(prompt, systemInstruction);
        case 'openrouter': return await callOpenRouter(prompt, systemInstruction);
        case 'gemini':
        default: return await callGemini(prompt, systemInstruction);
    }
}

// Unified AI call with auto-fallback on quota errors
async function callAI(prompt, systemInstruction = '', provider = 'gemini') {
    // Define fallback order based on primary provider
    const allProviders = ['groq', 'openai', 'perplexity', 'gemini'];

    // Move the requested provider to the front
    const providerOrder = [provider, ...allProviders.filter(p => p !== provider)];

    // Filter to only configured providers
    const availableProviders = providerOrder.filter(p => isApiKeyConfigured(p));

    if (availableProviders.length === 0) {
        throw new Error('No AI providers configured. Please add at least one API key to your .env file.');
    }

    let lastError = null;

    for (const currentProvider of availableProviders) {
        try {
            console.log(`🤖 Trying ${currentProvider.toUpperCase()} provider...`);
            const result = await callProvider(currentProvider, prompt, systemInstruction);
            console.log(`✅ ${currentProvider.toUpperCase()} succeeded!`);
            return result;
        } catch (error) {
            lastError = error;
            console.log(`⚠️ ${currentProvider.toUpperCase()} failed: ${error.message}`);

            // If this is a quota/rate limit error, try next provider
            if (isQuotaError(error.message)) {
                console.log(`🔄 Quota exceeded on ${currentProvider}, trying next provider...`);
                continue;
            }

            // For non-quota errors, still try next provider but log warning
            console.log(`⚠️ Non-quota error on ${currentProvider}, trying next provider...`);
        }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}


// System instruction for multi-file project generation
const MULTI_FILE_GENERATION_INSTRUCTION = `You are an expert frontend web developer. Generate STUNNING, production-ready websites.

CRITICAL: Respond with valid JSON:
{
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "style.css": "/* CSS code */...",
    "script.js": "// JavaScript..."
  },
  "summary": "Brief description"
}

MANDATORY CSS REQUIREMENTS:

1. CSS VARIABLES at :root:
   --color-bg: #0f172a; --color-surface: #1e293b; --color-primary: #3b82f6;
   --color-secondary: #8b5cf6; --color-text: #f8fafc; --color-text-muted: #94a3b8;

2. HERO SECTION: min-height: 100vh; background: linear-gradient(135deg, #0f172a, #1e293b);
   - Large h1 with gradient text effect
   - CTA button with glow shadow

3. BUTTONS: background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 1rem 2rem;
   border-radius: 12px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
   Hover: transform: translateY(-2px); box-shadow increased

4. CARDS: background: #1e293b; border-radius: 16px; padding: 2rem;
   border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.3);
   Hover: transform: translateY(-5px); border-color: #3b82f6;

5. SECTIONS: padding: 5rem 0; max-width: 1200px; margin: 0 auto;
   Section titles: font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem;

6. IMAGES: border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden;

7. NAV: position: fixed; background: rgba(15,23,42,0.9); backdrop-filter: blur(10px);
   padding: 1rem 2rem; width: 100%;

8. ANIMATIONS: @keyframes fadeIn { from {opacity:0; transform:translateY(20px)} to {opacity:1; transform:translateY(0)} }
   Use transition: all 0.3s ease on interactive elements

9. GRID: display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;

10. TYPOGRAPHY: @import Google Fonts (Inter); h1: clamp(2rem, 5vw, 3.5rem); line-height: 1.6;

NEVER use: transparent, rgba(0,0,0,0), unstyled elements, default fonts, no spacing

DO NOT include markdown. Return ONLY valid JSON.`;

// System instruction for single file generation (backward compatibility)
const CODE_GENERATION_INSTRUCTION = `You are an expert web developer. Generate modern, visually stunning code.

REQUIRED CSS PATTERNS:
- CSS variables: --color-bg, --color-primary, --color-text, etc.
- Hero: min-height: 100vh; gradient background
- Buttons: gradient background, border-radius: 12px, box-shadow with glow, hover transform
- Cards: border-radius: 16px, padding: 2rem, shadow, hover lift effect
- Sections: padding: 5rem 0, max-width: 1200px container
- Images: border-radius, shadow, object-fit: cover
- Animations: fadeIn keyframes, transitions on hover
- Grid: repeat(auto-fit, minmax(280px, 1fr))
- Typography: Google Fonts, clamp() for responsive sizing

NEVER use: transparent, rgba(0,0,0,0), unstyled elements.

Guidelines:
1. No external CSS frameworks (no Tailwind CDN)
2. Semantic HTML5
3. Google Fonts (Inter, Poppins)
4. Return ONLY code, no markdown
5. Modern ES6+ JavaScript
6. Responsive design`;

// Parse AI response to extract files
function parseMultiFileResponse(response) {
    // Try to parse as JSON first
    try {
        // Remove any markdown code blocks if present
        let cleanResponse = response
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanResponse);
        if (parsed.files && typeof parsed.files === 'object') {
            return {
                files: parsed.files,
                summary: parsed.summary || 'Website generated successfully'
            };
        }
    } catch (e) {
        console.log('JSON parse failed, trying regex extraction...');
    }

    // Fallback: Extract files using regex patterns
    const files = {};

    // Try to extract HTML
    const htmlMatch = response.match(/["']?index\.html["']?\s*:\s*["'`]([\s\S]*?)["'`]\s*[,}]/);
    if (htmlMatch) {
        files['index.html'] = htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    // Try to extract CSS
    const cssMatch = response.match(/["']?style\.css["']?\s*:\s*["'`]([\s\S]*?)["'`]\s*[,}]/);
    if (cssMatch) {
        files['style.css'] = cssMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    // Try to extract JS
    const jsMatch = response.match(/["']?script\.js["']?\s*:\s*["'`]([\s\S]*?)["'`]\s*[,}]/);
    if (jsMatch) {
        files['script.js'] = jsMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    // If no files extracted, treat entire response as HTML
    if (Object.keys(files).length === 0) {
        let cleanCode = response
            .replace(/```html\n?/gi, '')
            .replace(/```css\n?/gi, '')
            .replace(/```javascript\n?/gi, '')
            .replace(/```js\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        files['index.html'] = cleanCode;
    }

    return {
        files,
        summary: 'Website generated successfully'
    };
}

// POST /api/ai/generate - Generate complete website
router.post('/generate', async (req, res) => {
    try {
        const { projectName, theme, sections, colorTheme, customPrompt, provider = 'gemini' } = req.body;

        if (!isApiKeyConfigured(provider)) {
            return res.status(400).json({
                success: false,
                error: `${provider.toUpperCase()} API key not configured. Please add your API key to the .env file.`
            });
        }

        const sectionsText = sections?.join(', ') || 'hero, features, call-to-action, footer';

        const prompt = customPrompt || `Create a complete, modern ${theme || 'landing page'} website for "${projectName || 'My Website'}".

Include these sections: ${sectionsText}

Color theme: ${colorTheme || 'Dark theme with blue and purple gradient accents'}

Requirements:
- Use Tailwind CSS via CDN
- Include Google Fonts
- Make it fully responsive
- Add smooth hover effects and animations
- Use gradient backgrounds
- Include a professional navigation bar
- Add social media icons in footer
- Make it visually stunning and modern

Return a complete HTML file with embedded CSS and JavaScript.`;

        console.log(`🤖 Generating website with ${provider.toUpperCase()}...`);
        const generatedCode = await callAI(prompt, CODE_GENERATION_INSTRUCTION, provider);

        // Clean up the response (remove markdown code blocks if present)
        let cleanCode = generatedCode
            .replace(/```html\n?/gi, '')
            .replace(/```css\n?/gi, '')
            .replace(/```javascript\n?/gi, '')
            .replace(/```js\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        console.log('✅ Website generated successfully');

        // Deduct tokens if userId provided (10 tokens per AI call)
        const userId = req.body.userId;
        if (userId) {
            await deductTokens(userId, 10, 'AI website generation');
        }

        res.json({
            success: true,
            code: cleanCode,
            type: 'html'
        });

    } catch (error) {
        console.error('❌ AI Generation Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ai/generate-project - Generate complete multi-file project (NEW!)
// This is the main endpoint for the automatic website builder flow
router.post('/generate-project', async (req, res) => {
    try {
        const { prompt, projectName, colorTheme, provider = 'gemini' } = req.body;

        if (!isApiKeyConfigured(provider)) {
            return res.status(400).json({
                success: false,
                error: `${provider.toUpperCase()} API key not configured. Please add your API key to the .env file.`
            });
        }

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        // Get the color theme configuration with specific values
        const themeConfig = getColorThemeConfig(colorTheme || 'dark-blue-purple');
        console.log('🎨 Using theme:', themeConfig.name);

        // Build the generation prompt with explicit color values
        const generationPrompt = `Create a complete frontend website based on this description:

"${prompt}"

Project name: ${projectName || 'My Website'}

REQUIRED COLOR THEME (use these EXACT hex values):
- Background: ${themeConfig.background}
- Surface/Cards: ${themeConfig.surface}
- Primary Color: ${themeConfig.primary}
- Secondary Color: ${themeConfig.secondary}
- Accent Color: ${themeConfig.accent}
- Text Color: ${themeConfig.text}
- Muted Text: ${themeConfig.textMuted}
- Gradient: ${themeConfig.gradient}
Theme Description: ${themeConfig.description}

REQUIREMENTS:
1. Generate THREE separate files: index.html, style.css, and script.js
2. The HTML file should link to style.css and script.js properly
3. In style.css, define CSS custom properties at :root with the colors above
4. Make it visually stunning with modern design using the EXACT colors specified
5. NEVER use transparent, rgba(0,0,0,0), or colors with 0 alpha
6. Include animations, hover effects, and smooth transitions
7. Make it fully responsive for mobile, tablet, and desktop
8. Use Google Fonts for typography (Inter or Poppins)
9. Include a navigation bar, main content sections, and footer
10. Add interactive elements with JavaScript

Remember to return ONLY a valid JSON object with the files.`;

        console.log(`🤖 Generating multi-file project with ${provider.toUpperCase()}...`);
        console.log('📝 Prompt:', prompt.substring(0, 100) + '...');

        const generatedResponse = await callAI(generationPrompt, MULTI_FILE_GENERATION_INSTRUCTION, provider);

        // Parse the response to extract files
        const result = parseMultiFileResponse(generatedResponse);

        console.log('✅ Multi-file project generated successfully');
        console.log('📁 Files generated:', Object.keys(result.files));

        // Deduct tokens if userId provided (10 tokens per AI call)
        const userId = req.body.userId;
        if (userId) {
            await deductTokens(userId, 10, 'AI project generation');
        }

        res.json({
            success: true,
            files: result.files,
            summary: result.summary,
            filesCount: Object.keys(result.files).length
        });

    } catch (error) {
        console.error('❌ AI Project Generation Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ai/modify - Modify existing code based on prompt
router.post('/modify', async (req, res) => {
    try {
        const { code, prompt, fileType, provider = 'gemini' } = req.body;

        if (!isApiKeyConfigured(provider)) {
            return res.status(400).json({
                success: false,
                error: `${provider.toUpperCase()} API key not configured. Please add your API key to the .env file.`
            });
        }

        if (!code || !prompt) {
            return res.status(400).json({
                success: false,
                error: 'Both code and prompt are required'
            });
        }

        const modifyPrompt = `Here is my current ${fileType || 'HTML'} code:

\`\`\`
${code}
\`\`\`

Please modify this code according to this instruction: "${prompt}"

Return ONLY the modified complete code, no explanations.`;

        console.log(`🤖 Modifying code with ${provider.toUpperCase()}...`);
        const modifiedCode = await callAI(modifyPrompt, CODE_GENERATION_INSTRUCTION, provider);

        // Clean up the response
        let cleanCode = modifiedCode
            .replace(/```html\n?/gi, '')
            .replace(/```css\n?/gi, '')
            .replace(/```javascript\n?/gi, '')
            .replace(/```js\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        console.log('✅ Code modified successfully');

        // Deduct tokens if userId provided (10 tokens per AI call)
        const userId = req.body.userId;
        if (userId) {
            await deductTokens(userId, 10, 'AI code modification');
        }

        res.json({
            success: true,
            code: cleanCode
        });

    } catch (error) {
        console.error('❌ AI Modification Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ai/explain - Explain code (for Learning Mode)
router.post('/explain', async (req, res) => {
    try {
        const { code, fileType, detailed, provider = 'gemini' } = req.body;

        if (!isApiKeyConfigured(provider)) {
            return res.status(400).json({
                success: false,
                error: `${provider.toUpperCase()} API key not configured`
            });
        }

        if (!code || code.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Code is required for explanation'
            });
        }

        // Limit code length to prevent token overflow
        const truncatedCode = code.length > 3000 ? code.substring(0, 3000) + '\n... (code truncated)' : code;

        const explainPrompt = detailed ?
            `You are a friendly coding teacher. Explain this ${fileType || 'code'} in a way that helps beginners understand.

\`\`\`${fileType || ''}
${truncatedCode}
\`\`\`

Provide a structured explanation in this JSON format:
{
  "summary": "One sentence describing what this code does overall",
  "sections": [
    {
      "title": "Section name (e.g., 'HTML Structure', 'Navigation Bar', 'Styling')",
      "lines": "1-10",
      "explanation": "What this section does and why",
      "concepts": ["concept1", "concept2"]
    }
  ],
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "tips": ["helpful tip 1", "helpful tip 2"]
}

Return ONLY the JSON object, no markdown.`
            :
            `Explain this ${fileType || 'code'} briefly for a learning developer:

\`\`\`${fileType || ''}
${truncatedCode}
\`\`\`

Return a JSON object with:
{
  "summary": "Brief 1-2 sentence summary",
  "highlights": ["key point 1", "key point 2", "key point 3"],
  "learnMore": ["topic to research 1", "topic to research 2"]
}

Return ONLY the JSON object, no markdown.`;

        console.log(`📚 Generating code explanation with ${provider.toUpperCase()}...`);
        const explanation = await callAI(explainPrompt, '', provider);

        // Try to parse as JSON, fallback to text
        let parsedExplanation;
        try {
            // Clean up potential markdown
            const cleanJson = explanation
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();
            parsedExplanation = JSON.parse(cleanJson);
        } catch (e) {
            // If JSON parsing fails, return as text
            parsedExplanation = {
                summary: explanation.substring(0, 200),
                highlights: [explanation],
                isRawText: true
            };
        }

        console.log('✅ Explanation generated');

        res.json({
            success: true,
            explanation: parsedExplanation,
            fileType: fileType || 'code'
        });

    } catch (error) {
        console.error('❌ AI Explanation Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/ai/analyze-url - Analyze a website URL and generate similar code
router.post('/analyze-url', async (req, res) => {
    try {
        const { url, provider = 'gemini' } = req.body;

        if (!isApiKeyConfigured(provider)) {
            return res.status(400).json({
                success: false,
                error: `${provider.toUpperCase()} API key not configured`
            });
        }

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        console.log(`🔍 Analyzing website: ${url}...`);

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        try {
            let loaded = false;
            try {
                await page.goto(url, { waitUntil: 'networkidle2' });
                loaded = true;
            } catch (e) {
                console.log('Primary navigation failed:', e.message);
            }
            if (!loaded) {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                await page.waitForSelector('body', { timeout: 15000 }).catch(() => { });
                await page.waitForTimeout(2000);
            }

            // Extract data
            const analysis = await page.evaluate(() => {
                const getComputedColor = (el) => {
                    const style = window.getComputedStyle(el);
                    return {
                        bg: style.backgroundColor,
                        text: style.color
                    };
                };

                // Get colors
                const bodyColors = getComputedColor(document.body);
                const headings = Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 3);
                const headingColors = headings.map(h => getComputedColor(h));
                const buttons = Array.from(document.querySelectorAll('button, .btn, a[class*="btn"]')).slice(0, 3);
                const buttonColors = buttons.map(b => getComputedColor(b));

                // Get fonts
                const font = window.getComputedStyle(document.body).fontFamily;

                // Get structure
                const nav = document.querySelector('nav, header');
                const navText = nav ? nav.innerText.substring(0, 200) : 'Navigation bar';

                const hero = document.querySelector('section:first-of-type, main > div:first-child, header + div');
                const heroText = hero ? hero.innerText.substring(0, 300) : 'Hero section';

                const mainHeadings = Array.from(document.querySelectorAll('h1, h2')).map(h => h.innerText).slice(0, 5);

                const footer = document.querySelector('footer');
                const footerText = footer ? footer.innerText.substring(0, 100) : 'Footer';

                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    colors: {
                        background: bodyColors.bg,
                        text: bodyColors.text,
                        accents: [...new Set([...headingColors.map(c => c.text), ...buttonColors.map(c => c.bg)])]
                    },
                    font: font,
                    structure: {
                        nav: navText,
                        hero: heroText,
                        headings: mainHeadings,
                        footer: footerText
                    }
                };
            });

            // ========================================
            // IMAGE EXTRACTION - Extract and download images from the page
            // ========================================
            console.log('🖼️ Extracting images from page...');

            // Get all image URLs from the page
            const imageUrls = await page.evaluate(() => {
                const images = Array.from(document.querySelectorAll('img'));
                return images
                    .map(img => ({
                        src: img.src || img.dataset.src || img.getAttribute('data-lazy-src'),
                        alt: img.alt || '',
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height
                    }))
                    .filter(img => {
                        if (!img.src) return false;
                        // Only include http/https URLs
                        if (!img.src.startsWith('http://') && !img.src.startsWith('https://')) return false;
                        // Skip tiny images (likely icons/trackers)
                        if (img.width < 50 && img.height < 50) return false;
                        // Skip common tracking/analytics images
                        if (img.src.includes('google-analytics') || img.src.includes('facebook.com/tr') || img.src.includes('pixel')) return false;
                        return true;
                    })
                    .slice(0, 10); // Limit to 10 images to avoid timeout
            });

            console.log(`📷 Found ${imageUrls.length} images to extract`);

            // Download images and convert to base64
            const extractedImages = {};
            const imageMapping = {}; // Maps original URL to local path

            for (let i = 0; i < imageUrls.length; i++) {
                const img = imageUrls[i];
                try {
                    // Determine file extension from URL
                    const urlPath = new URL(img.src).pathname;
                    let ext = urlPath.split('.').pop().toLowerCase();
                    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                        ext = 'jpg'; // Default to jpg
                    }

                    const filename = `images/image-${i + 1}.${ext}`;

                    // Fetch the image
                    const response = await page.goto(img.src, { waitUntil: 'load', timeout: 10000 });
                    if (response && response.ok()) {
                        const buffer = await response.buffer();
                        const base64 = buffer.toString('base64');
                        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

                        extractedImages[filename] = `data:${mimeType};base64,${base64}`;
                        imageMapping[img.src] = `./${filename}`;
                        console.log(`   ✓ Downloaded: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
                    }
                } catch (imgError) {
                    console.log(`   ✗ Failed to download image ${i + 1}: ${imgError.message}`);
                }
            }

            // Navigate back to the original page for any further processing
            if (imageUrls.length > 0) {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
            }

            console.log(`✅ Successfully extracted ${Object.keys(extractedImages).length} images`);

            await browser.close();

            console.log('✅ Website analyzed successfully');
            console.log('Title:', analysis.title);

            // Validate and generate color palette with fallbacks
            const colorPalette = generateColorPalette(analysis.colors, 'dark-blue-purple');
            const hasValidColors = filterValidColors([
                analysis.colors.background,
                analysis.colors.text,
                ...(analysis.colors.accents || [])
            ]).length >= 2;

            console.log('🎨 Valid colors detected:', hasValidColors);
            console.log('🎨 Using palette:', colorPalette);

            // Construct Prompt with validated colors
            const analyzePrompt = `I have analyzed a live website (${url}). Here is the extracted design data:

Title: ${analysis.title}
Description: ${analysis.description}
Detected Font Family: ${analysis.font}

${hasValidColors ? `Original Color Palette (use these as inspiration):
- Background: ${analysis.colors.background}
- Text: ${analysis.colors.text}
- Accents: ${analysis.colors.accents.join(', ')}` : `The original website colors could not be properly extracted.`}

REQUIRED COLOR PALETTE TO USE (these are validated hex colors):
- Background: ${colorPalette.background}
- Surface/Card: ${colorPalette.background === '#0f172a' ? '#1e293b' : '#ffffff'}
- Primary: ${colorPalette.primary}
- Secondary: ${colorPalette.secondary}
- Accent: ${colorPalette.accent}
- Text: ${colorPalette.text}
- Gradient: ${colorPalette.gradient || `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`}

Layout Structure:
1. Navigation: ${analysis.structure.nav.replace(/\n/g, ' ')}
2. Hero Section: ${analysis.structure.hero.replace(/\n/g, ' ')}
3. Main Headings: ${analysis.structure.headings.join(', ')}
4. Footer: ${analysis.structure.footer.replace(/\n/g, ' ')}

YOUR TASK:
Recreate this website's frontend (HTML/CSS/JS) with ~60% visual and structural similarity.

CRITICAL CSS REQUIREMENTS:
1. Use the REQUIRED COLOR PALETTE above with exact hex values
2. NEVER use rgba(0,0,0,0), transparent, or colors with 0 alpha
3. Define CSS custom properties at :root with the colors above
4. Use gradient backgrounds for hero sections and buttons
5. Add box-shadows with primary color (e.g., box-shadow: 0 4px 20px ${colorPalette.primary}40)
6. Include smooth color transitions on hover (transition: all 0.3s ease)

${Object.keys(extractedImages).length > 0 ? `
EXTRACTED IMAGES (use these relative paths in your HTML):
${Object.keys(extractedImages).map(path => `- ${path.replace('images/', './images/')}`).join('\n')}

IMPORTANT: Use these exact relative paths for <img> src attributes. For example:
<img src="./images/image-1.jpg" alt="...">
DO NOT use https://picsum.photos or any other external placeholder URLs.
` : `
Note: No images were extracted from this page. Use https://picsum.photos/800/400 for placeholders.
`}

Additional requirements:
1. Recreate the layout structure (Nav, Hero, Sections, Cards, Footer)
2. Write CLEAN, MODERN, RESPONSIVE code with Flexbox and Grid
3. Do NOT use inline CSS - put all styles in style.css
4. Make it interactive (mobile menu toggle, hover effects, scroll animations)
5. Include Google Fonts (Inter or Poppins)

Return a JSON object with "files" containing "index.html", "style.css", and "script.js".`;

            console.log(`🤖 Generating similar website with ${provider.toUpperCase()}...`);
            console.log(`🖼️ Including ${Object.keys(extractedImages).length} extracted images in project`);

            // Use MULTI_FILE_GENERATION_INSTRUCTION to get JSON output
            const generatedResponse = await callAI(analyzePrompt, MULTI_FILE_GENERATION_INSTRUCTION, provider);

            // Parse response
            const result = parseMultiFileResponse(generatedResponse);

            // Merge extracted images into the files object
            const allFiles = {
                ...result.files,
                ...extractedImages
            };

            res.json({
                success: true,
                files: allFiles,
                summary: `Analyzed ${url} and recreated similar design with ${Object.keys(extractedImages).length} extracted images`,
                originalTitle: analysis.title,
                imageCount: Object.keys(extractedImages).length
            });

            // Deduct tokens if userId provided (25 tokens for URL analysis)
            const userId = req.body.userId;
            if (userId) {
                await deductTokens(userId, 25, 'Analyze website URL');
            }

        } catch (puppeteerError) {
            await browser.close();
            throw puppeteerError;
        }

    } catch (error) {
        console.error('❌ URL Analysis Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze URL: ' + error.message
        });
    }
});

// GET /api/ai/status - Check AI API status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        gemini: {
            configured: isGeminiConfigured(),
            model: 'gemini-2.0-flash'
        },
        groq: {
            configured: isGroqConfigured(),
            model: 'llama-3.3-70b-versatile'
        },
        openai: {
            configured: isOpenAIConfigured(),
            model: 'gpt-4o-mini'
        },
        perplexity: {
            configured: isPerplexityConfigured(),
            model: 'llama-3.1-sonar-large'
        },
        message: isGeminiConfigured() || isGroqConfigured() || isOpenAIConfigured() || isPerplexityConfigured()
            ? 'AI providers ready'
            : 'No API keys configured. Add GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or PERPLEXITY_API_KEY to .env file.'
    });
});

// ==========================================
// VOICE ASSISTANT CHAT ENDPOINT
// ==========================================
router.post('/chat', async (req, res) => {
    try {
        const { message, provider = 'openrouter', pageContext } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Build page-aware system instruction
        let pageInfo = '';
        if (pageContext && pageContext.name) {
            pageInfo = `\n\nCURRENT PAGE CONTEXT:
The user is currently on the "${pageContext.name}" page (${pageContext.url || 'unknown URL'}).
Page description: ${pageContext.description || 'N/A'}
- If they ask about the page, provide relevant guidance
- Tailor your responses to what they can do on this page`;
        }

        const systemInstruction = `You are CodeKotha Voice Assistant, a helpful and friendly AI companion for the CodeKotha AI Website Builder platform.

IMPORTANT GUIDELINES:
- Keep responses SHORT and conversational (max 2-3 sentences)
- Be friendly, encouraging, and helpful
- Focus on web development, coding, and the CodeKotha platform features
- If asked about building websites, explain they can use the AI Builder
- Avoid long lists, code blocks, or technical jargon
- Use simple, spoken-language friendly responses
- ALWAYS acknowledge which page the user is on if relevant
- When asked about team members, mention them by name with their roles

=== CODEKOTHA TEAM MEMBERS ===
CodeKotha AI was built by a talented team of 4 members:

1. DEBADITYA SAHA
   - Role: Team Lead + Frontend Developer
   - Responsibilities: Leading the team and crafting beautiful, responsive user interfaces
   - He is the project lead who coordinates the team

2. SOUVAGYA KUMAR DAS
   - Role: Tech Lead + Backend Developer
   - Responsibilities: Leading backend architecture and building scalable server-side solutions
   - He handles all the server-side code and APIs

3. POULAMI NEOGI
   - Role: UI/UX Designer
   - Responsibilities: Creative designer crafting beautiful and intuitive user experiences
   - She designs the visual look and user experience

4. DIPANKAR ROY
   - Role: Contributor
   - Responsibilities: Contributing to the project with valuable ideas and support
   - He provides ideas and support to the team

When someone asks "Who built this?" or "Who made CodeKotha?":
- Mention all 4 team members: Debaditya, Souvagya, Poulami, and Dipankar
- Highlight Debaditya as Team Lead and Souvagya as Tech Lead

=== PLATFORM FEATURES ===
- AI Website Builder: Generate complete websites from prompts
- Learning Mode: Interactive code tutorials with text-to-speech
- URL to Code: Analyze and recreate any website
- Multi-AI Support: Gemini, Groq, OpenAI, OpenRouter models
- Voice Assistant: Talk to AI on any page (except the builder)

=== PAGE-SPECIFIC HELP ===
- Home page: Introduce CodeKotha, explain features
- About page: Share info about the team (you can see team photos there!)
- Pricing page: Help with plans, tokens, subscriptions
- Dashboard: Guide users to create projects, view stats
- Admin Panel: Admin-specific management tasks${pageInfo}`;

        console.log(`🎙️ Voice Chat [${provider}] on ${pageContext?.name || 'unknown'}: ${message.substring(0, 50)}...`);

        const response = await callAI(message, systemInstruction, provider);

        res.json({
            success: true,
            response: response
        });

    } catch (error) {
        console.error('❌ Voice Chat Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
