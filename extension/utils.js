// Utility functions for CoachLens 2.0

class Utils {
    // Extract text content from the current page
    static async getPageContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Remove script and style elements
                    const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
                    scripts.forEach(el => el.remove());
                    
                    // Get main content
                    const content = document.body.innerText || document.body.textContent || '';
                    const title = document.title || '';
                    const url = window.location.href;
                    
                    return {
                        title,
                        url,
                        content: content.slice(0, 8000), // Limit content length
                        wordCount: content.split(/\s+/).length
                    };
                }
            });
            
            return results[0].result;
        } catch (error) {
            console.error('Error extracting page content:', error);
            return {
                title: 'Error',
                url: '',
                content: 'Could not extract page content. Please refresh and try again.',
                wordCount: 0
            };
        }
    }

    // Get selected text from the page
    static async getSelectedText() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const selection = window.getSelection();
                    return selection.toString().trim();
                }
            });
            
            return results[0].result || '';
        } catch (error) {
            console.error('Error getting selected text:', error);
            return '';
        }
    }

    // Storage helpers
    static async saveToStorage(key, data) {
        try {
            await chrome.storage.local.set({ [key]: data });
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    static async getFromStorage(key) {
        try {
            const result = await chrome.storage.local.get([key]);
            return result[key] || null;
        } catch (error) {
            console.error('Error getting from storage:', error);
            return null;
        }
    }

    // Timeline management
    static async saveToTimeline(pageData, summary) {
        try {
            const timeline = await this.getFromStorage('timeline') || [];
            const entry = {
                id: Date.now(),
                title: pageData.title,
                url: pageData.url,
                date: new Date().toISOString(),
                wordCount: pageData.wordCount,
                summary: summary.slice(0, 200) + '...',
                insights: this.extractKeyInsights(summary)
            };
            
            timeline.unshift(entry); // Add to beginning
            
            // Keep only last 20 entries
            if (timeline.length > 20) {
                timeline.splice(20);
            }
            
            await this.saveToStorage('timeline', timeline);
            return timeline;
        } catch (error) {
            console.error('Error saving to timeline:', error);
            return [];
        }
    }

    static extractKeyInsights(text) {
        // Extract key points from summary
        const lines = text.split('\n').filter(line => 
            line.trim().length > 0 && 
            (line.includes('•') || line.includes('-') || line.includes('*'))
        );
        
        return lines.slice(0, 3).map(line => 
            line.replace(/[•\-*]/g, '').trim()
        ).join(' • ');
    }

    // Quiz management
    static async saveQuizResult(score, total) {
        try {
            const quizHistory = await this.getFromStorage('quizHistory') || [];
            const result = {
                date: new Date().toISOString(),
                score,
                total,
                percentage: Math.round((score / total) * 100)
            };
            
            quizHistory.unshift(result);
            
            // Keep only last 10 results
            if (quizHistory.length > 10) {
                quizHistory.splice(10);
            }
            
            await this.saveToStorage('quizHistory', quizHistory);
            return result;
        } catch (error) {
            console.error('Error saving quiz result:', error);
            return null;
        }
    }

    // Text processing
    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Voice recognition
    static startVoiceRecognition(callback) {
        if (!('webkitSpeechRecognition' in window)) {
            callback('Voice recognition not supported in this browser');
            return null;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            callback(null, transcript);
        };

        recognition.onerror = (event) => {
            callback('Voice recognition error: ' + event.error);
        };

        recognition.start();
        return recognition;
    }

    // Text-to-speech
    static speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    // Download functionality
    static downloadAsMarkdown(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + '.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Error handling
    static showError(message) {
        console.error(message);
        // Could show toast notification here
    }

    static showSuccess(message) {
        console.log(message);
        // Could show toast notification here
    }

    // Loading state management
    static showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // Debounce function for performance
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}