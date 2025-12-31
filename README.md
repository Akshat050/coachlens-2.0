# CoachLens 2.0
AI-powered browser-based learning companion that provides **context-aware explanations, summaries, and interactive guidance** using a hybrid on-device + cloud AI architecture.

CoachLens is designed to improve comprehension and engagement while prioritizing **privacy, reliability, and low-latency interaction**.

---

## Overview
Reading complex content online is often passive and inefficient. CoachLens transforms any webpage into an interactive learning experience by combining structured context extraction with LLM-based reasoning.

The system uses **on-device AI when available** and **cloud-based AI as a fallback**, enabling flexible and privacy-aware deployment.

---

## Key Capabilities
- **Hybrid AI Execution**
  - Uses Chrome built-in AI (Gemini Nano) when available
  - Automatically falls back to cloud-based Gemini models
  - Real-time AI availability handling

- **Context-Aware Summarization**
  - Structured summaries grounded in page content
  - Highlights key concepts, examples, and caveats

- **Interactive Explanations**
  - Explain selected text using page-level context
  - Simplifies complex ideas with examples and analogies

- **Dynamic Quiz Generation**
  - Generates questions directly from page content
  - Supports multiple question types with instant feedback

- **Learning Timeline**
  - Tracks summaries, explanations, quizzes, and interactions
  - Provides a chronological view of learning activity

- **Conversational AI Tutor**
  - Context-aware chat grounded in the current page
  - Supports follow-up questions and clarification

---

## System Architecture

### Hybrid AI Flow
Browser Page
↓
Chrome Extension (Context Extraction)
↓
Hybrid AI Engine
├─ On-device AI (Gemini Nano)
└─ Cloud AI (Gemini API – fallback)

### Technology Stack
- **Frontend:** Chrome Extension (JavaScript, HTML, CSS)
- **Backend:** Node.js, Express
- **AI Models:** Chrome Built-in AI, Google Gemini
- **APIs:** Chrome Extensions API, Google Generative AI
- **Deployment:** Local extension + optional backend service

---

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Akshat050/coachlens-2.0.git
cd coachlens-2.0
```
### 2. Load the Chrome Extension

Open chrome://extensions

Enable Developer mode

Click Load unpacked

Select the extension/ directory

### 3. (Optional) Run Backend for Cloud AI
cd backend
npm install
cp .env.example .env
# Add Gemini API key to .env
npm start

### Reliability & Safety Considerations

CoachLens reduces hallucinations and improves response quality by:

Grounding outputs in structured page context

Using controlled prompt templates

Applying fallback behavior when confidence is low

Avoiding persistent storage of sensitive content

## Project Structure
```
coachlens-2.0/
├── extension/        # Chrome extension source
├── backend/          # Optional backend service
├── test-hybrid-ai.html
└── README.md
```


### Future Improvements

Automated evaluation of explanations and quizzes

Expanded subject-specific coaching modes

Improved on-device inference support

UI/UX refinements for long-form content
### License

MIT
