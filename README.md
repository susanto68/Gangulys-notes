# AI Avatar Assistant

An interactive Next.js application featuring AI-powered educational avatars with speech recognition and synthesis capabilities. Users can select from various subject-specific AI teachers and engage in voice-based learning conversations.

## 🎯 Project Overview

This application provides an immersive learning experience through:

- **12 Specialized AI Teachers**: Computer Science, English, Biology, Physics, Chemistry, History, Geography, Hindi, Mathematics, Doctor, Engineer, and Lawyer
- **Voice Interaction**: Speech recognition for questions, speech synthesis for responses
- **Real-time AI Responses**: Powered by Google's Gemini 2.0 Flash model
- **Responsive Design**: Modern UI with Tailwind CSS and glass morphism effects
- **Smart Welcome System**: Intelligent welcome message that plays once per session
- **Error Handling**: Comprehensive error management for all edge cases

## 🚀 Features

### Core Functionality
- **Avatar Selection**: Choose from 12 specialized AI teachers
- **Voice Recognition**: Speak questions naturally using browser speech API
- **AI Responses**: Get intelligent, subject-specific answers from Gemini AI
- **Speech Synthesis**: AI responses are spoken aloud for accessibility
- **Code Display**: Technical content shown in syntax-highlighted code boxes
- **Real-time Feedback**: Visual indicators for listening, speaking, and processing states
- **Smart Welcome**: Welcome message plays automatically once per session for better UX

### Technical Features
- **Next.js 13+**: React framework with API routes and modern features
- **Speech APIs**: Web Speech Recognition and Synthesis
- **Gemini AI**: Google's latest AI model for responses
- **Tailwind CSS**: Utility-first styling with custom animations
- **Responsive Design**: Mobile-first approach with PWA support
- **Session Management**: Intelligent welcome message handling
- **Error Handling**: Comprehensive error management
- **Auto-deployment**: Vercel integration

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.17 or higher
- **npm**: Version 8.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (for speech APIs)

### Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom configuration
NEXT_PUBLIC_APP_NAME="AI Avatar Assistant"
NEXT_PUBLIC_APP_VERSION="2.0.0"
```

### Getting Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env.local` file

## 📁 Folder Structure

```
Avatar_vercel/
├── components/                 # React components
│   ├── AvatarSelection/       # Page 1 components
│   │   ├── AvatarGrid.js     # Grid layout for avatars
│   │   ├── AvatarTile.js     # Individual avatar tiles
│   │   └── LoadingScreen.js  # Initial loading screen
│   ├── ChatInterface/        # Page 2 components
│   │   ├── AvatarDisplay.js  # Avatar display with animations
│   │   ├── TextDisplay.js    # Text and interim transcript display
│   │   ├── CodeBox.js        # Code snippet display
│   │   ├── ArticleCarousel.js # Related articles display
│   │   └── YouTubeVideos.js  # Related videos display
│   ├── Navigation/           # Navigation components
│   │   └── BackButton.js     # Back navigation button
│   ├── VoiceControls/        # Voice interaction controls
│   │   └── VoiceControls.js  # Talk/Stop buttons and status
│   ├── PWA/                  # Progressive Web App features
│   │   └── InstallPrompt.js  # App installation prompt
│   └── ErrorBoundary/        # Error handling
│       └── ErrorBoundary.js  # Error boundary component
├── hooks/                    # Custom React hooks
│   ├── useSpeechRecognition.js  # Speech recognition logic
│   ├── useSpeechSynthesis.js    # Speech synthesis logic
│   └── usePWA.js               # PWA functionality
├── lib/                      # Utility libraries
│   ├── avatars.js           # Avatar configuration data
│   ├── speech.js            # Speech utilities
│   └── contentSuggestions.js # Content suggestion logic
├── context/                  # Application context
│   ├── constant.js          # UI text and constants
│   └── prompts.js           # AI prompt templates
├── pages/                    # Next.js pages
│   ├── api/                 # API routes
│   │   ├── chat.js          # Gemini AI integration
│   │   └── tts.js           # Text-to-speech API
│   ├── _app.js              # App wrapper
│   ├── index.js             # Page 1: Avatar selection
│   └── [avatar].js          # Page 2: Chat interface
├── public/                   # Static assets
│   ├── assets/              # Images, icons, and media
│   │   ├── avatars/         # Avatar images
│   │   ├── icons/           # PWA icons
│   │   └── screenshots/     # App screenshots
│   ├── manifest.json        # PWA manifest
│   └── offline.html         # Offline fallback
├── styles/                   # Global styles
│   └── globals.css          # Tailwind and custom CSS
├── .env.local               # Environment variables
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
└── vercel.json              # Vercel deployment config
```

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Avatar_vercel
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your API key
nano .env.local
```

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🚀 Development Commands

### Development
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- -p 3001
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start

# Export static files
npm run export
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🌐 Deployment

### Vercel Auto-Deployment

This project is configured for automatic deployment on Vercel:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add `GEMINI_API_KEY` in Vercel dashboard
3. **Auto-Deploy**: Every push to main branch triggers deployment
4. **Preview Deployments**: Pull requests get preview URLs

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables on Vercel
1. Go to Vercel Dashboard → Your Project → Settings
2. Navigate to "Environment Variables"
3. Add `GEMINI_API_KEY` with your API key
4. Redeploy if needed

## 🧪 Testing Instructions

### Welcome Message Testing

#### 1. First Visit
```bash
# Test welcome message on first load
1. Open the application in a new browser session
2. Wait for loading screen to complete
3. Verify welcome message plays automatically
4. Check that status shows "Welcome message completed"
```

#### 2. Session Persistence
```bash
# Test welcome message persistence
1. Navigate to an avatar chat page
2. Return to main page using back button
3. Verify welcome message does NOT play again
4. Check status shows "Welcome message completed"
```

#### 3. Page Refresh
```bash
# Test welcome message on refresh
1. Refresh the main page (F5 or Ctrl+R)
2. Verify welcome message plays again
3. Check that localStorage is properly reset
```

### Speech Recognition Testing

#### 1. Microphone Permissions
```bash
# Test microphone access
1. Open browser developer tools (F12)
2. Go to Console tab
3. Click "Talk" button
4. Allow microphone permissions when prompted
5. Verify "Listening..." status appears
```

#### 2. Speech Recognition
```bash
# Test speech input
1. Click "Talk" button
2. Speak clearly: "What is a variable in programming?"
3. Click "Stop Listening" or wait for auto-stop
4. Verify transcript appears in text box
5. Check API response and speech synthesis
```

#### 3. Error Scenarios
```bash
# Test no speech detected
1. Click "Talk" button
2. Stay silent for 10+ seconds
3. Verify "No speech detected" error appears

# Test permission denied
1. Block microphone in browser settings
2. Click "Talk" button
3. Verify permission error message
```

### API Testing

#### 1. Basic API Call
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is JavaScript?",
    "avatarType": "computer-teacher"
  }'
```

#### 2. Expected Response Format
```json
{
  "part1": "JavaScript is a programming language...",
  "part2": "```javascript\nconsole.log('Hello World');\n```",
  "avatarType": "computer-teacher",
  "success": true
}
```

#### 3. Error Testing
```bash
# Test missing prompt
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"avatarType": "computer-teacher"}'

# Test invalid avatar
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "avatarType": "invalid-avatar"}'
```

### Browser Compatibility Testing

#### Supported Browsers
- ✅ Chrome 66+
- ✅ Firefox 60+
- ✅ Safari 14.1+
- ✅ Edge 79+

#### Test Matrix
```bash
# Test speech recognition
1. Chrome: Full support
2. Firefox: Full support
3. Safari: Limited support (HTTPS required)
4. Edge: Full support

# Test speech synthesis
1. All browsers: Full support
2. Voice quality may vary
```

### Performance Testing

#### Load Testing
```bash
# Test avatar selection page
1. Measure initial load time
2. Test avatar grid responsiveness
3. Verify welcome audio plays once per session

# Test chat interface
1. Measure API response time
2. Test speech recognition latency
3. Verify UI responsiveness during processing
```

## 🔧 Configuration

### Avatar Configuration
Edit `lib/avatars.js` to modify avatar settings:

```javascript
export const AVATAR_CONFIG = {
  'computer-teacher': {
    name: 'Computer Teacher',
    image: '/avatars/computer-teacher.png',
    systemPrompt: 'You are a knowledgeable computer science teacher...',
    domain: 'Programming & Technology',
    greeting: 'Hello! I\'m your Computer Teacher...',
    emoji: '💻'
  }
  // Add more avatars...
}
```

### Speech Configuration
Modify speech settings in hooks:

```javascript
// useSpeechSynthesis.js
utterance.rate = 0.9        // Speech rate
utterance.pitch = 1.0       // Voice pitch
utterance.volume = 0.8      // Volume level

// useSpeechRecognition.js
recognition.lang = 'en-US'  // Language
recognition.continuous = false  // Single utterance
```

### Welcome Message Configuration
Customize welcome message behavior in `pages/index.js`:

```javascript
// Welcome message timing
const WELCOME_DELAY = 500;  // Delay after loading (ms)
const LOADING_DELAY = 1000; // Loading screen duration (ms)

// Session persistence
localStorage.setItem('welcomePlayed', 'true');  // Mark as played
localStorage.removeItem('welcomePlayed');       // Reset on refresh
```

### API Configuration
Adjust API settings in `pages/api/chat.js`:

```javascript
// Timeout settings
const API_TIMEOUT = 30000  // 30 seconds

// Gemini model settings
generationConfig: {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1000
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Welcome Message Not Playing
```bash
# Check session state
- Verify localStorage is working
- Check browser console for errors
- Ensure speech synthesis is supported

# Debug steps
1. Open browser console
2. Check for speech synthesis errors
3. Verify welcome message logic
4. Test with page refresh
```

#### 2. Speech Recognition Not Working
```bash
# Check browser support
- Ensure HTTPS in production
- Check microphone permissions
- Verify browser compatibility

# Debug steps
1. Open browser console
2. Check for speech recognition errors
3. Test microphone in browser settings
```

#### 3. API Errors
```bash
# Check environment variables
- Verify GEMINI_API_KEY is set
- Check API key validity
- Ensure proper format

# Debug steps
1. Check Vercel environment variables
2. Test API endpoint directly
3. Verify network connectivity
```

#### 4. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf .next
npm install
npm run build
```

### Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Welcome message failed" | Speech synthesis error | Check browser support and permissions |
| "Microphone access denied" | Browser permissions | Allow microphone in browser settings |
| "No speech detected" | No audio input | Speak louder or check microphone |
| "Request timeout" | API slow response | Try shorter question or check network |
| "Avatar not found" | Invalid avatar type | Select valid avatar from list |
| "AI service unavailable" | Gemini API issue | Check API key and service status |

## 📝 Recent Updates (v2.0.0)

### ✅ Improvements Made
- **Simple Visitor Counter**: Added a clean, minimal visitor counter at top-left with consistent design across all pages
- **Smart Welcome System**: Welcome message now plays only once per session for better UX
- **Session Management**: Intelligent localStorage handling for welcome message state
- **Responsive Design**: Visitor counter adapts perfectly to both mobile and desktop screens
- **Performance**: Optimized visitor counting with minimal localStorage operations
- **Consistent Experience**: Both main page and avatar chat now have the same clean interface and visitor counter

### 🔄 Welcome Message Behavior
- **First Visit**: Plays automatically after loading
- **Navigation**: Won't repeat when navigating between pages
- **Page Refresh**: Plays again on each page refresh/reload
- **Session Persistence**: Uses localStorage to track play state

### 🎨 UI/UX Enhancements
- **Clean Visitor Counter**: Small, unobtrusive counter with same background color scheme
- **Mobile-First Design**: Responsive visitor counter that works perfectly on all screen sizes
- **Better Mobile Experience**: Optimized spacing and sizing for mobile devices
- **Improved Performance**: Efficient visitor counting without complex animations
- **Professional Look**: More polished and focused user interface throughout the app
- **Unified Design**: Consistent experience between main page and avatar chat screens

### 📱 Visitor Counter Features
- **Responsive Design**: Automatically adapts to mobile and desktop screen sizes
- **Consistent Styling**: Matches the app's color scheme and design language
- **Minimal Footprint**: Small size that doesn't interfere with main content
- **Real-time Updates**: Shows current visitor count across all pages
- **Mobile Optimized**: Touch-friendly sizing and positioning on small screens
- **Custom Format**: Displays "Number of Visitor:- X" with bold red text
- **Starting Count**: Begins counting from 503 onwards for professional appearance

## 📝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add new feature'`
5. Push to branch: `git push origin feature/new-feature`
6. Create pull request

### Code Standards
- Use ESLint configuration
- Follow React best practices
- Add error handling for new features
- Test speech and API functionality
- Update documentation for changes

## 📄 License

This project is Created by Sir Ganguly for educational purposes.

## 🤝 Support

For issues and questions:
1. Check troubleshooting section
2. Review error messages reference
3. Test with different browsers
4. Verify environment configuration

---

**Created by Sir Ganguly**  
*AI Avatar Assistant - Interactive Learning Platform v2.0.0*
