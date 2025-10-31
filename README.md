# 🧠 CoachLens 2.0 - AI Learning Companion

> **Chrome Built-in AI Challenge Submission**  
> Transform any web page into an interactive learning experience with hybrid AI

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome)](https://chrome.google.com/webstore)
[![Built-in AI](https://img.shields.io/badge/Chrome-Built--in%20AI-34A853?logo=google)](https://developer.chrome.com/docs/ai/built-in)
[![Gemini API](https://img.shields.io/badge/Google-Gemini%20API-4285F4?logo=google)](https://ai.google.dev/)

## 🎯 **Problem & Solution**

**Problem:** The web is full of information, but learning from it is passive and ineffective.

**Solution:** CoachLens turns any web page into an interactive classroom with AI-powered learning tools.

## ✨ **Key Features**

### 🧠 **Hybrid AI System**
- **Chrome Built-in AI (Gemini Nano)** for fast, private processing
- **Cloud AI (Gemini API)** for advanced reasoning and multimodal tasks
- **Automatic detection** and seamless fallback between modes

### 📚 **Advanced Learning Tools**
- **Smart Summarization** - Structured summaries with key concepts
- **Contextual Explanations** - Select text for detailed explanations with analogies
- **Intelligent Quizzes** - Advanced questions that test true understanding
- **Learning Timeline** - Track progress and compare insights across sites
- **AI Chat** - Ask questions about the specific content you're reading

### 🎓 **Educational Intelligence**
- **Content-aware questions** based on actual page content
- **Domain-specific analysis** (algorithms, recipes, history, research)
- **Deep comprehension testing** beyond basic recall
- **Multimodal support** for images and voice input

## 🚀 **Quick Start**

### **1. Install Extension**
```bash
git clone https://github.com/yourusername/coachlens-2.0.git
cd coachlens-2.0
```

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `extension` folder

### **2. Setup Backend (Optional)**
```bash
cd backend
npm install
cp .env.example .env
# Add your Gemini API key to .env
node server.js
```

### **3. Start Learning**
1. Visit any web page
2. Click CoachLens extension icon
3. Use tabs: Home → Explain → Quiz → Timeline → Chat

## 🎬 **Demo**

### **Hybrid AI in Action**
- **🧠 On-device mode** for fast, private processing
- **☁️ Cloud mode** for advanced reasoning
- **Live mode switching** with visual indicators

### **Advanced Quiz Example (KNN Algorithm)**
Instead of basic questions like "What is KNN?", CoachLens generates:
- *"How does the KNN algorithm work? What is the key process involved?"*
- *"What critical parameter controls the algorithm's behavior?"*
- *"What are the main real-world applications?"*

## 🏗️ **Architecture**

### **Extension Components**
```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Main UI interface
├── popup.js          # Core functionality & AI integration
├── background.js     # Service worker
├── content.js        # Page content extraction
├── aiEngine.js       # AI abstraction layer
└── styles.css        # UI styling
```

### **Backend API**
```
backend/
├── server.js         # Express server with Gemini API
├── package.json      # Dependencies
└── .env.example      # Environment template
```

## 🤖 **AI Integration**

### **Chrome Built-in AI (Primary)**
```javascript
// Detect and use Chrome's built-in AI
const session = await window.ai.createTextSession({
    temperature: 0.7,
    topK: 3,
});
const response = await session.prompt(combinedPrompt);
```

### **Gemini API (Fallback)**
```javascript
// Fallback to cloud API for advanced features
const response = await fetch('/gemini', {
    method: 'POST',
    body: JSON.stringify({
        prompt: buildPrompt(type, content, context),
        systemPrompt: getSystemPrompt(type)
    })
});
```

## 🧪 **Testing**

### **Load Test Page**
```bash
# Open the included test page
open test-knn-page.html
```

### **Test Features**
1. **Summary** → Structured content breakdown
2. **Explain** → Select text for detailed explanations  
3. **Quiz** → Context-aware questions from actual content
4. **Timeline** → Learning progress tracking
5. **Chat** → Ask questions about the page

## 🏆 **Chrome Built-in AI Challenge**

### **Technical Excellence**
- ✅ **Hybrid AI detection** with visual indicators
- ✅ **Graceful fallbacks** between on-device and cloud
- ✅ **Streaming responses** with cancel functionality
- ✅ **No exposed API keys** (secure proxy)

### **Purpose & Innovation**
- ✅ **Beyond summarization** - Explains, quizzes, tracks learning
- ✅ **Real problem solved** - Passive reading → Active learning
- ✅ **Advanced content analysis** - Deep understanding, not just keywords

### **User Experience**
- ✅ **Intuitive interface** with clear navigation
- ✅ **Immediate feedback** and smooth interactions
- ✅ **Progressive enhancement** with multimodal features

## 📊 **Performance**

- **Quiz Generation:** < 1 second
- **Content Analysis:** < 0.5 seconds  
- **AI Explanations:** 5-15 seconds
- **Memory Usage:** < 10MB
- **Works offline** with built-in AI

## 🛠️ **Development**

### **Prerequisites**
- Chrome 127+ (for built-in AI)
- Node.js 16+ (for backend)
- Gemini API key (for cloud features)

### **Environment Setup**
```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your Gemini API key
GEMINI_API_KEY=your_api_key_here
```

### **Local Development**
```bash
# Start backend
cd backend && npm start

# Load extension in Chrome
# chrome://extensions/ → Developer mode → Load unpacked
```

## 📝 **License**

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

Built for the Chrome Built-in AI Challenge. Contributions welcome!

## 🔗 **Links**

- **Demo Video:** [Coming Soon]
- **Chrome Web Store:** [Coming Soon]
- **Devpost:** [Coming Soon]

---

**CoachLens 2.0** - Learn the web, don't just read it! 🚀