// AI Avatar Application Constants
// Centralized constants for easy management by non-coders
// Created by Sir Ganguly

// ===== WELCOME MESSAGES =====
export const WELCOME_MESSAGES = {
  // Main page welcome
  MAIN_PAGE: "Hi, welcome to this experiment! Choose your AI teacher to begin learning.",
  
  // Avatar-specific greetings
  AVATAR_GREETINGS: {
    'hindi-teacher': (name, domain) => `आप अभी ${name} से बात कर रहे हैं। मैं ${domain.toLowerCase()} में आपकी मदद के लिए तैयार हूँ।`,
    'default': (name, domain) => `You're now talking to ${name}. I'm ready to help you learn about ${domain.toLowerCase()}.`
  },
  
  // TextDisplay component welcome
  TEXT_DISPLAY_WELCOME: (domain) => `👋 Welcome! I'm ready to help you learn.\nTap the Talk button to ask me anything about ${domain.toLowerCase()}!`
};

// ===== UI TEXT AND LABELS =====
export const UI_TEXT = {
  // Page titles and headers
      TITLES: {
      MAIN_PAGE: "🎓 Choose Your AI Teacher",
      SUBTITLE: "Select an avatar to start your learning journey",
      CREATOR: "Created by Sir Ganguly",
      FOOTER: "Tap any avatar to begin your learning journey"
    },
  
  // Loading screen text
  LOADING: {
    TITLE: "Loading AI Avatar Assistant...",
    CREATOR: "Created by Sir Ganguly",
    GREETING_READY: "🎵 Welcome greeting ready"
  },
  
  // Status indicators
  STATUS: {
    WELCOME_PLAYING: "🔊 Welcome message playing...",
    WELCOME_COMPLETED: "✅ Welcome message completed",
    PROCESSING: "🤔 Processing your question...",
    LISTENING: "🎤 Listening... Speak now!",
    NO_SPEECH: "No speech detected",
    SPEAKING: "🔊 Speaking...",
    WELCOME_MESSAGE: "Tap the button below to ask a question",
    PERMISSION_DENIED: "Microphone access denied",
    TIMEOUT: "Request timeout"
  },
  
  // Button labels
  BUTTONS: {
    TALK: "Talk",
    STOP: "Stop",
    BACK: "Back",
    TEST_SPEECH: "Test Speech",
    TEST_AUDIO: "Test AudioContext"
  }
};

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  // Speech recognition errors
  SPEECH: {
    NO_SPEECH: "I didn't hear anything. Please try speaking again, or check if your microphone is working properly.",
    PERMISSION: "Microphone access is required. Please allow microphone permissions in your browser settings and refresh the page.",
    NETWORK: "Network connection issue detected. Please check your internet connection and try again.",
    GENERIC: "There was an issue with speech recognition. Please try again."
  },
  
  // API and validation errors
  API: {
    INVALID_MESSAGE: "Please provide a valid question or message.",
    NETWORK_ERROR: "Network error occurred. Please check your connection and try again.",
    API_ERROR: "API error occurred. Please try again later.",
    TIMEOUT: "Request timed out. Please try again."
  }
};

// ===== AVATAR CONFIGURATION =====
export const AVATAR_CONFIG = {
  'computer-teacher': {
    name: 'Computer Teacher',
    domain: 'Programming & Technology',
    emoji: '💻',
    image: '/assets/avatars/computer-teacher.png',
    greeting: `Hello! I'm your Computer Teacher, AI avatar Created by Sir Ganguly.
I specialize in programming, algorithms, data structures, web & mobile dev, AI, and more.
What would you like to learn today?`.trim()
  },

  'english-teacher': {
    name: 'English Teacher',
    domain: 'Language & Literature',
    emoji: '📚',
    image: '/assets/avatars/english-teacher.png',
    greeting: `Hello! I'm your English Teacher, AI avatar Created by Sir Ganguly.
I specialize in grammar, writing, literature, and communication skills.
How can I help you improve your English today?`.trim()
  },

  'biology-teacher': {
    name: 'Biology Teacher',
    domain: 'Life Sciences',
    emoji: '🧬',
    image: '/assets/avatars/biology-teacher.png',
    greeting: `Hello! I'm your Biology Teacher, AI avatar Created by Sir Ganguly.
I explain life science concepts like genetics, ecology, and anatomy with real-world examples.
What would you like to explore today?`.trim()
  },

  'physics-teacher': {
    name: 'Physics Teacher',
    domain: 'Physical Sciences',
    emoji: '⚡',
    image: '/assets/avatars/physics-teacher.png',
    greeting: `Hello! I'm your Physics Teacher, AI avatar Created by Sir Ganguly.
I make mechanics, thermodynamics, and electromagnetism easy to understand.
What physics topic can I help you with?`.trim()
  },

  'chemistry-teacher': {
    name: 'Chemistry Teacher',
    domain: 'Chemical Sciences',
    emoji: '🧪',
    image: '/assets/avatars/chemistry-teacher.png',
    greeting: `Hello! I'm your Chemistry Teacher, AI avatar Created by Sir Ganguly.
I explain chemical reactions and principles with everyday examples.
What chemistry question do you have?`.trim()
  },

  'history-teacher': {
    name: 'History Teacher',
    domain: 'History & Culture',
    emoji: '📜',
    image: '/assets/avatars/history-teacher.png',
    greeting: `Hello! I'm your History Teacher, AI avatar Created by Sir Ganguly.
I bring world history and cultural stories to life.
Which era or event interests you today?`.trim()
  },

  'geography-teacher': {
    name: 'Geography Teacher',
    domain: 'Earth & Environment',
    emoji: '🌍',
    image: '/assets/avatars/geography-teacher.png',
    greeting: `Hello! I'm your Geography Teacher, AI avatar Created by Sir Ganguly.
I explain physical geography, human geography, and environmental issues.
What geographic concept would you like to learn?`.trim()
  },

  'hindi-teacher': {
    name: 'Hindi Teacher',
    domain: 'Hindi Language',
    emoji: '🇮🇳',
    image: '/assets/avatars/hindi-teacher.png',
    greeting: `नमस्ते! मैं आपका हिंदी शिक्षक, AI अवतार, हूँ, जिसे सर गांगुली ने बनाया है।
मैं हिंदी व्याकरण, साहित्य, और संस्कृति में आपकी मदद करूँगा।
आपको किस बारे में जानना है?`.trim()
  },

  'mathematics-teacher': {
    name: 'Mathematics Teacher',
    domain: 'Math & Logic',
    emoji: '📐',
    image: '/assets/avatars/mathematics-teacher.png',
    greeting: `Hello! I'm your Mathematics Teacher, AI avatar Created by Sir Ganguly.
I simplify algebra, calculus, statistics, and proofs step by step.
Which math problem shall we solve today?`.trim()
  },

  'doctor': {
    name: 'Doctor',
    domain: 'Health & Medicine',
    emoji: '👨‍⚕️',
    image: '/assets/avatars/doctor.png',
    greeting: `Hello! I'm your Doctor, AI avatar Created by Sir Ganguly.
I provide general health info and explain medical concepts clearly.
How can I help you with your wellness questions?`.trim()
  },

  'engineer': {
    name: 'Engineer',
    domain: 'Engineering & Design',
    emoji: '⚙️',
    image: '/assets/avatars/engineer.png',
    greeting: `Hello! I'm your Engineer, AI avatar Created by Sir Ganguly.
I solve mechanical, electrical, civil, and software engineering problems.
What engineering challenge can I assist you with?`.trim()
  },

  'lawyer': {
    name: 'Lawyer',
    domain: 'Legal & Law',
    emoji: '⚖️',
    image: '/assets/avatars/lawyer.png',
    greeting: `Hello! I'm your Lawyer, AI avatar Created by Sir Ganguly.
I explain legal concepts and general principles clearly.
What legal topic would you like to understand?`.trim()
  }
};

// ===== HELPER FUNCTIONS =====
export const getAvatarGreeting = (avatarType, avatarConfig) => {
  // Use the greeting from avatar config instead of trying to call functions
  if (avatarConfig && avatarConfig.greeting) {
    return avatarConfig.greeting;
  }
  
  // Fallback to default greeting if config is missing
  if (avatarType === 'hindi-teacher') {
    return `नमस्ते! मैं आपका हिंदी शिक्षक, AI अवतार, हूँ, जिसे सर गांगुली ने बनाया है। मैं हिंदी व्याकरण, साहित्य, और संस्कृति में आपकी मदद करूँगा। आपको किस बारे में जानना है?`;
  }
  
  return `Hello! I'm your AI teacher, created by Sir Ganguly. I'm ready to help you learn. What would you like to know?`;
};

export const getTextDisplayWelcome = (domain) => {
  return WELCOME_MESSAGES.TEXT_DISPLAY_WELCOME(domain);
};

// Export all constants for easy access
export default {
  WELCOME_MESSAGES,
  UI_TEXT,
  ERROR_MESSAGES,
  AVATAR_CONFIG,
  getAvatarGreeting,
  getTextDisplayWelcome
};
