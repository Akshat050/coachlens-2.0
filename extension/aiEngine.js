// AI Engine for CoachLens 2.0 - Handles both built-in AI and API fallback

class AIEngine {
    constructor() {
        this.isBuiltInAvailable = false;
        this.session = null;
        this.apiEndpoint = 'http://localhost:8787/gemini';
        this.checkBuiltInAI();
    }

    async checkBuiltInAI() {
        try {
            // Check if built-in AI is available
            if ('ai' in window && 'canCreateTextSession' in window.ai) {
                const canCreate = await window.ai.canCreateTextSession();
                this.isBuiltInAvailable = canCreate === 'readily';
            }
        } catch (error) {
            console.log('Built-in AI not available:', error);
            this.isBuiltInAvailable = false;
        }
        
        this.updateStatus();
    }

    updateStatus() {
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            const indicator = statusElement.querySelector('.status-indicator');
            const text = statusElement.querySelector('.status-text');
            
            if (this.isBuiltInAvailable) {
                indicator.classList.remove('offline');
                text.textContent = '🧠 Using On-Device AI';
            } else {
                indicator.classList.add('offline');
                text.textContent = '☁️ Using Gemini API (Fallback)';
            }
        }
    }

    async createSession() {
        if (this.isBuiltInAvailable) {
            try {
                this.session = await window.ai.createTextSession();
                return true;
            } catch (error) {
                console.error('Failed to create built-in AI session:', error);
                this.isBuiltInAvailable = false;
                this.updateStatus();
            }
        }
        return false;
    }

    async generateText(prompt, systemPrompt = '') {
        // Try built-in AI first
        if (this.isBuiltInAvailable) {
            try {
                if (!this.session) {
                    await this.createSession();
                }
                
                if (this.session) {
                    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
                    const response = await this.session.prompt(fullPrompt);
                    return response;
                }
            } catch (error) {
                console.error('Built-in AI error:', error);
                // Fall back to API
            }
        }

        // Fallback to Gemini API
        return await this.callGeminiAPI(prompt, systemPrompt);
    }

    async callGeminiAPI(prompt, systemPrompt = '') {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    systemPrompt
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.response || 'No response received';
        } catch (error) {
            console.error('Gemini API error:', error);
            return 'Sorry, I encountered an error processing your request. Please check if the backend server is running on localhost:8787.';
        }
    }

    // Specialized methods for different use cases
    async summarizePage(pageContent) {
        const systemPrompt = `You are an AI study assistant that organizes webpage content into clusters:

**Context**
**Concepts** 
**Formulas or Code**
**Examples**
**Warnings**
**FAQs**

Provide output in markdown with headers. Focus on the most important information and make it educational.`;

        const prompt = `Please summarize and organize this webpage content:\n\n${pageContent}`;
        
        return await this.generateText(prompt, systemPrompt);
    }

    async explainConcept(selectedText) {
        const systemPrompt = `You are a teacher explaining a concept to a beginner. Use simple analogies and provide one clear example.`;
        
        const prompt = `Explain this concept using a simple analogy and one example:\n\n${selectedText}`;
        
        return await this.generateText(prompt, systemPrompt);
    }

    async generateQuiz(content) {
        const systemPrompt = `You are an examiner. Create 3 short quiz questions (with answers) from this content. 

Return ONLY a valid JSON array in this exact format:
[
  {"question": "Question text here?", "answer": "Answer text here"},
  {"question": "Question text here?", "answer": "Answer text here"},
  {"question": "Question text here?", "answer": "Answer text here"}
]

Do not include any other text or formatting.`;

        const prompt = `Create quiz questions from this content:\n\n${content}`;
        
        const response = await this.generateText(prompt, systemPrompt);
        
        try {
            // Try to parse JSON response
            const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('Failed to parse quiz JSON:', error);
            // Return fallback questions
            return [
                {
                    question: "What is the main topic discussed in this content?",
                    answer: "Please review the content to identify the main topic."
                },
                {
                    question: "What are the key concepts mentioned?",
                    answer: "Please identify the key concepts from your reading."
                },
                {
                    question: "How would you apply this information?",
                    answer: "Consider practical applications of the concepts discussed."
                }
            ];
        }
    }

    async chatWithCoach(userMessage, context = '') {
        const systemPrompt = `You are a mentor continuing a discussion about a webpage the user has been studying. 

${context ? `Previous context: ${context}` : ''}

Be helpful, encouraging, and provide clear explanations. Ask follow-up questions to help the user learn better.`;

        return await this.generateText(userMessage, systemPrompt);
    }

    // Streaming support for real-time responses
    async generateTextStream(prompt, systemPrompt = '', onChunk) {
        // For built-in AI, we don't have streaming yet, so just return the full response
        if (this.isBuiltInAvailable) {
            const response = await this.generateText(prompt, systemPrompt);
            if (onChunk) {
                // Simulate streaming by sending chunks
                const words = response.split(' ');
                for (let i = 0; i < words.length; i += 3) {
                    const chunk = words.slice(i, i + 3).join(' ') + ' ';
                    onChunk(chunk);
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            return response;
        }

        // For API, implement actual streaming if supported
        try {
            const response = await fetch(this.apiEndpoint + '/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    systemPrompt,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`Streaming request failed: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                fullResponse += chunk;
                
                if (onChunk) {
                    onChunk(chunk);
                }
            }

            return fullResponse;
        } catch (error) {
            console.error('Streaming error, falling back to regular request:', error);
            return await this.generateText(prompt, systemPrompt);
        }
    }

    // Cleanup
    destroy() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
    }
}

// Global AI engine instance
window.aiEngine = new AIEngine();