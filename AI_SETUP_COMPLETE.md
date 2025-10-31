# 🤖 AI QUIZ SETUP - COMPLETE GUIDE

## 🎯 **Goal:**
Get the AI backend working properly so the quiz generates intelligent, context-aware questions based on your page content.

## 📋 **Step-by-Step Setup:**

### **Step 1: Get Gemini API Key**
1. **Go to:** [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the API key** (starts with `AIza...`)

### **Step 2: Setup Backend Environment**
1. **Navigate to backend folder:**
   ```bash
   cd coachlens-2.0/backend
   ```

2. **Create `.env` file** with your API key:
   ```
   GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
   PORT=8787
   NODE_ENV=development
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### **Step 3: Start Backend Server**
```bash
node server.js
```

**Expected output:**
```
🚀 CoachLens AI Backend Server running on port 8787
🔗 Health check: http://localhost:8787/health
🤖 Gemini API: http://localhost:8787/gemini
```

### **Step 4: Test Backend Connection**
1. **Open:** `coachlens-2.0/test-backend-connection.html`
2. **Click "Test Backend Connection"**
3. **Should see:** "✅ Backend Working!" with AI response

### **Step 5: Test Extension with AI**
1. **Reload CoachLens extension** in Chrome
2. **Go to your KNN article**
3. **Open CoachLens → Quiz tab**
4. **Check browser console (F12)** for:

**✅ Success Messages:**
```
🤖 TRYING AI: Calling AI with context...
🌐 BACKEND: Attempting to connect to http://localhost:8787/gemini
🌐 BACKEND: Response status: 200
🌐 BACKEND: Success! Raw response: [{"question": "What is KNN..."...
🤖 AI SUCCESS: Got response from AI: [3 AI-generated questions]
```

**❌ Failure Messages:**
```
🌐 BACKEND: Connection failed: fetch error
🌐 BACKEND: Server appears to be down. Start with: node backend/server.js
🔄 FALLBACK: Using mock response
```

## 🎯 **Expected AI Quiz Results:**

### **For KNN Article:**
**AI-Generated Questions:**
- "What does the 'K' in K-Nearest Neighbors represent?"
- "Which distance metric is commonly used in KNN algorithm?"
- "What type of machine learning problem is KNN best suited for?"

**Instead of Mock Questions:**
- ❌ "What is the main topic of this page?" → "General information"

### **For Pizza Recipe:**
**AI-Generated Questions:**
- "What temperature should you preheat the oven to for pizza?"
- "What type of flour is recommended for pizza dough?"
- "How long should you let the pizza dough rise?"

## 🚨 **Troubleshooting:**

### **"Backend not available" Error:**
1. **Check if server is running:** Look for server output in terminal
2. **Check port:** Make sure nothing else is using port 8787
3. **Restart server:** `Ctrl+C` then `node server.js`

### **"API key not configured" Error:**
1. **Check `.env` file exists** in `backend` folder
2. **Verify API key format:** Should start with `AIza`
3. **No extra spaces** around the API key

### **"Invalid API key" Error:**
1. **Generate new API key** at Google AI Studio
2. **Check API key permissions** (should allow Gemini API)
3. **Try different API key**

### **Extension Still Shows Mock Responses:**
1. **Check console logs** for backend connection status
2. **Reload extension** after starting backend
3. **Clear browser cache** and reload

## 🎯 **Success Indicators:**

### **✅ Backend Working:**
- Server starts without errors
- Test page shows "Backend Working!"
- Console shows successful API calls

### **✅ Extension Working with AI:**
- Console shows "AI SUCCESS" messages
- Quiz questions are specific to page content
- Questions are more detailed and intelligent
- No more generic "Information management" options

### **✅ AI-Generated Quiz Quality:**
- Questions test understanding of actual concepts
- Options are relevant to the topic
- Questions are educational and challenging
- Content is specific to the page you're viewing

## 🚀 **Result:**
Once setup correctly, the AI will generate **intelligent, context-aware quiz questions** that truly test your understanding of the specific content you're reading!