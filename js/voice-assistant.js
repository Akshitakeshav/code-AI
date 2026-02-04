/**
 * CodeKotha Voice Assistant
 * A standalone voice assistant component using Web Speech API and OpenRouter
 * Include this script on any page (except app.html) to enable voice interaction
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        apiEndpoint: '/api/ai/chat',
        provider: 'openrouter',
        recognition: {
            lang: 'en-US',
            continuous: false,
            interimResults: false
        }
    };

    // State
    const state = {
        isListening: false,
        isOpen: false,
        recognition: null,
        synthesis: window.speechSynthesis,
        currentPage: null
    };

    // Detect current page context
    function getPageContext() {
        const path = window.location.pathname;
        const pageMap = {
            '/': { name: 'Home', description: 'The main landing page of CodeKotha AI' },
            '/index.html': { name: 'Home', description: 'The main landing page of CodeKotha AI' },
            '/about.html': { name: 'About', description: 'Learn about the CodeKotha team' },
            '/about': { name: 'About', description: 'Learn about the CodeKotha team' },
            '/pricing.html': { name: 'Pricing', description: 'View subscription plans and API token packages' },
            '/pricing': { name: 'Pricing', description: 'View subscription plans and API token packages' },
            '/dashboard.html': { name: 'Dashboard', description: 'Your personal dashboard with projects and stats' },
            '/dashboard': { name: 'Dashboard', description: 'Your personal dashboard with projects and stats' },
            '/admin.html': { name: 'Admin Panel', description: 'Admin dashboard for managing users and content' },
            '/admin': { name: 'Admin Panel', description: 'Admin dashboard for managing users and content' }
        };

        return pageMap[path] || { name: 'Page', description: 'A page on CodeKotha AI' };
    }

    // Create and inject the Voice Assistant UI
    function createVoiceAssistantUI() {
        const container = document.createElement('div');
        container.id = 'voice-assistant-container';
        container.innerHTML = `
            <style>
                #voice-assistant-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                #va-chat-bubble {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 340px;
                    background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    transform: scale(0) translateY(20px);
                    transform-origin: bottom right;
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                }

                #va-chat-bubble.open {
                    transform: scale(1) translateY(0);
                }

                #va-header {
                    padding: 16px 20px;
                    background: linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                #va-header-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #a78bfa;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                #va-header-title .dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    animation: pulse-dot 2s infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                #va-header-badge {
                    font-size: 10px;
                    color: #6b7280;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 8px;
                    border-radius: 12px;
                }

                #va-messages {
                    height: 280px;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                #va-messages::-webkit-scrollbar {
                    width: 4px;
                }

                #va-messages::-webkit-scrollbar-track {
                    background: transparent;
                }

                #va-messages::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }

                .va-message {
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 14px;
                    line-height: 1.5;
                    max-width: 85%;
                    animation: fadeInUp 0.3s ease;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .va-message.user {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    color: white;
                    margin-left: auto;
                    border-bottom-right-radius: 4px;
                }

                .va-message.ai {
                    background: rgba(59, 130, 246, 0.15);
                    color: #93c5fd;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    margin-right: auto;
                    border-bottom-left-radius: 4px;
                }

                .va-message.system {
                    background: rgba(255, 255, 255, 0.05);
                    color: #9ca3af;
                    font-size: 13px;
                    text-align: center;
                    margin: 0 auto;
                }

                #va-status {
                    padding: 12px 16px;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    min-height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                #va-status.listening {
                    color: #a78bfa;
                }

                #va-status.thinking {
                    color: #60a5fa;
                }

                .va-dots {
                    display: flex;
                    gap: 4px;
                }

                .va-dots span {
                    width: 6px;
                    height: 6px;
                    background: currentColor;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .va-dots span:nth-child(1) { animation-delay: -0.32s; }
                .va-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }

                #va-fab {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.5);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                #va-fab:hover {
                    transform: scale(1.05);
                    box-shadow: 0 15px 50px -10px rgba(139, 92, 246, 0.6);
                }

                #va-fab:active {
                    transform: scale(0.95);
                }

                #va-fab-icon {
                    font-size: 28px;
                    position: relative;
                    z-index: 2;
                    transition: transform 0.3s ease;
                }

                #va-fab.listening #va-fab-icon {
                    animation: pulse-icon 1s infinite;
                }

                @keyframes pulse-icon {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .va-ripple {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    opacity: 0;
                    transform: scale(0.8);
                }

                #va-fab.listening .va-ripple {
                    animation: ripple 1.5s infinite;
                }

                #va-fab.listening .va-ripple:nth-child(2) {
                    animation-delay: 0.5s;
                }

                @keyframes ripple {
                    0% {
                        opacity: 0.5;
                        transform: scale(0.8);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.5);
                    }
                }

                #va-close-btn {
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    width: 24px;
                    height: 24px;
                    background: #ef4444;
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s ease;
                }

                #va-chat-bubble.open ~ #va-fab-wrapper #va-close-btn {
                    display: flex;
                }

                #va-close-btn:hover {
                    transform: scale(1.1);
                }

                #va-fab-wrapper {
                    position: relative;
                }
            </style>

            <div id="va-chat-bubble">
                <div id="va-header">
                    <div id="va-header-title">
                        <span class="dot"></span>
                        VOICE ASSISTANT
                    </div>
                    <span id="va-header-badge">OpenRouter AI</span>
                </div>
                <div id="va-messages">
                    <div class="va-message system">
                        👋 Hello! I'm your AI assistant. You're on the <strong>${getPageContext().name}</strong> page. Tap the mic to talk to me!
                    </div>
                </div>
                <div id="va-status">
                    Click 🎙️ to start speaking
                </div>
            </div>

            <div id="va-fab-wrapper">
                <button id="va-close-btn" title="Close">✕</button>
                <button id="va-fab" title="Voice Assistant">
                    <div class="va-ripple"></div>
                    <div class="va-ripple"></div>
                    <span id="va-fab-icon">🎙️</span>
                </button>
            </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    // Initialize Speech Recognition
    function initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech Recognition not supported');
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = CONFIG.recognition.lang;
        recognition.continuous = CONFIG.recognition.continuous;
        recognition.interimResults = CONFIG.recognition.interimResults;

        recognition.onstart = () => {
            state.isListening = true;
            updateUI('listening');
        };

        recognition.onend = () => {
            state.isListening = false;
            const statusEl = document.getElementById('va-status');
            if (statusEl && statusEl.classList.contains('listening')) {
                updateUI('idle');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech Recognition Error:', event.error);
            state.isListening = false;
            updateUI('idle');

            if (event.error === 'not-allowed') {
                addMessage('system', '⚠️ Microphone access denied. Please allow microphone access.');
            }
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            addMessage('user', transcript);
            await processQuery(transcript);
        };

        return recognition;
    }

    // Update UI based on state
    function updateUI(status) {
        const fab = document.getElementById('va-fab');
        const statusEl = document.getElementById('va-status');

        if (!fab || !statusEl) return;

        fab.classList.remove('listening');
        statusEl.classList.remove('listening', 'thinking');

        switch (status) {
            case 'listening':
                fab.classList.add('listening');
                statusEl.classList.add('listening');
                statusEl.innerHTML = '<div class="va-dots"><span></span><span></span><span></span></div> Listening...';
                break;
            case 'thinking':
                statusEl.classList.add('thinking');
                statusEl.innerHTML = '<div class="va-dots"><span></span><span></span><span></span></div> Thinking...';
                break;
            case 'speaking':
                statusEl.innerHTML = '🔊 Speaking...';
                break;
            default:
                statusEl.innerHTML = 'Click 🎙️ to start speaking';
        }
    }

    // Add message to chat
    function addMessage(role, text) {
        const messagesEl = document.getElementById('va-messages');
        if (!messagesEl) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `va-message ${role}`;
        messageDiv.textContent = text;

        messagesEl.appendChild(messageDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Process user query
    async function processQuery(text) {
        updateUI('thinking');

        try {
            const pageContext = getPageContext();
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    provider: CONFIG.provider,
                    pageContext: {
                        name: pageContext.name,
                        description: pageContext.description,
                        url: window.location.pathname
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                addMessage('ai', data.response);
                speak(data.response);
            } else {
                addMessage('ai', 'Sorry, I encountered an error. Please try again.');
                updateUI('idle');
            }
        } catch (error) {
            console.error('Voice Assistant Error:', error);
            addMessage('ai', 'Connection error. Please check your internet connection.');
            updateUI('idle');
        }
    }

    // Text to Speech
    function speak(text) {
        if (!('speechSynthesis' in window)) {
            updateUI('idle');
            return;
        }

        state.synthesis.cancel();
        updateUI('speaking');

        // Clean text for better speech
        const cleanText = text
            .replace(/```[\s\S]*?```/g, 'code block')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/[#*_~]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Try to get a good voice
        const voices = state.synthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.name.includes('Google US English') ||
            (v.lang === 'en-US' && v.name.includes('Female'))
        ) || voices.find(v => v.lang === 'en-US');

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.05;
        utterance.pitch = 1;

        utterance.onend = () => updateUI('idle');
        utterance.onerror = () => updateUI('idle');

        state.synthesis.speak(utterance);
    }

    // Toggle voice assistant
    function toggleVoiceAssistant() {
        const bubble = document.getElementById('va-chat-bubble');

        if (!bubble) return;

        if (!state.isOpen) {
            bubble.classList.add('open');
            state.isOpen = true;
        }

        if (state.isListening) {
            state.recognition?.stop();
        } else {
            state.synthesis.cancel();
            try {
                state.recognition?.start();
            } catch (e) {
                console.warn('Recognition already started');
            }
        }
    }

    // Close chat bubble
    function closeBubble() {
        const bubble = document.getElementById('va-chat-bubble');
        if (bubble) {
            bubble.classList.remove('open');
            state.isOpen = false;
        }
        if (state.isListening) {
            state.recognition?.stop();
        }
        state.synthesis.cancel();
    }

    // Initialize Voice Assistant
    function init() {
        // Don't initialize on app.html (builder page)
        if (window.location.pathname.includes('app.html') ||
            window.location.pathname.endsWith('/app')) {
            console.log('Voice Assistant disabled on builder page');
            return;
        }

        // Create UI
        createVoiceAssistantUI();

        // Initialize Speech Recognition
        state.recognition = initSpeechRecognition();

        // Load voices
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = () => {
                state.synthesis.getVoices();
            };
        }

        // Event Listeners
        document.getElementById('va-fab')?.addEventListener('click', toggleVoiceAssistant);
        document.getElementById('va-close-btn')?.addEventListener('click', closeBubble);

        console.log('🎙️ CodeKotha Voice Assistant initialized');
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose to global scope for debugging
    window.CodeKothaVoiceAssistant = {
        toggle: toggleVoiceAssistant,
        close: closeBubble,
        speak: speak
    };

})();
