# 🧠 CoachLens 2.0

AI-powered Chrome extension that transforms any webpage into an interactive learning experience.

## ✨ Features

- **Smart Summarization** - Get structured summaries of webpage content
- **Contextual Explanations** - Select text for detailed explanations
- **Intelligent Quizzes** - Generate questions based on page content
- **Learning Timeline** - Track your learning progress
- **AI Chat** - Ask questions about what you're reading

## 🚀 Quick Setup

### 1. Install Extension
1. Download/clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `extension` folder

### 2. Setup Backend (Optional)
```bash
cd backend
npm install
cp .env.example .env
# Add your Gemini API key to .env
node server.js
```

### 3. Usage
1. Visit any webpage
2. Click CoachLens extension icon
3. Use the tabs: Home → Explain → Quiz → Timeline → Chat

## 🛠️ Requirements

- Chrome browser (latest version)
- Node.js 16+ (for backend)
- Gemini API key (for cloud features)

## 🎯 How It Works

1. **Content Analysis** - Extracts and analyzes webpage content
2. **AI Processing** - Uses Chrome Built-in AI or Gemini API
3. **Interactive Learning** - Generates summaries, explanations, and quizzes
4. **Progress Tracking** - Saves your learning journey

---

Transform passive reading into active learning! 🚀