import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AvatarGrid from '../components/AvatarSelection/AvatarGrid'
import LoadingScreen from '../components/AvatarSelection/LoadingScreen'
import { AVATAR_CONFIG } from '../lib/avatars'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { WELCOME_MESSAGES, UI_TEXT } from '../context/constant.js'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)
  const [visitorCount, setVisitorCount] = useState('Loading...')
  const welcomeTimeoutRef = useRef(null)

  const { speakText, isSpeaking } = useSpeechSynthesis()

  // Auto-greeting audio on load
  const playWelcomeGreeting = useCallback(() => {
    if (hasPlayedWelcome) return

    const welcomeMessage = WELCOME_MESSAGES.MAIN_PAGE

    try {
      speakText(welcomeMessage, "en", "welcome", () => {
        setHasPlayedWelcome(true)
        console.log('✅ Welcome message completed')
      })
      console.log('🎤 Welcome message started')
    } catch (error) {
      console.warn('⚠️ Welcome message failed:', error)
      // Mark as played even on error to prevent retries
      setHasPlayedWelcome(true)
    }
  }, [hasPlayedWelcome, speakText])

  // Handle avatar selection
  const handleAvatarSelect = (avatarType) => {
    router.push(`/${avatarType}`)
  }

  // Initialize app
  useEffect(() => {
    const initApp = () => {
      // Simulate loading time for smooth experience
      setTimeout(() => {
        setIsLoading(false)

        // Play welcome greeting after loading
        welcomeTimeoutRef.current = setTimeout(() => {
          playWelcomeGreeting()
        }, 500)
      }, 1000)
    }

    initApp()

    // Cleanup timeout on unmount
    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current)
      }
    }
  }, [playWelcomeGreeting]) // Dependency array updated

  // Visitor counter effect
  useEffect(() => {
    fetch('https://api.countapi.xyz/hit/ai-avatar-vercel.vercel.app/visits')
      .then(res => res.json())
      .then(data => {
        let value = 0;
        const target = data.value;

        // Smooth increment animation
        const interval = setInterval(() => {
          value += Math.ceil((target - value) / 10);
          if(value >= target) {
            value = target;
            clearInterval(interval);
          }
          setVisitorCount(`Visitors: ${value}`);
        }, 50);
      })
      .catch(err => {
        console.error("Visitor counter error:", err);
        setVisitorCount("Visitors: Unable to load");
      });
  }, []);

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Global Visitor Counter */}
      <div id="visitor-counter" style={{
        position: 'fixed',
        top: '15px',
        left: '15px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ff6600',
        background: 'linear-gradient(90deg, #fff8e1, #ffecb3)',
        padding: '12px 18px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        fontFamily: "'Poppins', sans-serif",
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'floatCounter 2s infinite alternate'
      }}>
        <span>🌸</span>
        <span id="visitor-count-number">{visitorCount}</span>
      </div>

      <Head>
        <title>Avatar AI Assistant - Choose Your AI Teacher</title>
        <meta name="description" content="Interactive AI Avatar Assistant Created by Sir Ganguly. Choose from various AI teachers for personalized learning experiences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Avatar AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/assets/icons/icon-152x152.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {UI_TEXT.TITLES.MAIN_PAGE}
          </h1>
          <p className="text-xl text-white/80 mb-2">
            {UI_TEXT.TITLES.SUBTITLE}
          </p>
          <p className="text-sm text-white/60">
            {UI_TEXT.TITLES.CREATOR}
          </p>
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm animate-pulse">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
              {UI_TEXT.STATUS.WELCOME_PLAYING}
            </div>
          </div>
        )}

        {/* Welcome status */}
        {hasPlayedWelcome && !isSpeaking && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              {UI_TEXT.STATUS.WELCOME_COMPLETED}
            </div>
          </div>
        )}

        {/* Avatar Grid */}
        <AvatarGrid 
          avatars={AVATAR_CONFIG} 
          onAvatarSelect={handleAvatarSelect}
        />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            {UI_TEXT.TITLES.FOOTER}
          </p>
        </div>
      </div>
    </div>
  )
}