# Code AI - Intelligent Web Builder & Code Editor




</div>

---

## 📖 Overview

**Code AI** is a modern, AI-powered web development environment that combines the simplicity of a website builder with the power of a professional code editor. It features a VS Code-like interface, real-time preview, intelligent code generation, and a **MySQL database backend** for persistent storage and user management.

### ✨ What makes Code ai special?

- 🤖 **Multi-AI Support**: Seamlessly switch between Gemini, Groq, OpenAI, Perplexity, and OpenRouter
- 🔄 **Auto-Fallback**: Automatic provider switching on quota errors
- 🧪 **Testing/Auto-Improve**: One-click code testing with token savings display
- 📱 **Mobile-Responsive**: Full mobile support with bottom navigation
- 🎙️ **Voice Assistant**: Talk to AI on any page using Web Speech API
- 📚 **Learning Mode**: Interactive code tutorials with text-to-speech
- 🌐 **URL to Code**: Analyze any website and recreate it
- 💳 **Token System**: Fair usage-based pricing with Razorpay integration (INR ₹)

---

## 🚀 Features

### 🎙️ Voice Assistant (NEW!)
- **AI-Powered Voice Interaction**: Talk to AI using your microphone on any page
- **Page-Aware Responses**: The assistant knows which page you're on and provides contextual help
- **Text-to-Speech**: AI responses are spoken aloud for hands-free interaction
- **Team Knowledge**: Ask "Who built this?" and get accurate team member information
- **Web Speech API**: Uses browser's native speech recognition (no external services)
- **Available on**: Home, About, Pricing, Dashboard, Admin pages (disabled on the Builder for focus)

### 🔐 User Authentication & Dashboard
- **Secure Sign-up/Sign-in**: User registration and login using hashed passwords (`bcryptjs`)
- **Personalized Dashboard**: Dedicated user hub with statistics, recent projects, and quick actions
- **Activity Tracking**: Real-time feed of user activities (generations, project creation)
- **Session Management**: Persistent login state across browser sessions

### 💳 Payments & Subscriptions
- **Razorpay Integration**: Secure payment processing for subscription plans
- **Token System**: Usage-based token tracking with API Calls
  - **Free Trial**: 100 API calls (FREE)
  - **Starter**: 1,000 API calls (₹499)
  - **Professional**: 5,000 API calls (₹1,499) - Popular
  - **Enterprise**: 25,000 API calls (₹4,999)
- **Real-time Usage Tracking**: Visual progress bars and token counters
- **Automated Billing**: Subscription status management and expiration handling

### 🛡️ Admin Panel
- **Comprehensive Dashboard**: Real-time revenue charts, user growth, and system health
- **Transaction Management**: Searchable payment history with status filters
- **Plan Management**: Create, edit, and delete pricing plans dynamically
- **User Management**: View and manage user accounts and subscriptions
- **Settings**: System-wide configurations and danger zone actions

### 💻 Professional Code Editor (VS Code-Like)
- **Monaco Editor Integration**: Full-featured code editing identical to VS Code
- **Multi-File Support**: Create, edit, rename, and delete HTML, CSS, and JavaScript files
- **VS Code Style Interface**:
  - File Explorer with icons and data attributes
  - Tabbed editing with close buttons
  - Split view for code and preview
  - Inline file renaming (no popups)
- **Syntax Highlighting**: Rich coloring for HTML, CSS, JS with auto language detection
- **Auto-Save**: Changes saved automatically to MySQL database

### 📁 File Management
- **File Sync**: Immediate removal from editor and preview when files are deleted
- **File Tabs**: Open multiple files; close tabs without deleting source files
- **Active File Tracking**: Visual indicators for current file
- **State Management**: Changes preserved when switching files
- **New File Creation**: `.html`, `.css`, `.js`, `.json`, `.md` files

### 🤖 AI Integration (Multi-Provider)
| Provider | Model | Features |
|----------|-------|----------|
| **Google Gemini** | gemini-2.0-flash | Fast, free tier available |
| **Groq** | llama-3.3-70b-versatile | Ultra-fast inference |
| **OpenAI** | gpt-4o-mini | High quality outputs |
| **Perplexity** | sonar | Real-time web search & reasoning |
| **OpenRouter** | google/gemini-2.0-flash-001 | Voice Assistant default |

- **Provider Toggle**: Easy switch between AI providers in the UI
- **🔄 Auto-Fallback**: Automatic switching to alternate providers on quota errors
- **Website Generation**: Complete multi-file websites from prompts
- **Enhanced CSS Styling**:
  - Premium designs with modern UI patterns
  - Gradient backgrounds, glassmorphism, hover effects
  - **Smart Color Validation**: Auto-fixes invalid colors
  - **6+ Color Themes**: Built-in vibrant hex palettes
- **URL to Code**: Analyze any website and generate similar code
- **Natural Language**: Describe changes in plain English

### 🧪 Testing / Auto-Improve (NEW!)
- **One-Click Testing**: Toggle to automatically test and improve your code
- **AI-Powered Analysis**: Checks for:
  - Color contrast and modern palette improvements
  - Semantic HTML structure (header, main, footer)
  - Responsive design patterns
  - Accessibility (alt tags, aria-labels)
  - Bug fixes and code optimization
- **Token Savings Display**: Shows percentage of tokens saved (30-45%)
- **Green Popup Notification**: "Testing completed! Approximately X% fewer tokens used"

### 📱 Mobile Responsive App (NEW!)
- **Bottom Navigation**: Mobile-friendly nav with Files, Code, Preview, AI, Learn
- **Overlay Sidebars**: Slide-in panels for file explorer and AI builder
- **Touch-Friendly**: Larger tap targets, touch-optimized controls
- **Responsive Breakpoints**: Tablet (768px) and Phone (480px) layouts
- **No Zoom on Input**: iOS-friendly input handling

### 📚 Learning Mode
- **Overview Mode**: High-level explanations of code structure
- **🎓 Step-by-Step Tutor**: Interactive line-by-line guidance
  - "What", "Why", "Visual Change" breakdowns
  - Contextual questions: "Why?", "What if I remove this?", "Simplify"
  - Live code highlighting
- **🔊 Text-to-Speech**: Listen to explanations (toggle on/off)
- **Sidebar Toggle**: Show/hide with smooth animation

---

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Monaco Editor |
| **Backend** | Node.js, Express.js, REST API |
| **Database** | MySQL (XAMPP), mysql2 |
| **AI Models** | Google Gemini 2.0, Groq (Llama 3), OpenAI (GPT-4o), Perplexity (Sonar), OpenRouter |
| **Payments** | Razorpay Payment Gateway |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Tools** | Puppeteer (Scraping), Bcrypt (Auth), JSZip |

---

## 🛠️ Installation

### Prerequisites
- **Node.js** v16 or higher
- **XAMPP** with MySQL running on `localhost:3306`
- **API Keys** (see below)

### API Keys Required

| Service | Required | Get it from |
|---------|----------|-------------|
| Gemini | ✅ Yes | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Razorpay | ✅ Yes | [Razorpay Dashboard](https://dashboard.razorpay.com/) |
| OpenRouter | ⭐ Recommended | [OpenRouter Keys](https://openrouter.ai/keys) |
| Groq | Optional | [Groq Console](https://console.groq.com/keys) |
| OpenAI | Optional | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Perplexity | Optional | [Perplexity AI](https://www.perplexity.ai/settings/api) |

### Setup Steps

```bash
# 1. Clone/Navigate to project folder
cd "collage project - Copy"

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Edit .env file with your keys:
```

**.env file configuration:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=codekotha_ai
PORT=3000

# AI API Keys
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# Razorpay Keys
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

```bash
# 4. Start XAMPP MySQL service

# 5. Initialize the database
npm run init-db

# 6. Start the development server
npm run dev
```

### 🌐 Accessing the App

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing Page / Login |
| http://localhost:3000/dashboard | User Dashboard |
| http://localhost:3000/app | Code Editor / Builder |
| http://localhost:3000/pricing | Pricing & Subscriptions |
| http://localhost:3000/about | About Us / Team |
| http://localhost:3000/admin | Admin Panel |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/signin` | Login user |
| GET | `/api/auth/me` | Get current user info |

### Payments & Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pricing` | Get active pricing plans |
| GET | `/api/payment/subscription/:userId` | Get user token balance |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment & activate plan |

### AI Integration
| Method | Endpoint | Description | Token Cost |
|--------|----------|-------------|------------|
| POST | `/api/ai/generate` | Generate website | 10 tokens |
| POST | `/api/ai/analyze-url` | Analyze URL | 25 tokens |
| POST | `/api/ai/modify` | Modify code | 10 tokens |
| POST | `/api/ai/chat` | Voice Assistant chat | Free |
| GET | `/api/ai/status` | Check AI provider status | Free |

### Projects & Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/files/:projectUid` | Get project files |
| POST | `/api/files` | Create/update file |
| DELETE | `/api/files/:id` | Delete file |

---

## 🗃️ Database Schema

The MySQL database `codekotha_ai` contains 7 main tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (with `is_admin` flag) |
| `projects` | Project metadata |
| `project_files` | File contents |
| `pricing_plans` | Subscription plan definitions |
| `user_subscriptions` | Active subscriptions & token balance |
| `payment_transactions` | Razorpay transaction history |
| `generation_history` | AI generation history |

---

## 💡 Usage Guide

### 🚀 Getting Started
1. **Sign Up**: Create an account on the landing page
2. **Choose Plan**: Go to Pricing - Free trial gives 100 tokens
3. **Build**: Use AI to generate websites (tokens deducted automatically)
4. **Monitor**: Check "API Usage" on Pricing page for remaining tokens

### 🎙️ Using Voice Assistant
1. Click the **🎙️ microphone button** (bottom-right corner)
2. Allow microphone access when prompted
3. **Speak your question** (e.g., "Who built this website?")
4. Listen to the AI response
5. The assistant knows which page you're on!

**Example questions:**
- "What is CodeKotha?"
- "Who built this website?"
- "Tell me about Debaditya"
- "What can I do on this page?"
- "How do I create a website?"

### 👑 Admin Access
1. Set `is_admin=1` for your user in the database
2. Navigate to `/admin.html`
3. Login with admin credentials
4. Monitor revenue, manage plans, and view transactions

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web server |
| mysql2 | ^3.6.5 | Database |
| razorpay | ^2.9.2 | Payments |
| bcryptjs | ^2.4.3 | Password security |
| puppeteer | ^21.6.1 | Web scraping |
| dotenv | ^16.3.1 | Environment config |
| cors | ^2.8.5 | Cross-origin requests |

---

## 🎨 Screenshots

### Voice Assistant
The AI-powered voice assistant appears on all pages (except the builder) and can answer questions about the platform, team, and provide contextual help.

### Code Editor
A VS Code-like editor with Monaco Editor, multi-file support, and live preview.

### Learning Mode
Interactive tutorials that explain code line-by-line with text-to-speech.

---

## 📝 License

This project is open-source and available under the **MIT License**.

---

