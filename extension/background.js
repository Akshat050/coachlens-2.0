// Background service worker for CoachLens 2.0

class CoachLensBackground {
    constructor() {
        this.init();
    }

    init() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle tab updates for learning tracking
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Handle extension icon click
        chrome.action.onClicked.addListener((tab) => {
            this.handleIconClick(tab);
        });
    }

    handleInstallation(details) {
        if (details.reason === 'install') {
            // First time installation
            this.initializeStorage();
            this.showWelcomeNotification();
        } else if (details.reason === 'update') {
            // Extension update
            this.handleUpdate(details.previousVersion);
        }
    }

    async initializeStorage() {
        const defaultData = {
            timeline: [],
            quizHistory: [],
            settings: {
                autoSummarize: false,
                voiceEnabled: true,
                theme: 'light',
                aiPreference: 'auto' // auto, builtin, api
            },
            stats: {
                pagesProcessed: 0,
                quizzesTaken: 0,
                conceptsLearned: 0,
                totalStudyTime: 0
            }
        };

        // Only set defaults if they don't exist
        for (const [key, value] of Object.entries(defaultData)) {
            const existing = await this.getStorageData(key);
            if (existing === null) {
                await this.setStorageData(key, value);
            }
        }
    }

    showWelcomeNotification() {
        // Skip notifications for now to avoid permission issues
        console.log('CoachLens 2.0 installed successfully');
    }

    handleUpdate(previousVersion) {
        console.log(`Updated from version ${previousVersion}`);
        // Handle any migration logic here
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getPageContent':
                    const content = await this.getPageContentFromTab(sender.tab.id);
                    sendResponse(content);
                    break;

                case 'saveToTimeline':
                    const timeline = await this.saveToTimeline(request.data);
                    sendResponse({ success: true, timeline });
                    break;

                case 'getTimeline':
                    const timelineData = await this.getStorageData('timeline') || [];
                    sendResponse(timelineData);
                    break;

                case 'saveQuizResult':
                    const quizResult = await this.saveQuizResult(request.data);
                    sendResponse(quizResult);
                    break;

                case 'getStats':
                    const stats = await this.getStorageData('stats');
                    sendResponse(stats);
                    break;

                case 'updateStats':
                    await this.updateStats(request.data);
                    sendResponse({ success: true });
                    break;

                case 'getSettings':
                    const settings = await this.getStorageData('settings');
                    sendResponse(settings);
                    break;

                case 'updateSettings':
                    await this.setStorageData('settings', request.data);
                    sendResponse({ success: true });
                    break;

                case 'checkAIAvailability':
                    const aiStatus = await this.checkAIAvailability();
                    sendResponse(aiStatus);
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ error: error.message });
        }
    }

    async getPageContentFromTab(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                function: () => {
                    // This function runs in the context of the web page
                    const removeElements = document.querySelectorAll(
                        'script, style, nav, header, footer, aside, .advertisement, .ads'
                    );
                    removeElements.forEach(el => el.remove());

                    const content = document.body.innerText || document.body.textContent || '';
                    return {
                        title: document.title || '',
                        url: window.location.href,
                        content: content.slice(0, 8000),
                        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
                        timestamp: new Date().toISOString()
                    };
                }
            });

            return results[0].result;
        } catch (error) {
            console.error('Error getting page content:', error);
            return {
                title: 'Error',
                url: '',
                content: 'Could not extract page content.',
                wordCount: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    async saveToTimeline(data) {
        try {
            const timeline = await this.getStorageData('timeline') || [];
            
            const entry = {
                id: Date.now(),
                title: data.title,
                url: data.url,
                date: new Date().toISOString(),
                wordCount: data.wordCount,
                summary: data.summary ? data.summary.slice(0, 200) + '...' : '',
                insights: this.extractKeyInsights(data.summary || ''),
                type: data.type || 'summary' // summary, quiz, explanation
            };

            timeline.unshift(entry);

            // Keep only last 50 entries
            if (timeline.length > 50) {
                timeline.splice(50);
            }

            await this.setStorageData('timeline', timeline);
            
            // Update stats
            await this.updateStats({ pagesProcessed: 1 });

            return timeline;
        } catch (error) {
            console.error('Error saving to timeline:', error);
            throw error;
        }
    }

    extractKeyInsights(text) {
        if (!text) return '';
        
        const lines = text.split('\n').filter(line => 
            line.trim().length > 0 && 
            (line.includes('•') || line.includes('-') || line.includes('*') || line.includes('##'))
        );
        
        return lines.slice(0, 3)
            .map(line => line.replace(/[•\-*#]/g, '').trim())
            .join(' • ');
    }

    async saveQuizResult(data) {
        try {
            const quizHistory = await this.getStorageData('quizHistory') || [];
            
            const result = {
                id: Date.now(),
                date: new Date().toISOString(),
                score: data.score,
                total: data.total,
                percentage: Math.round((data.score / data.total) * 100),
                topic: data.topic || 'General',
                timeSpent: data.timeSpent || 0
            };

            quizHistory.unshift(result);

            // Keep only last 20 results
            if (quizHistory.length > 20) {
                quizHistory.splice(20);
            }

            await this.setStorageData('quizHistory', quizHistory);
            
            // Update stats
            await this.updateStats({ 
                quizzesTaken: 1,
                conceptsLearned: data.score
            });

            return result;
        } catch (error) {
            console.error('Error saving quiz result:', error);
            throw error;
        }
    }

    async updateStats(updates) {
        try {
            const currentStats = await this.getStorageData('stats') || {
                pagesProcessed: 0,
                quizzesTaken: 0,
                conceptsLearned: 0,
                totalStudyTime: 0
            };

            for (const [key, value] of Object.entries(updates)) {
                if (typeof value === 'number') {
                    currentStats[key] = (currentStats[key] || 0) + value;
                } else {
                    currentStats[key] = value;
                }
            }

            await this.setStorageData('stats', currentStats);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async checkAIAvailability() {
        // This would need to be implemented based on the actual AI API availability
        // For now, return a mock status
        return {
            builtInAvailable: false, // Will be determined by the popup script
            apiAvailable: true, // Assume API is available
            preferredMode: 'api'
        };
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Track page navigation for learning analytics
        if (changeInfo.status === 'complete' && tab.url) {
            this.trackPageVisit(tab);
        }
    }

    async trackPageVisit(tab) {
        try {
            // Only track certain domains or content types
            const url = new URL(tab.url);
            const learningDomains = [
                'wikipedia.org',
                'medium.com',
                'stackoverflow.com',
                'github.com',
                'developer.mozilla.org',
                'w3schools.com',
                'coursera.org',
                'edx.org',
                'khanacademy.org'
            ];

            const isLearningContent = learningDomains.some(domain => 
                url.hostname.includes(domain)
            );

            if (isLearningContent) {
                // Could implement automatic suggestions here
                console.log('Learning content detected:', tab.title);
            }
        } catch (error) {
            // Ignore URL parsing errors
        }
    }

    handleIconClick(tab) {
        // This is handled by the popup, but we could add additional logic here
        console.log('CoachLens icon clicked on:', tab.title);
    }

    // Storage helper methods
    async getStorageData(key) {
        try {
            const result = await chrome.storage.local.get([key]);
            return result[key] || null;
        } catch (error) {
            console.error('Error getting storage data:', error);
            return null;
        }
    }

    async setStorageData(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (error) {
            console.error('Error setting storage data:', error);
            throw error;
        }
    }

    // Cleanup method
    cleanup() {
        // Clean up any resources if needed
        console.log('CoachLens background script cleanup');
    }
}

// Initialize background script
const coachLensBackground = new CoachLensBackground();

// Handle service worker lifecycle
self.addEventListener('beforeunload', () => {
    coachLensBackground.cleanup();
});