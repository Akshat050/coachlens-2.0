// Content script for CoachLens 2.0
// Runs on all web pages to enhance the learning experience

class CoachLensContent {
    constructor() {
        this.isActive = false;
        this.highlightedElements = new Set();
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
        });

        // Add visual indicators for learning mode
        this.addLearningIndicators();
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'getPageContent':
                sendResponse(this.getPageContent());
                break;
            case 'getSelectedText':
                sendResponse(this.getSelectedText());
                break;
            case 'highlightText':
                this.highlightText(request.text);
                sendResponse({ success: true });
                break;
            case 'toggleLearningMode':
                this.toggleLearningMode();
                sendResponse({ active: this.isActive });
                break;
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }

    getPageContent() {
        try {
            // Remove unwanted elements
            const elementsToRemove = document.querySelectorAll(
                'script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar'
            );
            
            // Create a clone to avoid modifying the actual page
            const clone = document.cloneNode(true);
            const cloneElementsToRemove = clone.querySelectorAll(
                'script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar'
            );
            
            cloneElementsToRemove.forEach(el => el.remove());

            // Get main content areas
            const contentSelectors = [
                'main',
                'article',
                '.content',
                '.post-content',
                '.entry-content',
                '#content',
                '.main-content'
            ];

            let mainContent = '';
            
            for (const selector of contentSelectors) {
                const element = clone.querySelector(selector);
                if (element) {
                    mainContent = element.innerText || element.textContent || '';
                    break;
                }
            }

            // Fallback to body content if no main content found
            if (!mainContent) {
                mainContent = clone.body.innerText || clone.body.textContent || '';
            }

            // Clean up the content
            mainContent = mainContent
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
                .trim();

            return {
                title: document.title || '',
                url: window.location.href,
                content: mainContent.slice(0, 8000), // Limit content length
                wordCount: mainContent.split(/\s+/).filter(word => word.length > 0).length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error extracting page content:', error);
            return {
                title: 'Error',
                url: window.location.href,
                content: 'Could not extract page content. Please refresh and try again.',
                wordCount: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    getSelectedText() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText) {
            // Store selection info for potential highlighting
            const range = selection.getRangeAt(0);
            return {
                text: selectedText,
                hasSelection: true,
                length: selectedText.length
            };
        }
        
        return {
            text: '',
            hasSelection: false,
            length: 0
        };
    }

    highlightText(searchText) {
        if (!searchText || searchText.length < 3) return;

        // Remove previous highlights
        this.removeHighlights();

        // Create a tree walker to find text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            if (node.nodeValue.toLowerCase().includes(searchText.toLowerCase())) {
                textNodes.push(node);
            }
        }

        // Highlight matching text
        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            if (parent && !this.isInIgnoredElement(parent)) {
                const text = textNode.nodeValue;
                const regex = new RegExp(`(${this.escapeRegex(searchText)})`, 'gi');
                
                if (regex.test(text)) {
                    const highlightedHTML = text.replace(regex, 
                        '<mark class="coachlens-highlight" style="background: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>'
                    );
                    
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = highlightedHTML;
                    parent.replaceChild(wrapper, textNode);
                    this.highlightedElements.add(wrapper);
                }
            }
        });
    }

    removeHighlights() {
        this.highlightedElements.forEach(element => {
            if (element.parentNode) {
                // Replace highlighted content with original text
                const textContent = element.textContent;
                const textNode = document.createTextNode(textContent);
                element.parentNode.replaceChild(textNode, element);
            }
        });
        this.highlightedElements.clear();

        // Also remove any remaining highlight marks
        document.querySelectorAll('.coachlens-highlight').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }

    isInIgnoredElement(element) {
        const ignoredTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'];
        const ignoredClasses = ['coachlens-highlight', 'advertisement', 'ads'];
        
        if (ignoredTags.includes(element.tagName)) {
            return true;
        }
        
        return ignoredClasses.some(className => 
            element.classList && element.classList.contains(className)
        );
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    toggleLearningMode() {
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            this.activateLearningMode();
        } else {
            this.deactivateLearningMode();
        }
    }

    activateLearningMode() {
        // Add visual indicator that learning mode is active
        if (!document.getElementById('coachlens-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'coachlens-indicator';
            indicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                    🧠 CoachLens Active
                </div>
            `;
            document.body.appendChild(indicator);
        }

        // Add subtle visual enhancements
        document.body.style.filter = 'brightness(1.02) contrast(1.02)';
    }

    deactivateLearningMode() {
        // Remove visual indicator
        const indicator = document.getElementById('coachlens-indicator');
        if (indicator) {
            indicator.remove();
        }

        // Remove highlights
        this.removeHighlights();

        // Reset visual enhancements
        document.body.style.filter = '';
    }

    addLearningIndicators() {
        // Add subtle CSS for better readability when CoachLens is active
        const style = document.createElement('style');
        style.textContent = `
            .coachlens-enhanced {
                line-height: 1.6 !important;
                font-size: 16px !important;
            }
            
            .coachlens-highlight {
                background: #fef08a !important;
                padding: 2px 4px !important;
                border-radius: 3px !important;
                transition: background-color 0.2s ease !important;
            }
            
            .coachlens-highlight:hover {
                background: #fde047 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Utility method to improve text readability
    enhanceReadability() {
        const textElements = document.querySelectorAll('p, article, .content, main');
        textElements.forEach(element => {
            if (element.textContent.length > 100) {
                element.classList.add('coachlens-enhanced');
            }
        });
    }

    // Method to detect and mark important content
    markImportantContent() {
        // Find headings, lists, and emphasized text
        const importantSelectors = [
            'h1, h2, h3, h4, h5, h6',
            'strong, b, em, i',
            'ul, ol, li',
            '.highlight, .important, .note'
        ];

        importantSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.style.position = 'relative';
                
                // Add a subtle indicator for important content
                const indicator = document.createElement('span');
                indicator.style.cssText = `
                    position: absolute;
                    left: -10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 20px;
                    background: #667eea;
                    border-radius: 2px;
                    opacity: 0.3;
                `;
                element.appendChild(indicator);
            });
        });
    }
}

// Initialize content script
const coachLensContent = new CoachLensContent();

// Auto-enhance readability on pages with substantial content
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            coachLensContent.enhanceReadability();
        }, 1000);
    });
} else {
    setTimeout(() => {
        coachLensContent.enhanceReadability();
    }, 1000);
}