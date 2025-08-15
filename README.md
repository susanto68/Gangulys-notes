# AI Avatar Assistant

An interactive Next.js application featuring AI-powered educational avatars with speech recognition and synthesis capabilities. Users can select from various subject-specific AI teachers and engage in voice-based learning conversations.

## 🎯 Project Overview

This application provides an immersive learning experience through:

- **12 Specialized AI Teachers**: Computer Science, English, Biology, Physics, Chemistry, History, Geography, Hindi, Mathematics, Doctor, Engineer, and Lawyer
- **Voice Interaction**: Speech recognition for questions, speech synthesis for responses
- **Real-time AI Responses**: Powered by Google's Gemini 2.0 Flash model
- **Responsive Design**: Modern UI with Tailwind CSS and glass morphism effects
- **Error Handling**: Comprehensive error management for all edge cases

## 🚀 Features

### Core Functionality
- **Avatar Selection**: Choose from 12 specialized AI teachers
- **Voice Recognition**: Speak questions naturally using browser speech API
- **AI Responses**: Get intelligent, subject-specific answers from Gemini AI
- **Speech Synthesis**: AI responses are spoken aloud for accessibility
- **Code Display**: Technical content shown in syntax-highlighted code boxes
- **Real-time Feedback**: Visual indicators for listening, speaking, and processing states

### Technical Features
- **Next.js 12+**: React framework with API routes
- **Speech APIs**: Web Speech Recognition and Synthesis
- **Gemini AI**: Google's latest AI model for responses
- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive error management
- **Auto-deployment**: Vercel integration

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 16.0 or higher
- **npm**: Version 8.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (for speech APIs)

### Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom configuration
NEXT_PUBLIC_APP_NAME="AI Avatar Assistant"
NEXT_PUBLIC_APP_VERSION="1.0.0"
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
│   │   └── CodeBox.js        # Code snippet display
│   ├── Navigation/           # Navigation components
│   │   └── BackButton.js     # Back navigation button
│   └── VoiceControls/        # Voice interaction controls
│       └── VoiceControls.js  # Talk/Stop buttons and status
├── hooks/                    # Custom React hooks
│   ├── useSpeechRecognition.js  # Speech recognition logic
│   └── useSpeechSynthesis.js    # Speech synthesis logic
├── lib/                      # Utility libraries
│   └── avatars.js           # Avatar configuration data
├── pages/                    # Next.js pages
│   ├── api/                 # API routes
│   │   └── chat.js          # Gemini AI integration
│   ├── _app.js              # App wrapper
│   ├── index.js             # Page 1: Avatar selection
│   └── [avatar].js          # Page 2: Chat interface
├── public/                   # Static assets
│   └── avatars/             # Avatar images
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
3. Verify welcome audio plays

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

#### 1. Speech Recognition Not Working
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

#### 2. API Errors
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

#### 3. Build Errors
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
| "Microphone access denied" | Browser permissions | Allow microphone in browser settings |
| "No speech detected" | No audio input | Speak louder or check microphone |
| "Request timeout" | API slow response | Try shorter question or check network |
| "Avatar not found" | Invalid avatar type | Select valid avatar from list |
| "AI service unavailable" | Gemini API issue | Check API key and service status |

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
*AI Avatar Assistant - Interactive Learning Platform*
