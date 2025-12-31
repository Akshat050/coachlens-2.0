# 🧠 CoachLens 2.0

> AI Learning Companion - Your intelligent Chrome extension for enhanced learning experiences

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)](https://chrome.google.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is CoachLens?

CoachLens 2.0 is an intelligent Chrome extension that acts as your personal learning companion. It uses AI to provide real-time insights, personalized recommendations, and smart assistance while you browse educational content, watch tutorials, or research topics online.

### ✨ Key Features

- 🤖 **AI-Powered Insights** - Intelligent analysis of content you're learning
- 📝 **Smart Note-Taking** - Automatic summarization and key point extraction
- 🎓 **Learning Path Recommendations** - Personalized suggestions based on your interests
- ⏱️ **Focus Timer** - Built-in Pomodoro timer for productive learning sessions
- 📊 **Progress Tracking** - Monitor your learning journey and achievements
- 🔖 **Smart Bookmarking** - Organize and categorize learning resources automatically
- 💡 **Concept Explanations** - Instant clarification of complex topics
- 🌐 **Multi-Platform Support** - Works across educational platforms (YouTube, Coursera, etc.)

## 🚀 Installation

### From Chrome Web Store
*Coming Soon*

### Manual Installation (Development)

1. **Clone the repository**
```bash
git clone https://github.com/Akshat050/coachlens-2.0.git
cd coachlens-2.0
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
npm run build
```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project

## 💻 Usage

### Quick Start

1. **Click the CoachLens icon** in your Chrome toolbar
2. **Start learning** - Browse to any educational content
3. **Get AI assistance** - Click the floating widget for instant help
4. **Track progress** - View your learning stats in the dashboard

### Features in Action

#### 📹 Video Learning
- Automatically detect educational videos
- Generate timestamped summaries
- Extract key concepts and definitions
- Quiz generation from video content

#### 📄 Article Reading
- Highlight important passages
- Simplify complex explanations
- Related topic suggestions
- Readability optimization

#### 🎯 Focus Mode
- Distraction-free learning environment
- Pomodoro timer integration
- Progress tracking
- Break reminders

## 🛠️ Tech Stack

- **Manifest V3** - Latest Chrome Extension API
- **JavaScript (ES6+)** - Modern JavaScript features
- **Chrome APIs** - Storage, Tabs, Context Menus
- **AI Integration** - OpenAI/Gemini API for intelligent features
- **Webpack** - Module bundling
- **CSS3** - Modern styling with animations

## 📁 Project Structure

```
coachlens-2.0/
├── src/
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts
│   ├── popup/            # Extension popup UI
│   ├── options/          # Settings page
│   ├── utils/            # Utility functions
│   └── assets/           # Images, icons, styles
├── public/
│   └── manifest.json     # Extension manifest
├── tests/                # Test files
├── webpack.config.js     # Build configuration
└── package.json          # Dependencies
```

## ⚙️ Configuration

Create a `config.js` file in the `src` directory:

```javascript
export const config = {
  AI_API_KEY: 'your_ai_api_key_here',
  API_ENDPOINT: 'https://api.openai.com/v1',
  SYNC_ENABLED: true,
  THEME: 'auto', // 'light', 'dark', 'auto'
  LANGUAGE: 'en'
};
```

## 🎨 Customization

### Themes
CoachLens supports custom themes. Edit `src/assets/styles/themes.css`:

```css
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
  --background: #FFFFFF;
  --text: #333333;
}
```

### Shortcuts
Configure keyboard shortcuts in the extension settings or modify `src/utils/shortcuts.js`

## 🔧 Development

### Run in Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

## 📊 Features Breakdown

### AI-Powered Features
- Natural language processing for content analysis
- Contextual learning recommendations
- Intelligent question answering
- Adaptive learning path generation

### Productivity Tools
- Focus timer with customizable intervals
- Progress tracking and analytics
- Goal setting and achievement tracking
- Learning streak maintenance

### Content Organization
- Smart bookmarking with auto-tagging
- Collection management
- Search and filter capabilities
- Export and import functionality

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🐛 Known Issues

- [ ] Occasional sync delays with cloud storage
- [ ] Limited support for PDFs (coming in v2.1)
- [ ] Performance optimization needed for large playlists

## 🛣️ Roadmap

### Version 2.1 
- [ ] PDF annotation support
- [ ] Collaborative learning features
- [ ] Mobile companion app
- [ ] Offline mode

### Version 2.2 
- [ ] Advanced analytics dashboard
- [ ] Integration with popular LMS platforms
- [ ] Voice commands
- [ ] AR/VR learning support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AI providers for powering intelligent features
- Chrome Extension community for support and resources
- Beta testers for valuable feedback

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/Akshat050/coachlens-2.0/issues)
- **Email**: akshatbhatt30@gmail.com

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/Akshat050/coachlens-2.0?style=social)
![GitHub forks](https://img.shields.io/github/forks/Akshat050/coachlens-2.0?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Akshat050/coachlens-2.0?style=social)

---

<div align="center">

**Made with 💙 by Akshat**

[⭐ Star this repo](https://github.com/Akshat050/coachlens-2.0) if you find it helpful!

</div>
