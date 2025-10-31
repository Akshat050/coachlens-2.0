// CoachLens 2.0 - Main Popup Script

class CoachLens {
    constructor() {
        this.currentTab = 'home';
        this.pageContent = null;
        this.selectedText = '';
        this.chatContext = '';
        try {
            this.aiEngine = new AIEngine();
            console.log('AIEngine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AIEngine:', error);
            this.aiEngine = null;
        }
        this.quizScore = 0;
        this.quizAnswered = 0;
        this.currentQuiz = null;
        this.aiMode = 'cloud'; // Default to cloud mode
        this.currentSession = null; // For canceling AI requests
        this.init();
    }

    async init() {
        console.log('CoachLens 2.0 initializing...');
        this.detectAIMode();
        this.setupEventListeners();
        this.loadPageContent();
        this.checkSelectedText();
        this.loadTimeline();
        
        // Check for selected text periodically
        setInterval(() => this.checkSelectedText(), 2000);
    }

    async detectAIMode() {
        console.log('🔍 HYBRID AI: Detecting available AI modes...');
        
        try {
            // Check for Chrome Built-in AI (Prompt API)
            if (typeof window.ai !== 'undefined' && window.ai.canCreateTextSession) {
                const canCreate = await window.ai.canCreateTextSession();
                if (canCreate === 'readily') {
                    this.setAIMode('on-device', '🧠', 'On-device (Gemini Nano)');
                    console.log('✅ HYBRID AI: Chrome Built-in AI available');
                    return;
                } else if (canCreate === 'after-download') {
                    this.setAIMode('downloading', '⬇️', 'Downloading...');
                    console.log('⬇️ HYBRID AI: Chrome Built-in AI downloading');
                    return;
                }
            }
        } catch (error) {
            console.log('❌ HYBRID AI: Chrome Built-in AI not available:', error.message);
        }
        
        // Fallback to cloud mode
        this.setAIMode('cloud', '☁️', 'Cloud (Gemini API)');
        console.log('☁️ HYBRID AI: Using cloud mode');
    }

    setAIMode(mode, icon, text) {
        const indicator = document.getElementById('aiModeIndicator');
        const iconEl = document.getElementById('aiModeIcon');
        const textEl = document.getElementById('aiModeText');
        
        if (indicator && iconEl && textEl) {
            indicator.className = `ai-mode-indicator ${mode}`;
            iconEl.textContent = icon;
            textEl.textContent = text;
            
            // Update tooltip
            const tooltips = {
                'on-device': 'Using Chrome Built-in AI (Gemini Nano) - Fast & Private',
                'cloud': 'Using Cloud AI (Gemini API) - More Capable',
                'downloading': 'Chrome Built-in AI is downloading - Will switch when ready'
            };
            indicator.title = tooltips[mode] || text;
        }
        
        this.aiMode = mode;
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                console.log('Tab clicked:', e.target.dataset.tab);
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Action buttons
        document.getElementById('summarizeBtn').addEventListener('click', () => {
            console.log('Summarize button clicked');
            this.handleSummarize();
        });
        document.getElementById('explainBtn').addEventListener('click', () => {
            console.log('Explain button clicked');
            this.handleExplain();
        });
        document.getElementById('quizBtn').addEventListener('click', () => {
            console.log('Quiz button clicked');
            this.handleQuiz();
        });
        document.getElementById('sendBtn').addEventListener('click', () => {
            console.log('Send button clicked');
            this.handleChat();
        });
        document.getElementById('voiceBtn').addEventListener('click', () => {
            console.log('Voice button clicked');
            this.handleVoice();
        });

        // Chat input
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleChat();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        if (tabName === 'timeline') {
            this.loadTimeline();
        }
    }

    async loadPageContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Remove unwanted elements
                    const unwanted = document.querySelectorAll('script, style, nav, header, footer, aside');
                    unwanted.forEach(el => el.remove());
                    
                    const content = document.body.innerText || document.body.textContent || '';
                    return {
                        title: document.title || 'Untitled',
                        url: window.location.href,
                        content: content.slice(0, 5000), // Limit content
                        wordCount: content.split(/\s+/).length
                    };
                }
            });
            
            this.pageContent = results[0].result;
            console.log('🔍 DEBUG: Page content loaded:', this.pageContent.title);
            console.log('🔍 DEBUG: Page URL:', this.pageContent.url);
            console.log('🔍 DEBUG: Content preview:', this.pageContent.content.substring(0, 200) + '...');
            console.log('🔍 DEBUG: Word count:', this.pageContent.wordCount);
        } catch (error) {
            console.error('Failed to load page content:', error);
            this.showToast('Failed to load page content', 'error');
        }
    }

    async checkSelectedText() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const selection = window.getSelection();
                    return selection.toString().trim();
                }
            });
            
            const selectedText = results[0].result;
            this.selectedText = selectedText;
            
            const explainBtn = document.getElementById('explainBtn');
            const selectionStatus = document.getElementById('selectionStatus');
            const selectionText = document.getElementById('selectionText');
            
            if (selectedText && selectedText.length > 0) {
                explainBtn.disabled = false;
                selectionStatus.classList.add('has-selection');
                selectionText.textContent = `Selected: "${this.truncateText(selectedText, 30)}"`;
            } else {
                explainBtn.disabled = true;
                selectionStatus.classList.remove('has-selection');
                selectionText.textContent = 'Select text on the page first';
            }
        } catch (error) {
            console.error('Error checking selected text:', error);
        }
    }

    async handleSummarize() {
        if (!this.pageContent) {
            this.showToast('No page content available', 'error');
            return;
        }

        this.showLoading();
        const btn = document.getElementById('summarizeBtn');
        this.setButtonLoading(btn, true);

        try {
            // Call AI service
            const summary = await this.callAI('summarize', this.pageContent.content);
            
            // Display result with better formatting
            const resultArea = document.getElementById('summaryResult');
            const formattedSummary = this.formatSummaryContent(summary);
            resultArea.innerHTML = `
                <div style="line-height: 1.6;">
                    <h4 style="color: #1e293b; margin-bottom: 12px;">📝 Summary</h4>
                    ${formattedSummary}
                </div>
            `;

            // Save to storage
            await this.saveToLibrary({
                type: 'summary',
                title: this.pageContent.title,
                content: summary,
                url: this.pageContent.url,
                timestamp: new Date().toISOString()
            });

            this.chatContext = summary;
            this.showToast('Page summarized successfully!', 'success');
        } catch (error) {
            this.showToast('Failed to summarize: ' + error.message, 'error');
            console.error('Summarization error:', error);
        } finally {
            this.hideLoading();
            this.setButtonLoading(btn, false);
        }
    }

    async handleExplain() {
        if (!this.selectedText) {
            this.showToast('Please select text on the page first', 'warning');
            return;
        }

        this.showLoading();
        const btn = document.getElementById('explainBtn');
        this.setButtonLoading(btn, true);

        try {
            const explanation = await this.callAI('explain', this.selectedText);
            
            const resultArea = document.getElementById('explainResult');
            resultArea.innerHTML = `
                <div style="line-height: 1.6;">
                    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
                        <h4 style="color: #0c4a6e; margin-bottom: 4px;">📝 Selected Text:</h4>
                        <p style="font-style: italic; color: #0369a1; margin: 0;">"${this.selectedText}"</p>
                    </div>
                    <h4 style="color: #1e293b; margin-bottom: 8px;">💡 Explanation:</h4>
                    ${this.formatText(explanation)}
                </div>
            `;

            await this.saveToLibrary({
                type: 'explanation',
                title: `Explanation: ${this.truncateText(this.selectedText, 30)}`,
                content: explanation,
                originalText: this.selectedText,
                url: this.pageContent?.url,
                timestamp: new Date().toISOString()
            });

            this.showToast('Concept explained successfully!', 'success');
        } catch (error) {
            this.showToast('Failed to explain: ' + error.message, 'error');
            console.error('Explanation error:', error);
        } finally {
            this.hideLoading();
            this.setButtonLoading(btn, false);
        }
    }

    async handleQuiz() {
        if (!this.pageContent) {
            this.showToast('No page content available', 'error');
            return;
        }

        this.showLoading();
        const btn = document.getElementById('quizBtn');
        this.setButtonLoading(btn, true);

        try {
            console.log('🧠 QUIZ: Starting quiz generation for:', this.pageContent.title);
            console.log('🧠 QUIZ: Page content length:', this.pageContent.content.length);
            console.log('🧠 QUIZ: Content preview:', this.pageContent.content.substring(0, 300) + '...');
            
            // ALWAYS use direct generation for now to ensure it works
            const quiz = this.generateRealContextQuiz(this.pageContent);
            
            console.log('🧠 QUIZ: Generated quiz:', quiz);
            
            this.currentQuiz = quiz;
            this.quizScore = 0;
            this.quizAnswered = 0;
            
            this.displayInteractiveQuiz(quiz);

            await this.saveToLibrary({
                type: 'quiz',
                title: `Quiz: ${this.pageContent.title}`,
                content: quiz,
                url: this.pageContent.url,
                timestamp: new Date().toISOString()
            });

            this.showToast('Interactive quiz generated!', 'success');
        } catch (error) {
            this.showToast('Failed to generate quiz: ' + error.message, 'error');
            console.error('Quiz error:', error);
        } finally {
            this.hideLoading();
            this.setButtonLoading(btn, false);
        }
    }

    setupQuizEventListeners() {
        // Add event listeners for radio buttons
        document.querySelectorAll('input[type="radio"][data-question-index]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionIndex = parseInt(e.target.dataset.questionIndex);
                const selectedAnswer = e.target.value;
                const correctAnswer = e.target.dataset.correctAnswer;
                
                console.log('Quiz answer selected:', questionIndex, selectedAnswer, correctAnswer);
                this.handleQuizAnswer(questionIndex, selectedAnswer, correctAnswer);
            });
        });

        // Add event listeners for text input submit buttons
        document.querySelectorAll('.quiz-text-submit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionIndex = parseInt(e.target.dataset.questionIndex);
                const correctAnswer = e.target.dataset.correctAnswer;
                this.handleTextAnswer(questionIndex, correctAnswer);
            });
        });
    }

    displayInteractiveQuiz(quiz) {
        const resultArea = document.getElementById('quizResult');
        
        let quizHtml = `
            <div class="quiz-header">
                <h4 style="color: #1e293b; margin-bottom: 8px;">🧠 Interactive Quiz</h4>
                <div class="quiz-progress">
                    <span id="quizProgress">0/${Array.isArray(quiz) ? quiz.length : 3} answered</span>
                    <span id="quizScore" style="margin-left: 12px; color: #10b981;">Score: 0</span>
                </div>
            </div>
        `;
        
        if (Array.isArray(quiz)) {
            quiz.forEach((item, index) => {
                quizHtml += this.createQuizQuestion(item, index);
            });
        } else {
            // Fallback for non-array quiz - use context-aware generation
            console.log('🔄 DISPLAY FALLBACK: Quiz is not array, generating context-aware fallback');
            const contextQuiz = this.generateDirectContextQuiz(this.pageContent);
            contextQuiz.forEach((item, index) => {
                quizHtml += this.createQuizQuestion(item, index);
            });
        }

        quizHtml += `
            <div class="quiz-summary" id="quizSummary" style="display: none;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px; border-radius: 8px; text-align: center; margin-top: 16px;">
                    <h4 style="margin-bottom: 8px;">🎉 Quiz Complete!</h4>
                    <p id="finalScore" style="margin: 0; font-size: 18px; font-weight: 600;"></p>
                    <p id="performance" style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;"></p>
                </div>
                <button id="resetQuizBtn" style="width: 100%; margin-top: 12px; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 Take Quiz Again
                </button>
            </div>
        `;

        resultArea.innerHTML = quizHtml;
        
        // Add event listeners for quiz interactions
        this.setupQuizEventListeners();
        
        // Add event listener for reset button
        const resetBtn = document.getElementById('resetQuizBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetQuiz());
        }
    }

    createQuizQuestion(item, index) {
        const hasOptions = item.options && Array.isArray(item.options);
        
        let questionHtml = `
            <div class="quiz-question" id="question-${index}" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h5 style="color: #374151; margin-bottom: 12px; font-size: 15px;">Question ${index + 1}</h5>
                <p style="margin-bottom: 16px; font-size: 14px; line-height: 1.5;">${item.question}</p>
        `;

        if (hasOptions) {
            // Multiple choice question
            questionHtml += `<div class="quiz-options">`;
            item.options.forEach((option, optionIndex) => {
                questionHtml += `
                    <label class="quiz-option" style="display: block; margin-bottom: 8px; cursor: pointer; padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; transition: all 0.2s;">
                        <input type="radio" name="question-${index}" value="${option}" data-question-index="${index}" data-correct-answer="${item.correctAnswer}" style="margin-right: 8px;">
                        <span style="font-size: 13px;">${option}</span>
                    </label>
                `;
            });
            questionHtml += `</div>`;
        } else {
            // Text input question
            questionHtml += `
                <div class="quiz-text-input">
                    <input type="text" id="textAnswer-${index}" placeholder="Type your answer here..." 
                           style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; margin-bottom: 8px;"
                           onkeypress="if(event.key==='Enter') window.coachLens.handleTextAnswer(${index}, '${(item.answer || item.correctAnswer || '').replace(/'/g, "\\'")}');">
                    <button class="quiz-text-submit" data-question-index="${index}" data-correct-answer="${item.answer || item.correctAnswer || ''}"
                            style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer;">
                        Submit Answer
                    </button>
                </div>
            `;
        }

        questionHtml += `
                <div class="quiz-feedback" id="feedback-${index}" style="display: none; margin-top: 12px; padding: 10px; border-radius: 6px;">
                    <div class="feedback-content"></div>
                </div>
            </div>
        `;

        return questionHtml;
    }

    handleQuizAnswer(questionIndex, selectedAnswer, correctAnswer) {
        const feedbackDiv = document.getElementById(`feedback-${questionIndex}`);
        const questionDiv = document.getElementById(`question-${questionIndex}`);
        const isCorrect = selectedAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        
        // Disable all options for this question
        const options = questionDiv.querySelectorAll('input[type="radio"]');
        options.forEach(option => option.disabled = true);
        
        // Show feedback
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        
        if (isCorrect) {
            feedbackDiv.style.background = '#ecfdf5';
            feedbackDiv.style.border = '1px solid #10b981';
            feedbackDiv.innerHTML = `
                <div style="color: #065f46;">
                    <strong>✅ Correct!</strong> Well done!
                </div>
            `;
            this.quizScore++;
        } else {
            feedbackDiv.style.background = '#fef2f2';
            feedbackDiv.style.border = '1px solid #ef4444';
            feedbackDiv.innerHTML = `
                <div style="color: #991b1b;">
                    <strong>❌ Incorrect.</strong> The correct answer is: <strong>${correctAnswer}</strong>
                </div>
            `;
        }
        
        this.quizAnswered++;
        this.updateQuizProgress();
    }

    handleTextAnswer(questionIndex, correctAnswer) {
        const textInput = document.getElementById(`textAnswer-${questionIndex}`);
        const userAnswer = textInput.value.trim();
        
        if (!userAnswer) {
            this.showToast('Please enter an answer', 'warning');
            return;
        }
        
        const feedbackDiv = document.getElementById(`feedback-${questionIndex}`);
        const questionDiv = document.getElementById(`question-${questionIndex}`);
        
        // Disable input
        textInput.disabled = true;
        questionDiv.querySelector('button').disabled = true;
        
        // Check if answer is correct (fuzzy matching)
        const isCorrect = this.checkAnswerSimilarity(userAnswer, correctAnswer);
        
        // Show feedback
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        
        if (isCorrect) {
            feedbackDiv.style.background = '#ecfdf5';
            feedbackDiv.style.border = '1px solid #10b981';
            feedbackDiv.innerHTML = `
                <div style="color: #065f46;">
                    <strong>✅ Correct!</strong> Your answer: "${userAnswer}"
                </div>
            `;
            this.quizScore++;
        } else {
            feedbackDiv.style.background = '#fef2f2';
            feedbackDiv.style.border = '1px solid #ef4444';
            feedbackDiv.innerHTML = `
                <div style="color: #991b1b;">
                    <strong>❌ Not quite right.</strong><br>
                    Your answer: "${userAnswer}"<br>
                    Correct answer: "${correctAnswer}"
                </div>
            `;
        }
        
        this.quizAnswered++;
        this.updateQuizProgress();
    }

    checkAnswerSimilarity(userAnswer, correctAnswer) {
        const user = userAnswer.toLowerCase().trim();
        const correct = correctAnswer.toLowerCase().trim();
        
        // Exact match
        if (user === correct) return true;
        
        // Check if user answer contains key words from correct answer
        const correctWords = correct.split(/\s+/);
        const userWords = user.split(/\s+/);
        
        let matchCount = 0;
        correctWords.forEach(word => {
            if (word.length > 2 && userWords.some(userWord => 
                userWord.includes(word) || word.includes(userWord)
            )) {
                matchCount++;
            }
        });
        
        // If more than 60% of key words match, consider it correct
        return matchCount / correctWords.length > 0.6;
    }

    updateQuizProgress() {
        const progressSpan = document.getElementById('quizProgress');
        const scoreSpan = document.getElementById('quizScore');
        const totalQuestions = Array.isArray(this.currentQuiz) ? this.currentQuiz.length : 3;
        
        if (progressSpan) {
            progressSpan.textContent = `${this.quizAnswered}/${totalQuestions} answered`;
        }
        
        if (scoreSpan) {
            scoreSpan.textContent = `Score: ${this.quizScore}`;
        }
        
        // Show summary when all questions are answered
        if (this.quizAnswered >= totalQuestions) {
            setTimeout(() => this.showQuizSummary(), 1000);
        }
    }

    showQuizSummary() {
        const summaryDiv = document.getElementById('quizSummary');
        const finalScoreSpan = document.getElementById('finalScore');
        const performanceSpan = document.getElementById('performance');
        const totalQuestions = Array.isArray(this.currentQuiz) ? this.currentQuiz.length : 3;
        const percentage = Math.round((this.quizScore / totalQuestions) * 100);
        
        if (finalScoreSpan) {
            finalScoreSpan.textContent = `${this.quizScore}/${totalQuestions} (${percentage}%)`;
        }
        
        if (performanceSpan) {
            let performance = '';
            if (percentage >= 90) performance = 'Excellent! 🌟';
            else if (percentage >= 70) performance = 'Good job! 👍';
            else if (percentage >= 50) performance = 'Not bad, keep learning! 📚';
            else performance = 'Keep studying! 💪';
            
            performanceSpan.textContent = performance;
        }
        
        if (summaryDiv) {
            summaryDiv.style.display = 'block';
            summaryDiv.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Save quiz result
        this.saveQuizResult(this.quizScore, totalQuestions, percentage);
    }

    resetQuiz() {
        this.quizScore = 0;
        this.quizAnswered = 0;
        this.displayInteractiveQuiz(this.currentQuiz);
    }

    async saveQuizResult(score, total, percentage) {
        try {
            const quizHistory = await this.getFromStorage('quizHistory') || [];
            const result = {
                date: new Date().toISOString(),
                score,
                total,
                percentage,
                title: this.pageContent?.title || 'Quiz'
            };
            
            quizHistory.unshift(result);
            
            // Keep only last 20 results
            if (quizHistory.length > 20) {
                quizHistory.splice(20);
            }
            
            await this.saveToStorage('quizHistory', quizHistory);
        } catch (error) {
            console.error('Failed to save quiz result:', error);
        }
    }

    buildChatContext() {
        let context = '';
        
        // Add current page information
        if (this.pageContent && this.pageContent.content) {
            context += `CURRENT PAGE CONTEXT:
Title: ${this.pageContent.title}
URL: ${this.pageContent.url}
Content Summary: ${this.pageContent.content.substring(0, 1500)}

`;
        }
        
        // Add any selected text
        if (this.selectedText) {
            context += `CURRENTLY SELECTED TEXT: "${this.selectedText}"

`;
        }
        
        // Add previous conversation
        if (this.chatContext) {
            context += `PREVIOUS CONVERSATION:
${this.chatContext}

`;
        }
        
        return context;
    }

    async handleChat() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addChatMessage(message, 'user');
        input.value = '';

        // Add AI thinking message
        const thinkingMsg = this.addChatMessage('AI is thinking...', 'ai');

        try {
            // Build comprehensive context including page content
            const fullContext = this.buildChatContext();
            console.log('🔍 DEBUG: Chat user message:', message);
            console.log('🔍 DEBUG: Chat context length:', fullContext.length);
            console.log('🔍 DEBUG: Chat context preview:', fullContext.substring(0, 300) + '...');
            
            const response = await this.callAI('chat', message, fullContext);
            console.log('🔍 DEBUG: Chat response:', response);
            thinkingMsg.querySelector('.message-content').textContent = response;
            
            // Update chat context for next message
            this.chatContext += `\nUser: ${message}\nAI: ${response}`;
        } catch (error) {
            thinkingMsg.querySelector('.message-content').textContent = 'Sorry, I encountered an error. Please try again.';
            this.showToast('Chat error: ' + error.message, 'error');
        }
    }

    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
            <div class="message-content">${message}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }

    handleVoice() {
        this.showToast('Voice input feature coming soon!', 'info');
    }

    async callAI(type, content, context = '') {
        // Try Chrome Built-in AI first if available
        if (this.aiMode === 'on-device' && typeof window.ai !== 'undefined') {
            try {
                console.log('🧠 ON-DEVICE: Using Chrome Built-in AI');
                return await this.callBuiltinAI(type, content, context);
            } catch (error) {
                console.log('🧠 ON-DEVICE: Failed, falling back to cloud:', error.message);
                this.setAIMode('cloud', '☁️', 'Cloud (Fallback)');
            }
        }
        
        try {
            console.log('🌐 CLOUD: Attempting to connect to http://localhost:8787/gemini');
            
            // Try backend API
            const response = await fetch('http://localhost:8787/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: this.buildPrompt(type, content, context),
                    systemPrompt: this.getSystemPrompt(type),
                    temperature: 0.7,
                    maxTokens: 1000
                })
            });

            console.log('🌐 BACKEND: Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('🌐 BACKEND: Success! Raw response:', data.response.substring(0, 200) + '...');
                return this.parseAIResponse(type, data.response);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.log('🌐 BACKEND: Error response:', errorData);
                throw new Error(`Backend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('🌐 BACKEND: Connection failed:', error.message);
            
            if (error.message.includes('fetch')) {
                console.log('🌐 BACKEND: Server appears to be down. Start with: node backend/server.js');
            }
            
            // For quiz, throw error to let main handler use context-aware fallback
            if (type === 'quiz') {
                console.log('🔄 QUIZ FALLBACK: Throwing error to use context-aware fallback');
                throw error; // Re-throw to let handleQuiz use generateDirectContextQuiz
            }
            
            // For other types, use mock response
            console.log('🔄 FALLBACK: Using mock response for non-quiz');
            return this.getMockResponse(type, content);
        }
    }

    async callBuiltinAI(type, content, context = '') {
        console.log('🧠 BUILTIN: Creating text session...');
        
        const session = await window.ai.createTextSession({
            temperature: 0.7,
            topK: 3,
        });
        
        try {
            const fullPrompt = this.buildPrompt(type, content, context);
            const systemPrompt = this.getSystemPrompt(type);
            const combinedPrompt = `${systemPrompt}\n\n${fullPrompt}`;
            
            console.log('🧠 BUILTIN: Sending prompt to built-in AI...');
            const response = await session.prompt(combinedPrompt);
            
            console.log('🧠 BUILTIN: Got response from built-in AI');
            return this.parseAIResponse(type, response);
            
        } finally {
            session.destroy();
        }
    }

    buildPrompt(type, content, context = '') {
        switch (type) {
            case 'summarize':
                return `Please summarize this content in an organized way:\n\n${content}`;
            case 'explain':
                return `Please explain this concept in simple terms with analogies:\n\n${content}`;
            case 'quiz':
                return `${context ? context + '\n\n' : ''}Create 3 quiz questions from this content:\n\n${content}`;
            case 'compare':
                return `Compare and analyze these learning items about "${context}":\n\n${content}\n\nProvide insights about patterns, differences, and learning progression.`;
            case 'chat':
                return `${context}

USER QUESTION: ${content}

Please provide a helpful, specific answer based on the page content above. Reference specific information from the current page when relevant.`;
            default:
                return content;
        }
    }

    getSystemPrompt(type) {
        switch (type) {
            case 'summarize':
                return 'You are an AI study assistant. Organize content into clear sections with headers.';
            case 'explain':
                return 'You are a teacher. Explain concepts using simple analogies and examples.';
            case 'quiz':
                return `You are an examiner creating quiz questions based on the specific page content provided. Create 3 quiz questions in JSON format that test understanding of the actual content. Mix multiple choice and text answer questions:
                
                Format: [
                    {"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A"},
                    {"question": "...", "answer": "text answer"}
                ]
                
                Make questions educational and test understanding of the specific content, not generic knowledge. Questions should be directly related to the page content provided.`;
            case 'compare':
                return 'You are an educational analyst. Compare learning materials and identify patterns, connections, and learning progression opportunities.';
            case 'chat':
                return 'You are an AI learning assistant that helps users understand the content they are currently reading. Always reference the specific page content provided in the context. Give detailed, helpful answers based on the actual content of the page the user is viewing. If asked about the page, provide specific information from the content rather than generic responses.';
            default:
                return 'You are a helpful AI assistant.';
        }
    }

    parseAIResponse(type, response) {
        if (type === 'quiz') {
            try {
                // Try to parse JSON
                const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
                return JSON.parse(cleanResponse);
            } catch (error) {
                // Return as text if JSON parsing fails
                return response;
            }
        }
        return response;
    }

    getMockResponse(type, content) {
        switch (type) {
            case 'summarize':
                return `## Summary\n\nThis content discusses ${this.truncateText(content, 50)}...\n\n### Key Points\n- Main concept explained\n- Important details highlighted\n- Practical applications mentioned`;
            case 'explain':
                return `This concept can be understood as follows:\n\n**Simple Explanation:** ${this.truncateText(content, 30)} is like a tool that helps us understand complex ideas.\n\n**Analogy:** Think of it as a bridge that connects what you already know to new information.`;
            case 'quiz':
                return this.generateSimpleContextQuiz(content);
            case 'chat':
                // Create a more context-aware response based on page content
                if (this.pageContent && this.pageContent.content) {
                    const pagePreview = this.truncateText(this.pageContent.content, 100);
                    return `Based on the current page about "${this.pageContent.title}", I can help you understand the content. The page discusses ${pagePreview}. Your question "${this.truncateText(content, 50)}" relates to this content. What specific aspect would you like me to explain further?`;
                } else {
                    return `I'd be happy to help you with "${this.truncateText(content, 50)}". However, I don't have access to the current page content. Could you provide more context about what you're reading?`;
                }
            default:
                return 'I understand your request. Let me help you with that.';
        }
    }

    generateDynamicQuiz(content) {
        console.log('🔍 DEBUG: Generating dynamic quiz from content:', content.substring(0, 200) + '...');
        console.log('🔍 DEBUG: Full content length:', content.length);
        
        try {
            // Extract key information from content
            const analysis = this.analyzeContent(content);
            console.log('🔍 DEBUG: Content analysis:', analysis);
            
            if (!analysis || !analysis.title) {
                console.log('🚨 DEBUG: Analysis failed, using fallback');
                return this.generateFallbackQuiz(content);
            }
        
        const questions = [];
        
        // Question 1: About main topic/title
        if (analysis.title) {
            questions.push({
                question: `What is the main topic discussed in this content?`,
                options: [
                    analysis.title,
                    this.generateDistractor(analysis.title, 'topic'),
                    this.generateDistractor(analysis.title, 'topic'),
                    this.generateDistractor(analysis.title, 'topic')
                ],
                correctAnswer: analysis.title
            });
        }
        
        // Question 2: About key terms/concepts
        if (analysis.keyTerms.length > 0) {
            const keyTerm = analysis.keyTerms[0];
            questions.push({
                question: `Which of the following is a key concept mentioned in this content?`,
                options: [
                    keyTerm,
                    this.generateDistractor(keyTerm, 'concept'),
                    this.generateDistractor(keyTerm, 'concept'),
                    this.generateDistractor(keyTerm, 'concept')
                ],
                correctAnswer: keyTerm
            });
        }
        
        // Question 3: About specific details (open-ended)
        if (analysis.specificDetails.length > 0) {
            questions.push({
                question: `What specific detail or example is mentioned in this content?`,
                answer: analysis.specificDetails[0]
            });
        }
        
        // Fallback questions if analysis doesn't find enough content
        while (questions.length < 3) {
            questions.push({
                question: `Based on the content, what type of information is being presented?`,
                options: [
                    analysis.contentType,
                    "General reference",
                    "Personal opinion",
                    "Advertisement"
                ],
                correctAnswer: analysis.contentType
            });
        }
        
        return questions.slice(0, 3); // Return exactly 3 questions
        } catch (error) {
            console.error('🚨 DEBUG: Error in generateDynamicQuiz:', error);
            return this.generateFallbackQuiz(content);
        }
    }

    generateFallbackQuiz(content) {
        console.log('🔍 DEBUG: Using fallback quiz generator');
        
        // Simple content analysis for fallback
        const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const firstWords = content.trim().split(/\s+/).slice(0, 8).join(' ');
        const contentPreview = content.substring(0, 100);
        
        // Find some key words from the content
        const keyWords = [...new Set(words)]
            .filter(word => !this.isCommonWord(word))
            .slice(0, 5);
        
        console.log('🔍 DEBUG: Fallback analysis - keyWords:', keyWords, 'firstWords:', firstWords);
        
        return [
            {
                question: `Based on this content, what is the main subject being discussed?`,
                options: [
                    firstWords.length > 50 ? firstWords.substring(0, 50) + '...' : firstWords,
                    "General information processing",
                    "Data analysis methods", 
                    "System documentation"
                ],
                correctAnswer: firstWords.length > 50 ? firstWords.substring(0, 50) + '...' : firstWords
            },
            {
                question: `Which term is most relevant to this content?`,
                options: [
                    keyWords[0] || "information",
                    "processing",
                    "management",
                    "analysis"
                ],
                correctAnswer: keyWords[0] || "information"
            },
            {
                question: `What type of content is this?`,
                answer: this.determineContentType(content)
            }
        ];
    }

    analyzeContent(content) {
        const words = content.toLowerCase().split(/\s+/);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        // Extract potential title/main topic from first sentence or heading
        const firstSentence = sentences[0] ? sentences[0].trim() : '';
        const title = this.extractMainTopic(firstSentence, content);
        
        // Find key terms (important words that appear multiple times)
        const keyTerms = this.extractKeyTerms(content);
        
        // Find specific details (numbers, names, specific facts)
        const specificDetails = this.extractSpecificDetails(content);
        
        // Determine content type
        const contentType = this.determineContentType(content);
        
        return {
            title,
            keyTerms,
            specificDetails,
            contentType,
            wordCount: words.length,
            sentenceCount: sentences.length
        };
    }

    extractMainTopic(firstSentence, content) {
        // Look for patterns that indicate main topics
        const topicPatterns = [
            /^([A-Z][a-zA-Z\s-]+)(?:\s+is|\s+are|\s+refers|\s+means)/,
            /^([A-Z][a-zA-Z\s-]+)(?:\s*:|\s*-)/,
            /The\s+([a-zA-Z\s-]+?)\s+(?:algorithm|method|process|concept|theory)/i,
            /([A-Z][a-zA-Z\s-]+?)\s+(?:algorithm|method|process|concept|theory)/
        ];
        
        for (const pattern of topicPatterns) {
            const match = firstSentence.match(pattern) || content.substring(0, 200).match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        // Fallback: use first few words of content
        const words = content.trim().split(/\s+/).slice(0, 4).join(' ');
        return words.length > 50 ? words.substring(0, 50) + '...' : words;
    }

    extractKeyTerms(content) {
        const words = content.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        // Count word frequency
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        // Get words that appear multiple times and are likely important
        const keyTerms = Object.entries(wordCount)
            .filter(([word, count]) => count > 1 && !this.isCommonWord(word))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
        
        return keyTerms;
    }

    extractSpecificDetails(content) {
        const details = [];
        
        // Extract numbers with context
        const numberMatches = content.match(/\b\d+(?:\.\d+)?(?:\s*%|\s*degrees?|\s*years?|\s*minutes?|\s*hours?|\s*[A-Za-z]+)?\b/g);
        if (numberMatches) {
            details.push(...numberMatches.slice(0, 2));
        }
        
        // Extract capitalized terms (likely proper nouns, names, places)
        const capitalizedMatches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
        if (capitalizedMatches) {
            const filtered = capitalizedMatches
                .filter(term => !this.isCommonWord(term.toLowerCase()) && term.length > 2)
                .slice(0, 3);
            details.push(...filtered);
        }
        
        // Extract quoted text
        const quotedMatches = content.match(/"([^"]+)"/g);
        if (quotedMatches) {
            details.push(...quotedMatches.slice(0, 1));
        }
        
        return details.slice(0, 3);
    }

    determineContentType(content) {
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes('recipe') || contentLower.includes('ingredients') || contentLower.includes('cooking')) {
            return 'Recipe or cooking guide';
        } else if (contentLower.includes('algorithm') || contentLower.includes('function') || contentLower.includes('code')) {
            return 'Technical documentation';
        } else if (contentLower.includes('study') || contentLower.includes('research') || contentLower.includes('analysis')) {
            return 'Educational material';
        } else if (contentLower.includes('news') || contentLower.includes('reported') || contentLower.includes('according to')) {
            return 'News article';
        } else {
            return 'Informational content';
        }
    }

    isCommonWord(word) {
        const commonWords = [
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'can', 'may', 'might', 'must', 'shall', 'from', 'into', 'onto', 'upon',
            'about', 'above', 'below', 'between', 'through', 'during', 'before', 'after',
            'while', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom',
            'very', 'more', 'most', 'some', 'any', 'all', 'each', 'every', 'other',
            'such', 'only', 'own', 'same', 'so', 'than', 'too', 'also', 'just'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    generateDistractor(correctAnswer, type) {
        // Generate plausible but incorrect options based on the correct answer
        const distractors = {
            topic: [
                'General information processing',
                'Data analysis methods',
                'System optimization techniques',
                'Information management',
                'Content organization',
                'Knowledge representation'
            ],
            concept: [
                'Data processing',
                'Information analysis',
                'System management',
                'Content optimization',
                'Knowledge extraction',
                'Pattern recognition'
            ]
        };
        
        const options = distractors[type] || distractors.concept;
        return options[Math.floor(Math.random() * options.length)];
    }

    generateSimpleContextQuiz(content) {
        console.log('🔍 DEBUG: Generating simple context quiz from content:', content.substring(0, 200) + '...');
        
        try {
            // Clean and analyze content
            const cleanContent = content.replace(/\s+/g, ' ').trim();
            const words = cleanContent.toLowerCase().split(/\s+/);
            const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
            
            // Get first meaningful sentence
            const firstSentence = sentences[0] || cleanContent.substring(0, 100);
            
            // Extract key terms (words longer than 4 characters, not common words)
            const keyTerms = words
                .filter(word => word.length > 4 && !this.isCommonWord(word))
                .filter((word, index, arr) => arr.indexOf(word) === index) // unique
                .slice(0, 10);
            
            // Extract numbers and specific details
            const numbers = cleanContent.match(/\b\d+(?:\.\d+)?(?:%|°F|°C|kg|g|ml|minutes?|hours?|years?)?\b/g) || [];
            const capitalizedWords = cleanContent.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
            
            console.log('🔍 DEBUG: Analysis - keyTerms:', keyTerms.slice(0, 5), 'numbers:', numbers.slice(0, 3), 'capitalized:', capitalizedWords.slice(0, 3));
            
            // Generate questions based on actual content
            const questions = [];
            
            // Question 1: About the main content
            const mainTopic = this.extractMainTopicSimple(firstSentence, cleanContent);
            questions.push({
                question: "What is the main topic or subject discussed in this content?",
                options: [
                    mainTopic,
                    "General reference material",
                    "Technical documentation",
                    "News and updates"
                ],
                correctAnswer: mainTopic
            });
            
            // Question 2: About key terms
            if (keyTerms.length > 0) {
                const keyTerm = keyTerms[0];
                questions.push({
                    question: `Which of the following terms is specifically mentioned in this content?`,
                    options: [
                        keyTerm,
                        "processing",
                        "management", 
                        "analysis"
                    ],
                    correctAnswer: keyTerm
                });
            }
            
            // Question 3: About specific details
            if (numbers.length > 0) {
                questions.push({
                    question: "What specific number or measurement is mentioned in this content?",
                    answer: numbers[0]
                });
            } else if (capitalizedWords.length > 0) {
                questions.push({
                    question: "What specific name or term is mentioned in this content?",
                    answer: capitalizedWords[0]
                });
            } else {
                questions.push({
                    question: "What type of information does this content provide?",
                    answer: this.determineContentTypeSimple(cleanContent)
                });
            }
            
            console.log('🔍 DEBUG: Generated questions:', questions);
            return questions.slice(0, 3);
            
        } catch (error) {
            console.error('🚨 DEBUG: Error in generateSimpleContextQuiz:', error);
            return this.generateBasicFallbackQuiz(content);
        }
    }

    extractMainTopicSimple(firstSentence, content) {
        // Try to extract meaningful topic from first sentence
        const sentence = firstSentence.trim();
        
        // Look for patterns like "X is a..." or "X refers to..."
        const patterns = [
            /^([A-Z][a-zA-Z\s-]{2,30})(?:\s+is\s+|\s+are\s+|\s+refers?\s+to\s+|\s+means?\s+)/,
            /^([A-Z][a-zA-Z\s-]{2,30})(?:\s*:\s*|\s*-\s*)/,
            /([A-Z][a-zA-Z\s-]{2,30})\s+(?:algorithm|method|process|concept|theory|technique)/i
        ];
        
        for (const pattern of patterns) {
            const match = sentence.match(pattern);
            if (match && match[1].trim().length > 2) {
                return match[1].trim();
            }
        }
        
        // Fallback: use first few meaningful words
        const words = sentence.split(/\s+/).filter(word => word.length > 2).slice(0, 6);
        const topic = words.join(' ');
        return topic.length > 60 ? topic.substring(0, 60) + '...' : topic;
    }

    determineContentTypeSimple(content) {
        const lower = content.toLowerCase();
        if (lower.includes('algorithm') || lower.includes('machine learning') || lower.includes('neural')) {
            return 'Technical/AI content';
        } else if (lower.includes('recipe') || lower.includes('cooking') || lower.includes('ingredients')) {
            return 'Recipe or cooking guide';
        } else if (lower.includes('news') || lower.includes('reported') || lower.includes('according')) {
            return 'News article';
        } else if (lower.includes('study') || lower.includes('research') || lower.includes('university')) {
            return 'Educational material';
        } else {
            return 'Informational content';
        }
    }

    generateBasicFallbackQuiz(content) {
        console.log('🔍 DEBUG: Using basic fallback quiz');
        const preview = content.substring(0, 50).trim();
        return [
            {
                question: "Based on this content, what is being discussed?",
                options: [
                    preview + (preview.length < content.length ? '...' : ''),
                    "General information",
                    "Technical documentation",
                    "Reference material"
                ],
                correctAnswer: preview + (preview.length < content.length ? '...' : '')
            },
            {
                question: "What type of content is this?",
                options: [
                    "Web article",
                    "Advertisement",
                    "Personal blog",
                    "News report"
                ],
                correctAnswer: "Web article"
            },
            {
                question: "What is the main purpose of this content?",
                answer: "To provide information"
            }
        ];
    }

    generateDirectContextQuiz(pageContent) {
        console.log('🎯 DIRECT: Generating quiz from page content:', pageContent.title);
        console.log('🎯 DIRECT: Content preview:', pageContent.content.substring(0, 300) + '...');
        
        const content = pageContent.content;
        const title = pageContent.title;
        
        // Extract meaningful information from the actual page content
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const words = content.toLowerCase().split(/\s+/);
        
        // Find important terms (appear multiple times, not common words)
        const wordCount = {};
        words.forEach(word => {
            if (word.length > 3 && !this.isCommonWord(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        
        const importantTerms = Object.entries(wordCount)
            .filter(([word, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
        
        // Extract numbers and specific details
        const numbers = content.match(/\b\d+(?:\.\d+)?(?:%|°F|°C|kg|g|ml|minutes?|hours?|years?|k=\d+)?\b/g) || [];
        const capitalizedTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
        
        console.log('🎯 DIRECT: Analysis - Title:', title);
        console.log('🎯 DIRECT: Important terms:', importantTerms.slice(0, 5));
        console.log('🎯 DIRECT: Numbers found:', numbers.slice(0, 5));
        console.log('🎯 DIRECT: Capitalized terms:', capitalizedTerms.slice(0, 5));
        
        // Generate questions based on actual content
        const questions = [];
        
        // Question 1: About the page title/main topic
        if (title && title.length > 5) {
            questions.push({
                question: "What is the main topic of this page?",
                options: [
                    title,
                    "General information processing",
                    "Data management systems",
                    "Technical documentation"
                ],
                correctAnswer: title
            });
        }
        
        // Question 2: About important terms from the content
        if (importantTerms.length > 0) {
            const term = importantTerms[0];
            questions.push({
                question: `Which of the following terms is frequently mentioned in this content?`,
                options: [
                    term,
                    "processing",
                    "management",
                    "analysis"
                ],
                correctAnswer: term
            });
        }
        
        // Question 3: About specific details
        if (numbers.length > 0) {
            questions.push({
                question: "What specific number or value is mentioned in this content?",
                answer: numbers[0]
            });
        } else if (capitalizedTerms.length > 0) {
            const term = capitalizedTerms.find(t => t.length > 2 && !this.isCommonWord(t.toLowerCase())) || capitalizedTerms[0];
            questions.push({
                question: "What specific term or name is mentioned in this content?",
                answer: term
            });
        } else if (importantTerms.length > 1) {
            questions.push({
                question: "What is another key concept discussed in this content?",
                answer: importantTerms[1]
            });
        }
        
        // Ensure we have 3 questions
        while (questions.length < 3) {
            questions.push({
                question: "Based on the content, what type of information is this?",
                options: [
                    this.determineContentTypeFromTitle(title),
                    "General reference",
                    "News article",
                    "Personal blog"
                ],
                correctAnswer: this.determineContentTypeFromTitle(title)
            });
        }
        
        console.log('🎯 DIRECT: Generated questions:', questions);
        return questions.slice(0, 3);
    }

    determineContentTypeFromTitle(title) {
        if (!title) return "Web content";
        
        const titleLower = title.toLowerCase();
        if (titleLower.includes('algorithm') || titleLower.includes('machine learning') || titleLower.includes('knn') || titleLower.includes('neural')) {
            return "Machine Learning/AI content";
        } else if (titleLower.includes('recipe') || titleLower.includes('cooking') || titleLower.includes('food')) {
            return "Recipe/Cooking guide";
        } else if (titleLower.includes('news') || titleLower.includes('breaking') || titleLower.includes('report')) {
            return "News article";
        } else if (titleLower.includes('tutorial') || titleLower.includes('guide') || titleLower.includes('how to')) {
            return "Tutorial/Guide";
        } else if (titleLower.includes('wikipedia') || titleLower.includes('encyclopedia')) {
            return "Educational reference";
        } else {
            return "Informational content";
        }
    }

    validateQuizContext(quiz, pageContent) {
        console.log('🔍 VALIDATION: Checking quiz context relevance...');
        
        if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
            console.log('🚨 VALIDATION: Invalid quiz format, regenerating...');
            return this.generateDirectContextQuiz(pageContent);
        }
        
        // Check if quiz contains generic/irrelevant content
        const genericTerms = ['subscribe', 'information management', 'general information processing', 'data analysis methods'];
        const hasGenericContent = quiz.some(q => {
            const questionText = (q.question || '').toLowerCase();
            const options = q.options || [];
            const optionsText = options.join(' ').toLowerCase();
            
            return genericTerms.some(term => 
                questionText.includes(term) || optionsText.includes(term)
            );
        });
        
        if (hasGenericContent) {
            console.log('🚨 VALIDATION: Detected generic content, regenerating with page context...');
            return this.generateDirectContextQuiz(pageContent);
        }
        
        // Check if quiz references page title or content
        const pageTitle = (pageContent.title || '').toLowerCase();
        const pageContentText = (pageContent.content || '').toLowerCase();
        
        const hasPageReference = quiz.some(q => {
            const questionText = (q.question || '').toLowerCase();
            const options = q.options || [];
            const answer = q.answer || q.correctAnswer || '';
            const allText = (questionText + ' ' + options.join(' ') + ' ' + answer).toLowerCase();
            
            // Check if any part of the quiz references the page
            return pageTitle.split(' ').some(word => 
                word.length > 3 && allText.includes(word)
            ) || pageContentText.split(' ').slice(0, 50).some(word => 
                word.length > 4 && allText.includes(word)
            );
        });
        
        if (!hasPageReference && pageContent.title && pageContent.content) {
            console.log('🚨 VALIDATION: Quiz not related to page content, regenerating...');
            return this.generateDirectContextQuiz(pageContent);
        }
        
        console.log('✅ VALIDATION: Quiz appears to be context-relevant');
        return quiz;
    }

    generateRealContextQuiz(pageContent) {
        console.log('🧠 ADVANCED QUIZ: Generating deep contextual questions');
        console.log('🧠 ADVANCED QUIZ: Analyzing:', pageContent.title);
        
        const title = pageContent.title || 'Unknown Page';
        const content = pageContent.content || '';
        
        // Deep content analysis
        const analysis = this.performDeepContentAnalysis(content, title);
        console.log('🧠 ADVANCED QUIZ: Analysis results:', analysis);
        
        // Generate advanced questions based on content type and depth
        const questions = this.generateAdvancedQuestions(analysis, content, title);
        
        console.log('🧠 ADVANCED QUIZ: Generated advanced questions:', questions);
        return questions;
    }

    performDeepContentAnalysis(content, title) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const words = content.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
        
        // Identify content type and domain
        const contentType = this.identifyContentType(content, title);
        const domain = this.identifyDomain(content, title);
        
        // Extract key concepts (multi-word phrases)
        const keyConcepts = this.extractKeyConcepts(content);
        
        // Extract relationships and processes
        const processes = this.extractProcesses(content);
        const relationships = this.extractRelationships(content);
        
        // Extract definitions and explanations
        const definitions = this.extractDefinitions(content);
        
        // Extract numerical data and measurements
        const numericalData = this.extractNumericalData(content);
        
        // Extract examples and applications
        const examples = this.extractExamples(content);
        
        // Identify main arguments or thesis
        const mainPoints = this.extractMainPoints(sentences);
        
        return {
            contentType,
            domain,
            keyConcepts,
            processes,
            relationships,
            definitions,
            numericalData,
            examples,
            mainPoints,
            sentences: sentences.slice(0, 10), // First 10 sentences for context
            wordCount: words.length
        };
    }

    identifyContentType(content, title) {
        const lower = content.toLowerCase();
        const titleLower = title.toLowerCase();
        
        if (lower.includes('algorithm') || lower.includes('machine learning') || titleLower.includes('algorithm')) {
            return 'technical_algorithm';
        } else if (lower.includes('recipe') || lower.includes('ingredients') || lower.includes('cooking')) {
            return 'recipe_guide';
        } else if (lower.includes('history') || lower.includes('historical') || lower.includes('century')) {
            return 'historical_content';
        } else if (lower.includes('tutorial') || lower.includes('how to') || lower.includes('step')) {
            return 'tutorial_guide';
        } else if (lower.includes('research') || lower.includes('study') || lower.includes('analysis')) {
            return 'research_academic';
        } else if (lower.includes('news') || lower.includes('reported') || lower.includes('breaking')) {
            return 'news_article';
        } else {
            return 'general_informational';
        }
    }

    identifyDomain(content, title) {
        const combined = (content + ' ' + title).toLowerCase();
        
        if (combined.includes('machine learning') || combined.includes('ai') || combined.includes('neural')) {
            return 'artificial_intelligence';
        } else if (combined.includes('programming') || combined.includes('code') || combined.includes('software')) {
            return 'computer_science';
        } else if (combined.includes('biology') || combined.includes('medical') || combined.includes('health')) {
            return 'life_sciences';
        } else if (combined.includes('physics') || combined.includes('chemistry') || combined.includes('mathematics')) {
            return 'physical_sciences';
        } else if (combined.includes('business') || combined.includes('marketing') || combined.includes('finance')) {
            return 'business';
        } else if (combined.includes('cooking') || combined.includes('food') || combined.includes('recipe')) {
            return 'culinary';
        } else {
            return 'general';
        }
    }

    extractKeyConcepts(content) {
        // Extract 2-3 word phrases that appear multiple times
        const phrases = [];
        const words = content.split(/\s+/);
        
        for (let i = 0; i < words.length - 2; i++) {
            const twoWord = words[i] + ' ' + words[i + 1];
            const threeWord = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
            
            if (twoWord.length > 6 && !this.isCommonPhrase(twoWord)) {
                phrases.push(twoWord);
            }
            if (threeWord.length > 10 && !this.isCommonPhrase(threeWord)) {
                phrases.push(threeWord);
            }
        }
        
        // Count phrase frequency
        const phraseCount = {};
        phrases.forEach(phrase => {
            const clean = phrase.toLowerCase().replace(/[^\w\s]/g, '');
            phraseCount[clean] = (phraseCount[clean] || 0) + 1;
        });
        
        return Object.entries(phraseCount)
            .filter(([phrase, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([phrase]) => phrase);
    }

    extractProcesses(content) {
        // Look for step-by-step processes or algorithms
        const processPatterns = [
            /(?:step|stage|phase)\s+\d+[:\.]?\s*([^.!?]+)/gi,
            /(?:first|second|third|then|next|finally)[,\s]+([^.!?]+)/gi,
            /(?:algorithm|process|method)\s+(?:works|involves|includes)[:\s]*([^.!?]+)/gi
        ];
        
        const processes = [];
        processPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                processes.push(...matches.slice(0, 3));
            }
        });
        
        return processes.slice(0, 5);
    }

    extractRelationships(content) {
        // Look for cause-effect, comparison, or relationship statements
        const relationshipPatterns = [
            /([^.!?]+)\s+(?:causes?|leads? to|results? in)\s+([^.!?]+)/gi,
            /([^.!?]+)\s+(?:compared to|versus|vs\.?|unlike)\s+([^.!?]+)/gi,
            /([^.!?]+)\s+(?:depends on|relies on|is based on)\s+([^.!?]+)/gi
        ];
        
        const relationships = [];
        relationshipPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                relationships.push(...matches.slice(0, 2));
            }
        });
        
        return relationships.slice(0, 4);
    }

    extractDefinitions(content) {
        // Look for definitions and explanations
        const definitionPatterns = [
            /([A-Z][a-zA-Z\s]+)\s+(?:is|are|refers to|means|defined as)\s+([^.!?]+)/g,
            /([A-Z][a-zA-Z\s]+):\s*([^.!?]+)/g
        ];
        
        const definitions = [];
        definitionPatterns.forEach(pattern => {
            const matches = [...content.matchAll(pattern)];
            matches.forEach(match => {
                if (match[1] && match[2] && match[1].length < 50) {
                    definitions.push({
                        term: match[1].trim(),
                        definition: match[2].trim()
                    });
                }
            });
        });
        
        return definitions.slice(0, 5);
    }

    extractNumericalData(content) {
        // Extract numbers with context
        const numericalPatterns = [
            /(\w+[^.!?]*?)(\d+(?:\.\d+)?(?:%|°F|°C|kg|g|ml|minutes?|hours?|years?|k=\d+)?)/g,
            /(accuracy|precision|recall|f1-score|error rate)[:\s]*(\d+(?:\.\d+)?%?)/gi,
            /(k\s*=\s*\d+|n\s*=\s*\d+|p\s*=\s*\d+)/gi
        ];
        
        const numericalData = [];
        numericalPatterns.forEach(pattern => {
            const matches = [...content.matchAll(pattern)];
            matches.forEach(match => {
                numericalData.push(match[0]);
            });
        });
        
        return numericalData.slice(0, 6);
    }

    extractExamples(content) {
        // Look for examples and applications
        const examplePatterns = [
            /(?:for example|such as|including|like)[:\s]*([^.!?]+)/gi,
            /(?:applications?|uses?|examples?)[:\s]*([^.!?]+)/gi
        ];
        
        const examples = [];
        examplePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                examples.push(...matches.slice(0, 3));
            }
        });
        
        return examples.slice(0, 4);
    }

    extractMainPoints(sentences) {
        // Identify key sentences (first sentence of paragraphs, sentences with key indicators)
        const keyIndicators = ['important', 'key', 'main', 'primary', 'essential', 'crucial', 'significant'];
        const mainPoints = [];
        
        sentences.forEach(sentence => {
            const lower = sentence.toLowerCase();
            if (keyIndicators.some(indicator => lower.includes(indicator)) || 
                sentence.length > 100 && sentence.length < 300) {
                mainPoints.push(sentence.trim());
            }
        });
        
        return mainPoints.slice(0, 5);
    }

    generateAdvancedQuestions(analysis, content, title) {
        const questions = [];
        
        // Generate questions based on content type and analysis
        switch (analysis.contentType) {
            case 'technical_algorithm':
                questions.push(...this.generateAlgorithmQuestions(analysis, content));
                break;
            case 'recipe_guide':
                questions.push(...this.generateRecipeQuestions(analysis, content));
                break;
            case 'historical_content':
                questions.push(...this.generateHistoryQuestions(analysis, content));
                break;
            case 'research_academic':
                questions.push(...this.generateResearchQuestions(analysis, content));
                break;
            default:
                questions.push(...this.generateGeneralAdvancedQuestions(analysis, content, title));
        }
        
        // Ensure we have exactly 3 questions
        return questions.slice(0, 3);
    }

    generateAlgorithmQuestions(analysis, content) {
        const questions = [];
        
        // Question about algorithm mechanics
        if (analysis.processes.length > 0) {
            questions.push({
                question: `How does the algorithm work? What is the key process involved?`,
                answer: analysis.processes[0].replace(/step \d+[:\.]?\s*/i, '').trim()
            });
        }
        
        // Question about parameters or configuration
        if (analysis.numericalData.length > 0) {
            const param = analysis.numericalData[0];
            questions.push({
                question: `What is a critical parameter mentioned in this algorithm, and what does it control?`,
                answer: param
            });
        }
        
        // Question about applications or use cases
        if (analysis.examples.length > 0) {
            questions.push({
                question: `What are the main applications or use cases for this algorithm?`,
                answer: analysis.examples[0].replace(/(?:for example|such as|including|like)[:\s]*/i, '').trim()
            });
        }
        
        // Fallback conceptual question
        if (questions.length < 3 && analysis.keyConcepts.length > 0) {
            questions.push({
                question: `What is the fundamental concept that this algorithm is based on?`,
                options: [
                    analysis.keyConcepts[0],
                    "random sampling",
                    "linear regression",
                    "decision trees"
                ],
                correctAnswer: analysis.keyConcepts[0]
            });
        }
        
        return questions;
    }

    generateGeneralAdvancedQuestions(analysis, content, title) {
        const questions = [];
        
        // Deep conceptual question
        if (analysis.keyConcepts.length > 0) {
            questions.push({
                question: `What is the core concept or principle discussed in this content?`,
                options: [
                    analysis.keyConcepts[0],
                    "general information processing",
                    "basic data management",
                    "simple documentation"
                ],
                correctAnswer: analysis.keyConcepts[0]
            });
        }
        
        // Application or implication question
        if (analysis.relationships.length > 0) {
            questions.push({
                question: `What is an important relationship or connection explained in this content?`,
                answer: analysis.relationships[0].substring(0, 100)
            });
        }
        
        // Specific detail or measurement question
        if (analysis.numericalData.length > 0) {
            questions.push({
                question: `What specific measurement, value, or quantitative detail is mentioned?`,
                answer: analysis.numericalData[0]
            });
        }
        
        // Fallback to main point
        if (questions.length < 3 && analysis.mainPoints.length > 0) {
            questions.push({
                question: `What is a key insight or main point from this content?`,
                answer: analysis.mainPoints[0].substring(0, 150)
            });
        }
        
        return questions;
    }

    isCommonPhrase(phrase) {
        const commonPhrases = [
            'in the', 'of the', 'to the', 'for the', 'on the', 'at the', 'by the',
            'this is', 'that is', 'it is', 'there are', 'there is', 'you can',
            'we can', 'they are', 'will be', 'can be', 'may be', 'should be'
        ];
        return commonPhrases.includes(phrase.toLowerCase());
    }

    generateRecipeQuestions(analysis, content) {
        const questions = [];
        
        // Question about technique or method
        if (analysis.processes.length > 0) {
            questions.push({
                question: `What is a key cooking technique or method described in this recipe?`,
                answer: analysis.processes[0].replace(/step \d+[:\.]?\s*/i, '').trim()
            });
        }
        
        // Question about measurements or timing
        if (analysis.numericalData.length > 0) {
            questions.push({
                question: `What specific measurement, temperature, or timing is mentioned?`,
                answer: analysis.numericalData[0]
            });
        }
        
        // Question about ingredients or equipment
        if (analysis.keyConcepts.length > 0) {
            questions.push({
                question: `What is a key ingredient or equipment mentioned in this recipe?`,
                options: [
                    analysis.keyConcepts[0],
                    "basic flour",
                    "regular water",
                    "standard salt"
                ],
                correctAnswer: analysis.keyConcepts[0]
            });
        }
        
        return questions;
    }

    generateHistoryQuestions(analysis, content) {
        const questions = [];
        
        // Question about historical significance
        if (analysis.mainPoints.length > 0) {
            questions.push({
                question: `What is the historical significance or main impact discussed?`,
                answer: analysis.mainPoints[0].substring(0, 120)
            });
        }
        
        // Question about dates or periods
        if (analysis.numericalData.length > 0) {
            questions.push({
                question: `What specific date, year, or time period is mentioned?`,
                answer: analysis.numericalData[0]
            });
        }
        
        // Question about key figures or events
        if (analysis.keyConcepts.length > 0) {
            questions.push({
                question: `What is a key historical figure, event, or concept discussed?`,
                options: [
                    analysis.keyConcepts[0],
                    "general historical period",
                    "unknown historical figure",
                    "basic historical event"
                ],
                correctAnswer: analysis.keyConcepts[0]
            });
        }
        
        return questions;
    }

    generateResearchQuestions(analysis, content) {
        const questions = [];
        
        // Question about methodology
        if (analysis.processes.length > 0) {
            questions.push({
                question: `What research methodology or approach is described?`,
                answer: analysis.processes[0].trim()
            });
        }
        
        // Question about findings or results
        if (analysis.numericalData.length > 0) {
            questions.push({
                question: `What specific result, statistic, or measurement is reported?`,
                answer: analysis.numericalData[0]
            });
        }
        
        // Question about implications
        if (analysis.relationships.length > 0) {
            questions.push({
                question: `What is an important finding or relationship discovered in this research?`,
                answer: analysis.relationships[0].substring(0, 100)
            });
        }
        
        return questions;
    }

    async saveToLibrary(item) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            item.id = Date.now().toString();
            library.unshift(item);
            
            // Keep only last 50 items
            if (library.length > 50) {
                library.splice(50);
            }
            
            await this.saveToStorage('coachLensLibrary', library);
        } catch (error) {
            console.error('Failed to save to library:', error);
        }
    }

    setupTimelineEventListeners() {
        // Timeline item clicks
        document.querySelectorAll('.timeline-item.clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                if (itemId) {
                    console.log('Timeline item clicked:', itemId);
                    this.openTimelineItem(itemId);
                }
            });
        });

        // Timeline action buttons
        document.querySelectorAll('.timeline-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view) {
                    this.showTimelineView(view);
                }
            });
        });

        // Export button
        const exportBtn = document.getElementById('exportTimelineBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTimeline());
        }

        // Action buttons (view, share, delete)
        document.querySelectorAll('.timeline-view-btn[data-item-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.currentTarget.dataset.itemId;
                this.openTimelineItem(itemId);
            });
        });

        document.querySelectorAll('.timeline-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.currentTarget.dataset.itemId;
                this.shareTimelineItem(itemId);
            });
        });

        document.querySelectorAll('.timeline-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = e.currentTarget.dataset.itemId;
                this.deleteTimelineItem(itemId);
            });
        });
    }

    async loadTimeline() {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const timelineResult = document.getElementById('timelineResult');
            
            if (library.length === 0) {
                timelineResult.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📈</div>
                        <p>Your learning timeline will appear here</p>
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Start learning to build your timeline</p>
                    </div>
                `;
                return;
            }

            // Group items by topic for comparison
            const groupedItems = this.groupItemsByTopic(library);
            
            let timelineHtml = `
                <div class="timeline-controls">
                    <button class="timeline-view-btn active" id="viewAll" data-view="all">
                        📚 All Items (${library.length})
                    </button>
                    <button class="timeline-view-btn" id="viewGrouped" data-view="grouped">
                        🔗 Grouped Topics (${Object.keys(groupedItems).length})
                    </button>
                    <button class="timeline-action-btn" id="exportTimelineBtn">
                        📤 Export
                    </button>
                </div>
                
                <div id="timelineAllView">
                    ${this.renderTimelineItems(library.slice(0, 15))}
                </div>
                
                <div id="timelineGroupedView" style="display: none;">
                    ${this.renderGroupedTimeline(groupedItems)}
                </div>
            `;

            timelineResult.innerHTML = timelineHtml;
            
            // Add event listeners for timeline interactions
            this.setupTimelineEventListeners();
        } catch (error) {
            console.error('Failed to load timeline:', error);
        }
    }

    groupItemsByTopic(library) {
        const groups = {};
        
        library.forEach(item => {
            // Extract key topics from title and content
            const topics = this.extractTopics(item.title + ' ' + this.getItemPreview(item));
            const mainTopic = topics[0] || 'General';
            
            if (!groups[mainTopic]) {
                groups[mainTopic] = [];
            }
            groups[mainTopic].push(item);
        });
        
        // Only return groups with more than 1 item
        const filteredGroups = {};
        Object.keys(groups).forEach(topic => {
            if (groups[topic].length > 1) {
                filteredGroups[topic] = groups[topic];
            }
        });
        
        return filteredGroups;
    }

    extractTopics(text) {
        const commonTopics = [
            'machine learning', 'artificial intelligence', 'neural networks', 'deep learning',
            'programming', 'javascript', 'python', 'react', 'node.js',
            'mathematics', 'statistics', 'calculus', 'algebra',
            'science', 'physics', 'chemistry', 'biology',
            'business', 'marketing', 'finance', 'economics',
            'technology', 'software', 'development', 'coding'
        ];
        
        const textLower = text.toLowerCase();
        const foundTopics = commonTopics.filter(topic => 
            textLower.includes(topic)
        );
        
        return foundTopics.length > 0 ? foundTopics : ['General'];
    }

    renderTimelineItems(items) {
        return items.map(item => `
            <div class="timeline-item clickable" data-item-id="${item.id}">
                <div class="timeline-item-header">
                    <div class="item-type-badge ${item.type}">
                        ${this.getTypeIcon(item.type)}
                    </div>
                    <div class="item-info">
                        <h4>${this.truncateText(item.title, 45)}</h4>
                        <div class="item-meta">
                            <span class="date">${new Date(item.timestamp).toLocaleDateString()}</span>
                            ${item.url ? `<span class="source">📍 ${this.getDomainFromUrl(item.url)}</span>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-icon timeline-view-btn" data-item-id="${item.id}" title="View">👁️</button>
                        <button class="action-icon timeline-share-btn" data-item-id="${item.id}" title="Share">📤</button>
                        <button class="action-icon timeline-delete-btn" data-item-id="${item.id}" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="item-preview">
                    ${this.truncateText(this.getItemPreview(item), 100)}
                </div>
                ${item.url ? `
                    <div class="item-source">
                        <a href="${item.url}" target="_blank" onclick="event.stopPropagation()" class="source-link">
                            🔗 ${this.truncateText(item.url, 50)}
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderGroupedTimeline(groupedItems) {
        return Object.keys(groupedItems).map(topic => `
            <div class="topic-group">
                <div class="topic-header">
                    <h3>🏷️ ${topic}</h3>
                    <div class="topic-stats">
                        <span>${groupedItems[topic].length} items</span>
                        <button onclick="window.coachLens.compareTopicItems('${topic}')" class="compare-btn">
                            🔍 Compare
                        </button>
                    </div>
                </div>
                <div class="topic-items">
                    ${this.renderTimelineItems(groupedItems[topic])}
                </div>
            </div>
        `).join('');
    }

    showTimelineView(viewType) {
        const allView = document.getElementById('timelineAllView');
        const groupedView = document.getElementById('timelineGroupedView');
        const allBtn = document.getElementById('viewAll');
        const groupedBtn = document.getElementById('viewGrouped');
        
        if (viewType === 'all') {
            allView.style.display = 'block';
            groupedView.style.display = 'none';
            allBtn.classList.add('active');
            groupedBtn.classList.remove('active');
        } else {
            allView.style.display = 'none';
            groupedView.style.display = 'block';
            allBtn.classList.remove('active');
            groupedBtn.classList.add('active');
        }
    }

    setupModalEventListeners(itemId) {
        // Close button
        const closeBtn = document.getElementById('closeTimelineModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeTimelineModal());
        }

        // Action buttons
        document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const itemId = e.currentTarget.dataset.itemId;
                const url = e.currentTarget.dataset.url;

                switch (action) {
                    case 'reopen':
                        if (url) this.reopenOriginalPage(url);
                        break;
                    case 'edit':
                        if (itemId) this.editTimelineItem(itemId);
                        break;
                    case 'share':
                        if (itemId) this.shareTimelineItem(itemId);
                        break;
                    case 'quiz':
                        if (itemId) this.createFollowUpQuiz(itemId);
                        break;
                }
            });
        });
    }

    async openTimelineItem(itemId) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const item = library.find(i => i.id === itemId);
            
            if (!item) {
                this.showToast('Item not found', 'error');
                return;
            }

            // Find similar items for comparison
            const similarItems = this.findSimilarItems(item, library);

            // Create detailed view modal
            const modalHtml = `
                <div class="timeline-modal" id="timelineModal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <div class="modal-title">
                                <span class="type-badge ${item.type}">${this.getTypeIcon(item.type)}</span>
                                <h3>${item.title}</h3>
                            </div>
                            <button class="close-btn" id="closeTimelineModal">✕</button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="item-metadata">
                                <div class="meta-item">
                                    <strong>📅 Date:</strong> ${new Date(item.timestamp).toLocaleString()}
                                </div>
                                ${item.url ? `
                                    <div class="meta-item">
                                        <strong>🔗 Source:</strong> 
                                        <a href="${item.url}" target="_blank" class="source-link" onclick="event.stopPropagation()">
                                            ${this.getDomainFromUrl(item.url)} - Open Original Page
                                        </a>
                                    </div>
                                ` : ''}
                                <div class="meta-item">
                                    <strong>📊 Type:</strong> ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </div>
                                ${item.pageTitle ? `
                                    <div class="meta-item">
                                        <strong>📄 Page:</strong> ${item.pageTitle}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="item-content">
                                ${this.formatTimelineItemContent(item)}
                            </div>

                            ${similarItems.length > 0 ? `
                                <div class="similar-items-section">
                                    <h4>🔗 Related Learning Items (${similarItems.length})</h4>
                                    <div class="similar-items-grid">
                                        ${similarItems.map(similar => `
                                            <div class="similar-item" onclick="window.coachLens.openTimelineItem('${similar.id}')">
                                                <div class="similar-item-header">
                                                    <span class="type-badge ${similar.type}">${this.getTypeIcon(similar.type)}</span>
                                                    <span class="similar-item-title">${this.truncateText(similar.title, 30)}</span>
                                                </div>
                                                <div class="similar-item-date">${new Date(similar.timestamp).toLocaleDateString()}</div>
                                                <div class="similar-item-preview">${this.truncateText(this.getItemPreview(similar), 60)}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <button onclick="window.coachLens.compareItems(['${item.id}', ${similarItems.map(s => `'${s.id}'`).join(', ')}])" class="action-btn primary" style="margin-top: 12px;">
                                        🔍 Compare All Related Items
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="modal-actions">
                            <button class="action-btn secondary" data-action="reopen" data-url="${item.url || ''}">
                                🌐 Reopen Source
                            </button>
                            <button class="action-btn secondary" data-action="edit" data-item-id="${item.id}">
                                ✏️ Edit Notes
                            </button>
                            <button class="action-btn secondary" data-action="share" data-item-id="${item.id}">
                                📤 Share
                            </button>
                            <button class="action-btn primary" data-action="quiz" data-item-id="${item.id}">
                                🧠 Create Follow-up Quiz
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Add event listeners for modal buttons
            this.setupModalEventListeners(itemId);
        } catch (error) {
            console.error('Failed to open timeline item:', error);
            this.showToast('Failed to open item', 'error');
        }
    }

    formatTimelineItemContent(item) {
        if (item.type === 'quiz' && Array.isArray(item.content)) {
            return `
                <h4>📝 Quiz Questions:</h4>
                <div class="quiz-content-preview">
                    ${item.content.map((q, i) => `
                        <div class="quiz-question-preview">
                            <div class="question-number">Q${i + 1}</div>
                            <div class="question-content">
                                <strong>Question:</strong> ${q.question}<br>
                                <strong>Answer:</strong> <span class="correct-answer">${q.answer || q.correctAnswer}</span>
                                ${q.options ? `<br><strong>Options:</strong> ${q.options.join(', ')}` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (item.type === 'explanation' && item.originalText) {
            return `
                <div class="explanation-content-preview">
                    <h4>📖 Original Text:</h4>
                    <div class="original-text-block">"${item.originalText}"</div>
                    <h4>💡 Explanation:</h4>
                    <div class="explanation-text">${this.formatText(item.content)}</div>
                </div>
            `;
        } else if (item.type === 'summary') {
            return `
                <div class="summary-content-preview">
                    <h4>📋 Summary:</h4>
                    <div class="summary-text">${this.formatText(item.content)}</div>
                </div>
            `;
        } else if (item.type === 'chat') {
            return `
                <div class="chat-content-preview">
                    <h4>💬 Conversation:</h4>
                    <div class="chat-text">${this.formatText(item.content)}</div>
                </div>
            `;
        } else {
            return `<div class="general-content">${this.formatText(item.content)}</div>`;
        }
    }

    findSimilarItems(currentItem, library) {
        const similarItems = [];
        const currentTopics = this.extractTopics(currentItem.title + ' ' + this.getItemPreview(currentItem));
        
        library.forEach(item => {
            if (item.id === currentItem.id) return;
            
            const itemTopics = this.extractTopics(item.title + ' ' + this.getItemPreview(item));
            const commonTopics = currentTopics.filter(topic => itemTopics.includes(topic));
            
            // Calculate similarity score
            let similarityScore = 0;
            
            // Same domain/source
            if (currentItem.url && item.url && this.getDomainFromUrl(currentItem.url) === this.getDomainFromUrl(item.url)) {
                similarityScore += 3;
            }
            
            // Common topics
            similarityScore += commonTopics.length * 2;
            
            // Similar titles
            if (this.calculateTextSimilarity(currentItem.title, item.title) > 0.3) {
                similarityScore += 2;
            }
            
            // Same type
            if (currentItem.type === item.type) {
                similarityScore += 1;
            }
            
            if (similarityScore >= 2) {
                similarItems.push({
                    ...item,
                    similarityScore
                });
            }
        });
        
        // Sort by similarity score and return top 5
        return similarItems
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, 5);
    }

    calculateTextSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    async compareItems(itemIds) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const items = itemIds.map(id => library.find(item => item.id === id)).filter(Boolean);
            
            if (items.length < 2) {
                this.showToast('Need at least 2 items to compare', 'warning');
                return;
            }

            // Close current modal
            this.closeTimelineModal();

            // Create comparison modal
            const comparisonHtml = `
                <div class="timeline-modal" id="comparisonModal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <div class="modal-title">
                                <span>🔍</span>
                                <h3>Compare Learning Items</h3>
                            </div>
                            <button onclick="window.coachLens.closeComparisonModal()" class="close-btn">✕</button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="comparison-stats">
                                <div class="stat">
                                    <strong>${items.length}</strong>
                                    <span>Items</span>
                                </div>
                                <div class="stat">
                                    <strong>${new Set(items.map(i => i.type)).size}</strong>
                                    <span>Types</span>
                                </div>
                                <div class="stat">
                                    <strong>${new Set(items.map(i => this.getDomainFromUrl(i.url)).filter(Boolean)).size}</strong>
                                    <span>Sources</span>
                                </div>
                            </div>

                            <div class="comparison-analysis">
                                <h4>🧠 AI Analysis</h4>
                                <p>These items share common topics and learning themes. Use this comparison to identify knowledge gaps and reinforce learning.</p>
                            </div>

                            <div class="comparison-items-grid">
                                ${items.map(item => `
                                    <div class="comparison-item-card">
                                        <div class="item-header">
                                            <span class="type-badge ${item.type}">${this.getTypeIcon(item.type)}</span>
                                            <h4>${item.title}</h4>
                                        </div>
                                        <div class="item-meta">
                                            <span class="date">${new Date(item.timestamp).toLocaleDateString()}</span>
                                            ${item.url ? `<span class="source">📍 ${this.getDomainFromUrl(item.url)}</span>` : ''}
                                        </div>
                                        <div class="item-preview">
                                            ${this.truncateText(this.getItemPreview(item), 120)}
                                        </div>
                                        <div class="item-actions">
                                            <button onclick="window.coachLens.openTimelineItem('${item.id}')" class="action-btn secondary small">
                                                👁️ View
                                            </button>
                                            ${item.url ? `
                                                <button onclick="window.open('${item.url}', '_blank')" class="action-btn secondary small">
                                                    🌐 Source
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button onclick="window.coachLens.generateComparisonQuiz([${itemIds.map(id => `'${id}'`).join(', ')}])" class="action-btn primary">
                                🧠 Generate Comparison Quiz
                            </button>
                            <button onclick="window.coachLens.exportComparison([${itemIds.map(id => `'${id}'`).join(', ')}])" class="action-btn secondary">
                                📤 Export Comparison
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', comparisonHtml);
        } catch (error) {
            console.error('Failed to compare items:', error);
            this.showToast('Failed to compare items', 'error');
        }
    }

    async compareTopicItems(topic) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const topicItems = library.filter(item => 
                this.extractTopics(item.title + ' ' + this.getItemPreview(item)).includes(topic)
            );

            if (topicItems.length < 2) {
                this.showToast('Need at least 2 items to compare', 'warning');
                return;
            }

            // Generate comparison using AI
            const comparison = await this.generateComparison(topicItems, topic);
            
            const comparisonModal = `
                <div class="timeline-modal" id="comparisonModal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3>🔍 Topic Comparison: ${topic}</h3>
                            <button onclick="window.coachLens.closeComparisonModal()" class="close-btn">✕</button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="comparison-stats">
                                <div class="stat">
                                    <strong>${topicItems.length}</strong>
                                    <span>Items Found</span>
                                </div>
                                <div class="stat">
                                    <strong>${new Set(topicItems.map(i => i.type)).size}</strong>
                                    <span>Content Types</span>
                                </div>
                                <div class="stat">
                                    <strong>${new Set(topicItems.map(i => this.getDomainFromUrl(i.url))).size}</strong>
                                    <span>Sources</span>
                                </div>
                            </div>
                            
                            <div class="comparison-content">
                                <h4>📊 AI Analysis:</h4>
                                <div class="comparison-analysis">
                                    ${this.formatText(comparison)}
                                </div>
                                
                                <h4>📚 Related Items:</h4>
                                <div class="comparison-items">
                                    ${topicItems.map(item => `
                                        <div class="comparison-item" onclick="window.coachLens.openTimelineItem('${item.id}')">
                                            <div class="item-header">
                                                <span class="type-badge ${item.type}">${this.getTypeIcon(item.type)}</span>
                                                <strong>${this.truncateText(item.title, 35)}</strong>
                                            </div>
                                            <div class="item-date">${new Date(item.timestamp).toLocaleDateString()}</div>
                                            <div class="item-preview">${this.truncateText(this.getItemPreview(item), 80)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', comparisonModal);
        } catch (error) {
            console.error('Failed to compare items:', error);
            this.showToast('Failed to generate comparison', 'error');
        }
    }

    async generateComparison(items, topic) {
        const itemSummaries = items.map(item => 
            `${item.type}: ${item.title} - ${this.truncateText(this.getItemPreview(item), 100)}`
        ).join('\n');

        try {
            return await this.callAI('compare', itemSummaries, topic);
        } catch (error) {
            return `Comparison of ${items.length} items about "${topic}":\n\n` +
                   `• Found ${items.length} related learning items\n` +
                   `• Content types: ${[...new Set(items.map(i => i.type))].join(', ')}\n` +
                   `• This topic appears to be important in your learning journey\n` +
                   `• Consider reviewing these items together for better understanding`;
        }
    }

    getDomainFromUrl(url) {
        if (!url) return 'Unknown';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Unknown';
        }
    }

    closeTimelineModal() {
        const modal = document.getElementById('timelineModal');
        if (modal) modal.remove();
    }

    closeComparisonModal() {
        const modal = document.getElementById('comparisonModal');
        if (modal) modal.remove();
    }

    async reopenOriginalPage(url) {
        if (!url) {
            this.showToast('No source URL available', 'warning');
            return;
        }
        
        try {
            await chrome.tabs.create({ url: url });
            this.showToast('Opened original page in new tab', 'success');
        } catch (error) {
            console.error('Failed to open page:', error);
            this.showToast('Failed to open page', 'error');
        }
    }

    async createFollowUpQuiz(itemId) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const item = library.find(i => i.id === itemId);
            
            if (!item) {
                this.showToast('Item not found', 'error');
                return;
            }

            this.closeTimelineModal();
            
            // Switch to quiz tab and generate quiz based on this item
            this.switchTab('quiz');
            
            // Show loading
            this.showLoading('Generating follow-up quiz...');
            
            // Generate quiz content based on the timeline item
            const quizContent = await this.generateFollowUpQuiz(item);
            
            this.hideLoading();
            
            if (quizContent) {
                this.displayInteractiveQuiz(quizContent);
                this.showToast('Follow-up quiz generated!', 'success');
            }
        } catch (error) {
            console.error('Failed to create follow-up quiz:', error);
            this.hideLoading();
            this.showToast('Failed to generate quiz', 'error');
        }
    }

    async generateFollowUpQuiz(item) {
        try {
            const prompt = `Based on this learning item, create 3 follow-up questions to test deeper understanding:

Title: ${item.title}
Type: ${item.type}
Content: ${this.getItemPreview(item)}

Generate questions that:
1. Test application of concepts
2. Explore connections to related topics  
3. Challenge critical thinking

Format as JSON array with question, options (for multiple choice), and answer fields.`;

            const response = await this.aiEngine.generateText(prompt);
            return this.parseQuizResponse(response);
        } catch (error) {
            console.error('Failed to generate follow-up quiz:', error);
            return null;
        }
    }

    async generateComparisonQuiz(itemIds) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const items = itemIds.map(id => library.find(item => item.id === id)).filter(Boolean);
            
            this.closeComparisonModal();
            this.switchTab('quiz');
            this.showLoading('Generating comparison quiz...');
            
            const prompt = `Create a quiz comparing these learning items:

${items.map((item, i) => `
Item ${i + 1}: ${item.title}
Type: ${item.type}
Content: ${this.getItemPreview(item)}
`).join('\n')}

Generate 4 questions that:
1. Compare concepts across items
2. Test understanding of differences
3. Explore connections and relationships
4. Challenge synthesis of information

Format as JSON array with question, options, and answer fields.`;

            const response = await this.aiEngine.generateText(prompt);
            const quizContent = this.parseQuizResponse(response);
            
            this.hideLoading();
            
            if (quizContent) {
                this.displayInteractiveQuiz(quizContent);
                this.showToast('Comparison quiz generated!', 'success');
            }
        } catch (error) {
            console.error('Failed to generate comparison quiz:', error);
            this.hideLoading();
            this.showToast('Failed to generate quiz', 'error');
        }
    }

    async exportComparison(itemIds) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const items = itemIds.map(id => library.find(item => item.id === id)).filter(Boolean);
            
            const exportData = {
                title: 'CoachLens Learning Comparison',
                date: new Date().toISOString(),
                items: items.map(item => ({
                    title: item.title,
                    type: item.type,
                    date: new Date(item.timestamp).toLocaleDateString(),
                    content: this.getItemPreview(item),
                    source: item.url || 'N/A'
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `coachlens-comparison-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showToast('Comparison exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export comparison:', error);
            this.showToast('Failed to export comparison', 'error');
        }
    }

    getDomainFromUrl(url) {
        if (!url) return 'Unknown';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Unknown';
        }
    }

    formatText(text) {
        if (!text) return '';
        
        // Convert markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    formatSummaryContent(summary) {
        if (!summary) return '<p>No summary available</p>';
        
        // Check if summary has structured sections
        if (summary.includes('##') || summary.includes('###')) {
            // Format markdown-style headers
            return summary
                .replace(/### (.*?)$/gm, '<h4 style="color: #4f46e5; margin: 16px 0 8px 0; font-size: 14px;">$1</h4>')
                .replace(/## (.*?)$/gm, '<h3 style="color: #1e293b; margin: 20px 0 12px 0; font-size: 16px;">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/- (.*?)$/gm, '<li style="margin: 4px 0;">$1</li>')
                .replace(/(<li.*?<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/^(?!<[hul])/gm, '<p>')
                .replace(/(?<!>)$/gm, '</p>')
                .replace(/<p><\/p>/g, '');
        } else {
            // Simple formatting for unstructured text
            return this.formatText(summary);
        }
    }

    closeComparisonModal() {
        const modal = document.getElementById('comparisonModal');
        if (modal) modal.remove();
    }

    async shareTimelineItem(itemId) {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const item = library.find(i => i.id === itemId);
            
            if (!item) return;

            const shareText = `📚 CoachLens Learning Item\n\n` +
                            `${this.getTypeIcon(item.type)} ${item.title}\n` +
                            `📅 ${new Date(item.timestamp).toLocaleDateString()}\n\n` +
                            `${this.truncateText(this.getItemPreview(item), 200)}\n\n` +
                            `${item.url ? `🔗 Source: ${item.url}` : ''}`;

            if (navigator.share) {
                await navigator.share({
                    title: item.title,
                    text: shareText
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                this.showToast('Copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Failed to share item:', error);
            this.showToast('Failed to share item', 'error');
        }
    }

    async deleteTimelineItem(itemId) {
        if (!confirm('Are you sure you want to delete this learning item?')) return;

        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            const updatedLibrary = library.filter(item => item.id !== itemId);
            
            await this.saveToStorage('coachLensLibrary', updatedLibrary);
            this.loadTimeline();
            this.showToast('Item deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete item:', error);
            this.showToast('Failed to delete item', 'error');
        }
    }

    async exportTimeline() {
        try {
            const library = await this.getFromStorage('coachLensLibrary') || [];
            
            if (library.length === 0) {
                this.showToast('No items to export', 'warning');
                return;
            }

            let exportContent = `# CoachLens 2.0 - Learning Timeline Export\n\n`;
            exportContent += `**Exported:** ${new Date().toLocaleDateString()}\n`;
            exportContent += `**Total Items:** ${library.length}\n\n`;
            exportContent += `---\n\n`;

            library.forEach((item, index) => {
                exportContent += `## ${index + 1}. ${item.title}\n\n`;
                exportContent += `**Type:** ${item.type}\n`;
                exportContent += `**Date:** ${new Date(item.timestamp).toLocaleDateString()}\n`;
                if (item.url) exportContent += `**Source:** ${item.url}\n`;
                exportContent += `\n`;
                
                if (item.originalText) {
                    exportContent += `**Original Text:** "${item.originalText}"\n\n`;
                }
                
                if (Array.isArray(item.content)) {
                    item.content.forEach((q, i) => {
                        exportContent += `**Q${i + 1}:** ${q.question}\n`;
                        exportContent += `**A${i + 1}:** ${q.answer || q.correctAnswer}\n\n`;
                    });
                } else {
                    exportContent += `${item.content}\n\n`;
                }
                
                exportContent += `---\n\n`;
            });

            // Download as markdown file
            const blob = new Blob([exportContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `coachlens-timeline-${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Timeline exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export timeline:', error);
            this.showToast('Failed to export timeline', 'error');
        }
    }

    getTypeIcon(type) {
        const icons = {
            summary: '📝',
            explanation: '💡',
            quiz: '🧠',
            chat: '💬'
        };
        return icons[type] || '📄';
    }

    getItemPreview(item) {
        if (typeof item.content === 'string') {
            return item.content;
        } else if (Array.isArray(item.content)) {
            return `${item.content.length} questions`;
        }
        return 'Content available';
    }

    // Utility methods
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }



    showLoading() {
        document.getElementById('loading').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('show');
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.6';
            const textSpan = button.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = 'Processing...';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        }[type] || 'ℹ️';
        
        toast.innerHTML = `${icon} ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    async saveToStorage(key, data) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: data }, resolve);
        });
    }

    async getFromStorage(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] || null);
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CoachLens...');
    try {
        window.coachLens = new CoachLens();
        console.log('CoachLens initialized successfully');
    } catch (error) {
        console.error('Failed to initialize CoachLens:', error);
    }
});

console.log('CoachLens 2.0 popup script loaded');