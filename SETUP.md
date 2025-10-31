# 🚀 Setup Guide

## Prerequisites
- Chrome browser
- Node.js 16+ (for backend)
- Gemini API key

## Installation

### 1. Extension Setup
1. Clone/download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `extension` folder

### 2. Backend Setup (Optional)
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file:
```
GEMINI_API_KEY=your_api_key_here
PORT=8787
```

Start server:
```bash
node server.js
```

### 3. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env` file

## Usage
1. Visit any webpage
2. Click CoachLens icon
3. Use features: Summarize, Explain, Quiz, Chat

## Troubleshooting
- Extension not loading: Select `extension` folder, not root
- API errors: Check Gemini API key
- Backend issues: Ensure port 8787 is free

Ready to learn! 🧠