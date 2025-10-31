# 🛠️ CoachLens 2.0 - Development Setup

## 📋 **Prerequisites**

- **Chrome Browser** (latest version)
- **Node.js** 16+ and npm
- **Git** for version control
- **Gemini API Key** (optional, for cloud AI features)

## 🚀 **Quick Setup**

### **1. Clone & Install**
```bash
git clone https://github.com/yourusername/coachlens-2.0.git
cd coachlens-2.0
cd backend && npm install
```

### **2. Environment Configuration**
```bash
# In backend directory
cp .env.example .env
# Edit .env and add your Gemini API key
```

### **3. Load Chrome Extension**
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Extension loads with CoachLens icon in toolbar

### **4. Start Backend Server**
```bash
cd backend
npm start
# Server runs on http://localhost:8787
```

### **5. Test Everything**
1. Open `test-hybrid-ai.html` in Chrome
2. Click CoachLens extension icon
3. Test all features: Summarize, Explain, Quiz, Timeline, Chat

## 🔧 **Development Workflow**

### **Extension Development**
```bash
# Make changes to extension files
# Reload extension in chrome://extensions/
# Test changes immediately
```

### **Backend Development**
```bash
cd backend
npm run dev  # Auto-restart on changes
```

### **Testing**
- **Manual Testing**: Use `test-hybrid-ai.html`
- **API Testing**: `curl http://localhost:8787/health`
- **Extension Testing**: Chrome DevTools → Console

## 📁 **Project Structure**

```
coachlens-2.0/
├── extension/                 # Chrome Extension
│   ├── manifest.json         # Extension config
│   ├── popup.html           # Main UI
│   ├── popup.js             # Core logic
│   ├── aiEngine.js          # Hybrid AI system
│   ├── content.js           # Page interaction
│   ├── background.js        # Service worker
│   ├── styles.css           # Styling
│   └── icons/               # Extension icons
├── backend/                  # Node.js Server
│   ├── server.js            # Express server
│   ├── package.json         # Dependencies
│   ├── .env.example         # Config template
│   └── .env                 # Your config (gitignored)
├── test-hybrid-ai.html      # Demo page
├── README.md                # Main documentation
├── SETUP.md                 # This file
├── LICENSE                  # MIT License
└── .gitignore              # Git ignore rules
```

## 🤖 **AI Configuration**

### **Chrome Built-in AI**
- **Availability**: Chrome Canary/Dev builds
- **Model**: Gemini Nano (on-device)
- **Setup**: No configuration needed
- **Status**: Experimental feature

### **Gemini API (Cloud Fallback)**
- **Get API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Model**: gemini-2.5-flash
- **Rate Limits**: 50 requests/minute (free tier)
- **Cost**: Pay-per-use with free tier

### **Environment Variables**
```bash
# Required for cloud AI
GEMINI_API_KEY=your_api_key_here

# Optional configurations
PORT=8787
NODE_ENV=development
RATE_LIMIT_POINTS=50
RATE_LIMIT_DURATION=60
```

## 🔍 **Debugging**

### **Extension Debugging**
1. Right-click extension popup → "Inspect"
2. Check Console for JavaScript errors
3. Use Chrome DevTools for debugging

### **Backend Debugging**
```bash
# Check server status
curl http://localhost:8787/health

# Test AI endpoint
curl -X POST http://localhost:8787/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "systemPrompt": "You are helpful"}'
```

### **Common Issues**

#### **Extension Not Loading**
- Check `chrome://extensions/` for errors
- Verify all files are in correct locations
- Reload extension after changes

#### **AI Not Working**
- Check if backend server is running
- Verify Gemini API key in .env file
- Check browser console for errors

#### **CORS Errors**
- Ensure backend server is running on localhost:8787
- Check CORS configuration in server.js

## 📊 **API Documentation**

### **Backend Endpoints**

#### **GET /health**
```bash
curl http://localhost:8787/health
```
Response: `{"status": "healthy", "timestamp": "..."}`

#### **POST /gemini**
```bash
curl -X POST http://localhost:8787/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain machine learning",
    "systemPrompt": "You are a teacher",
    "temperature": 0.7,
    "maxTokens": 1000
  }'
```

#### **POST /gemini/stream**
Streaming responses for real-time AI generation.

#### **POST /gemini/batch**
Process multiple AI requests simultaneously.

## 🧪 **Testing**

### **Manual Testing Checklist**
- [ ] Extension loads without errors
- [ ] AI status indicator shows correct mode
- [ ] Page summarization works
- [ ] Text explanation with selection
- [ ] Quiz generation and interaction
- [ ] Learning timeline updates
- [ ] AI chat responds contextually
- [ ] Hybrid AI switching (if available)

### **Test Content**
- Use `test-hybrid-ai.html` for comprehensive testing
- Try different websites (Wikipedia, technical blogs)
- Test with various content types (text, code, formulas)

## 🚀 **Deployment**

### **Chrome Web Store**
1. Create developer account
2. Package extension as .zip
3. Upload and submit for review
4. Follow Chrome Web Store policies

### **Backend Deployment**
- **Heroku**: `git push heroku main`
- **Vercel**: `vercel deploy`
- **Railway**: `railway deploy`
- **DigitalOcean**: Docker deployment

## 🤝 **Contributing**

### **Development Guidelines**
- Follow existing code style
- Test all changes thoroughly
- Update documentation as needed
- Create meaningful commit messages

### **Pull Request Process**
1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request with description

## 📞 **Support**

- **Issues**: GitHub Issues
- **Documentation**: README.md
- **API Reference**: Backend server endpoints
- **Chrome Extension**: Chrome Developer Documentation

---

**Happy coding! 🚀**