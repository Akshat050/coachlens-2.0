# 🚀 CoachLens 2.0 - Setup Guide

## 📋 **Prerequisites**

- **Chrome 127+** (for built-in AI support)
- **Node.js 16+** (for backend server)
- **Git** (for cloning repository)
- **Gemini API Key** (from Google AI Studio)

## ⚡ **Quick Setup (5 minutes)**

### **1. Clone & Install**
```bash
git clone https://github.com/yourusername/coachlens-2.0.git
cd coachlens-2.0
cd backend && npm install
```

### **2. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your Gemini API key
```

### **3. Start Backend**
```bash
node server.js
# Should see: "🚀 CoachLens AI Backend Server running on port 8787"
```

### **4. Install Extension**
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" → Select `extension` folder
4. Pin the extension to toolbar

### **5. Test Installation**
1. Visit any webpage (try Wikipedia)
2. Click CoachLens icon
3. Should see AI mode indicator (🧠 or ☁️)
4. Try generating a quiz!

## 🔑 **API Key Setup**

### **Get Gemini API Key**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### **Add to Environment**
```bash
# In backend/.env
GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
PORT=8787
NODE_ENV=development
```

## 🧪 **Testing the Setup**

### **Backend Test**
```bash
# Test API endpoint
curl -X POST http://localhost:8787/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is machine learning?", "systemPrompt": "You are a helpful assistant."}'
```

### **Extension Test**
1. **Go to Wikipedia KNN page**
2. **Click CoachLens → Quiz tab**
3. **Should generate questions about KNN algorithm**
4. **Check console (F12) for debug logs**

## 🚨 **Troubleshooting**

### **Extension Issues**
| Problem | Solution |
|---------|----------|
| Extension not loading | Select `extension` folder, not root |
| No AI mode indicator | Reload extension after backend starts |
| Generic quiz questions | Check console for content extraction logs |
| "Processing..." stuck | Check backend connection, reload extension |

### **Backend Issues**
| Problem | Solution |
|---------|----------|
| Port 8787 in use | `npx kill-port 8787` then restart |
| API key error | Verify key format and permissions |
| CORS errors | Check allowed origins in server config |
| Module not found | Run `npm install` in backend folder |

---

**Ready to learn the web!** 🚀