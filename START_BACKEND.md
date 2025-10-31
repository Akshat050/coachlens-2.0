# 🚀 START BACKEND SERVER

## 📋 **Prerequisites:**
1. **Node.js installed** (version 16 or higher)
2. **Gemini API key** from Google AI Studio

## 🔧 **Setup Steps:**

### **Step 1: Install Dependencies**
```bash
cd coachlens-2.0/backend
npm install
```

### **Step 2: Create Environment File**
Create `.env` file in the `backend` folder:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=8787
NODE_ENV=development
```

**To get Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste it in the `.env` file

### **Step 3: Start the Server**
```bash
node server.js
```

**Expected output:**
```
🚀 CoachLens AI Backend Server running on port 8787
🔗 Health check: http://localhost:8787/health
🤖 Gemini API: http://localhost:8787/gemini
```

### **Step 4: Test the Connection**
Open: `coachlens-2.0/test-backend-connection.html`
Click "Test Backend Connection"

**Expected result:**
```
✅ Backend Working!
Response: [AI response about KNN]
```

## 🚨 **Troubleshooting:**

### **If you see "EADDRINUSE" error:**
```bash
# Kill any process using port 8787
npx kill-port 8787
# Then restart
node server.js
```

### **If you see "API key not configured":**
- Check if `.env` file exists in `backend` folder
- Verify `GEMINI_API_KEY` is set correctly
- Make sure there are no extra spaces

### **If you see "Module not found":**
```bash
# Install dependencies
npm install express cors helmet morgan rate-limiter-flexible @google/generative-ai dotenv
```

## ✅ **Once Backend is Running:**
1. **Reload the CoachLens extension** in Chrome
2. **Go to your KNN article**
3. **Open CoachLens → Quiz tab**
4. **Should now see AI-generated questions** based on actual page content!

## 🎯 **Expected AI Quiz Results:**
- Questions will be specifically about KNN algorithm
- Options will be relevant to machine learning concepts
- Much more detailed and context-aware than mock responses