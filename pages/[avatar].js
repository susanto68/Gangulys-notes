import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { AVATAR_CONFIG } from '../lib/avatars'
import { initSynth, speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../lib/speech'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { usePWA } from '../hooks/usePWA'
import { generateContentSuggestions } from '../lib/contentSuggestions'
import AvatarDisplay from '../components/ChatInterface/AvatarDisplay'
import TextDisplay from '../components/ChatInterface/TextDisplay'
import CodeBox from '../components/ChatInterface/CodeBox'
import ArticleCarousel from '../components/ChatInterface/ArticleCarousel'
import YouTubeVideos from '../components/ChatInterface/YouTubeVideos'
import VoiceFallback from '../components/VoiceControls/VoiceFallback'
import BackButton from '../components/Navigation/BackButton'
import InstallPrompt from '../components/PWA/InstallPrompt'
import { ERROR_MESSAGES, UI_TEXT, getAvatarGreeting } from '../context/constant.js'
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary'
import TextDisplayFallback from '../components/ChatInterface/TextDisplayFallback'

export default function AvatarChat() {
  const router = useRouter()
  const { avatar } = router.query
  
  // PWA Hook
  const { isPWASupported, isInstalled, updateAvailable, updateApp, isOnline } = usePWA()
  
  // Speech Recognition Hook
  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    resetTranscript,
    error: speechError,
    clearError: clearSpeechError,
    permissionStatus,
    checkPermission,
    isSupported: recognitionSupported
  } = useSpeechRecognition()

  // State variables
  const [currentText, setCurrentText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setApiProcessing] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [codeContent, setCodeContent] = useState('')
  const [relatedArticles, setRelatedArticles] = useState([])
  const [relatedVideos, setRelatedVideos] = useState([])
  const [showError, setShowError] = useState(false)
  const [noSpeechDetected, setNoSpeechDetected] = useState(false)
  const [timeoutError, setTimeoutError] = useState(false)
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false)
  const [sessionId] = useState(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Refs
  const greetingTimeoutRef = useRef(null)
  const allTimeoutsRef = useRef([])

  // Get avatar configuration
  const avatarConfig = AVATAR_CONFIG[avatar] || null

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    allTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId))
    allTimeoutsRef.current = []
  }, [])

  // Add timeout to tracking
  const addTimeout = useCallback((timeoutId) => {
    allTimeoutsRef.current.push(timeoutId)
  }, [])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initSynth()
    }
  }, [])

  // Play avatar greeting
  const playAvatarGreeting = useCallback(() => {
    if (!avatarConfig || hasPlayedGreeting) return
    
    const greeting = getAvatarGreeting(avatarConfig.name, avatarConfig.domain)
    console.log('🎤 Playing avatar greeting:', greeting)
    
    setIsSpeaking(true)
    speakText(greeting, () => {
      setIsSpeaking(false)
      setHasPlayedGreeting(true)
    }, { avatarType: avatar })
  }, [avatarConfig, hasPlayedGreeting, avatar])

  // Initialize greeting
  useEffect(() => {
    if (avatarConfig && !hasPlayedGreeting) {
      greetingTimeoutRef.current = setTimeout(() => {
        playAvatarGreeting()
      }, 1000)
    }

    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current)
      }
      clearAllTimeouts()
    }
  }, [avatarConfig, hasPlayedGreeting, playAvatarGreeting, clearAllTimeouts])

  // Handle back navigation
  const handleBack = useCallback(() => {
    stopSpeaking()
    clearAllTimeouts()
    router.push('/')
  }, [clearAllTimeouts, router])

  // Handle copy to clipboard
  const handleCopyAnswer = async () => {
    if (!currentText || currentText.trim() === '') {
      alert('No text to copy')
      return
    }

    try {
      await navigator.clipboard.writeText(currentText)
      alert('✅ Answer copied to clipboard!')
    } catch (error) {
      console.error('Copy failed:', error)
      alert('❌ Copy failed')
    }
  }

  // Handle start listening
  const handleStartListening = async () => {
    try {
      setNoSpeechDetected(false)
      setShowError(false)
      await startListening()
    } catch (error) {
      console.error('Failed to start listening:', error)
      setShowError(true)
    }
  }

  // Handle speech recognition result
  useEffect(() => {
    if (transcript && !isListening) {
      setCurrentText(transcript)
      setNoSpeechDetected(false)
      // Call API with transcript
      handleApiCall(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript])

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      setShowError(true)
      setNoSpeechDetected(true)
      
      const timer = setTimeout(() => {
        setShowError(false)
        clearSpeechError()
        setNoSpeechDetected(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [speechError, clearSpeechError])

  // API call function
  const handleApiCall = async (prompt) => {
    if (!prompt || !avatarConfig) return
    
    setApiProcessing(true)
    setApiError(null)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          avatarType: avatar,
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

             // Update state with response (API returns part1 and part2)
       const responseText = data.part1 || data.response || 'No response received'
       setCurrentText(responseText)
       setCodeContent(data.part2 || data.codeContent || '')
       setRelatedArticles(data.relatedArticles || [])
       setRelatedVideos(data.relatedVideos || [])

       // Start speaking the response
       if (responseText && responseText !== 'No response received') {
         console.log('🎤 Starting to speak answer:', responseText.substring(0, 100) + '...')
         stopSpeaking()
         setTimeout(() => {
           setIsSpeaking(true)
           speakText(responseText, () => {
             console.log('✅ Finished speaking answer')
             setIsSpeaking(false)
           }, { avatarType: avatar })
         }, 100)
       }

    } catch (error) {
      console.error('API call failed:', error)
      setApiError(error.message)
      setShowError(true)
    } finally {
      setApiProcessing(false)
    }
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      clearAllTimeouts()
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current)
      }
    }
  }, [clearAllTimeouts])

  // Show loading if avatar not found
  if (!avatar || !avatarConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md mx-auto">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg mb-2 font-medium">Loading avatar...</p>
          <p className="text-sm opacity-70 mb-4">If this takes too long, please go back and try again.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-md border border-white/20 hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{avatarConfig.name} - AI Avatar Assistant</title>
        <meta name="description" content={`Chat with ${avatarConfig.name} about ${avatarConfig.domain}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <VoiceFallback onVoiceSupportChange={(supported) => console.log('Voice support:', supported)}>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
          {/* Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-md border border-white/20 hover:scale-105"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="font-bold">BACK</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 pb-32 flex flex-col min-h-screen">
            {/* Header */}
            <div className="text-center text-white pt-20 mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{avatarConfig.name}</h1>
              <p className="text-lg opacity-80">{avatarConfig.domain}</p>
            </div>

            {/* Avatar Display */}
            <div className="flex justify-center mb-8">
              <div className="transform transition-all duration-300 hover:scale-105">
                <AvatarDisplay 
                  avatar={avatar} 
                  config={avatarConfig} 
                  isSpeaking={isSpeaking}
                />
              </div>
            </div>

            {/* User Message */}
            <div className="text-center mb-6">
              <p className="text-white/80 text-lg font-medium">
                Tap the button below to ask a question
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-8">
              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    const success = pauseSpeaking()
                    if (success) setIsSpeaking(false)
                  } else {
                    const success = resumeSpeaking()
                    if (success) setIsSpeaking(true)
                  }
                }}
                className={`flex-1 max-w-xs flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg shadow-lg border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-xl opacity-90 ${
                  isSpeaking 
                    ? 'bg-blue-500 hover:bg-blue-600 border-blue-400/30 text-white' 
                    : 'bg-blue-400 hover:bg-blue-500 border-blue-300/30 text-white'
                }`}
                title={isSpeaking ? 'Pause speech' : 'Play speech'}
              >
                <span className="text-2xl">
                  {isSpeaking ? '⏸' : '▶'}
                </span>
                <span className="hidden sm:inline">
                  {isSpeaking ? 'Pause' : 'Play'}
                </span>
              </button>

              {/* Copy Answer Button */}
              <button
                onClick={handleCopyAnswer}
                className="flex-1 max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-lg border-2 border-blue-400/30 transition-all duration-200 transform hover:scale-105 hover:shadow-xl opacity-90"
                title="Copy answer to clipboard"
              >
                <span className="text-2xl">📋</span>
                <span className="hidden sm:inline">Copy</span>
              </button>

              {/* Talk Button */}
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening()
                  } else {
                    handleStartListening()
                  }
                }}
                className={`flex-1 max-w-xs flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg shadow-lg border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-xl opacity-90 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 border-red-400/30 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 border-blue-400/30 text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Start talking'}
              >
                <span className="text-2xl">🎤</span>
                <span className="hidden sm:inline">
                  {isListening ? 'Stop' : 'Talk'}
                </span>
              </button>
            </div>

            {/* Status Messages */}
            <div className="text-center mb-6">
              {isListening && (
                <div className="inline-flex items-center gap-3 bg-green-500/30 text-green-100 px-6 py-3 rounded-full text-base font-semibold animate-pulse shadow-lg backdrop-blur-md border border-green-400/30">
                  <div className="w-4 h-4 bg-green-300 rounded-full animate-ping"></div>
                  <span>🎤 Listening... Speak now!</span>
                </div>
              )}
              
              {isSpeaking && (
                <div className="inline-flex items-center gap-3 bg-blue-500/30 text-blue-100 px-6 py-3 rounded-full text-base font-semibold animate-pulse shadow-lg backdrop-blur-md border border-blue-400/30">
                  <div className="w-4 h-4 bg-blue-300 rounded-full animate-ping"></div>
                  <span>🔊 Speaking...</span>
                </div>
              )}
              
              {isProcessing && (
                <div className="inline-flex items-center gap-3 bg-purple-500/30 text-purple-100 px-6 py-3 rounded-full text-base font-semibold animate-pulse shadow-lg backdrop-blur-md border border-purple-400/30">
                  <div className="w-4 h-4 bg-purple-300 rounded-full animate-spin"></div>
                  <span>🤔 Processing your question...</span>
                </div>
              )}

              {showError && (
                <div className="inline-flex items-center gap-3 bg-red-500/30 text-red-100 px-6 py-3 rounded-full text-base font-semibold shadow-lg backdrop-blur-md border border-red-400/30">
                  <span>❌ {apiError || speechError || 'An error occurred'}</span>
                </div>
              )}
            </div>

            {/* Content Display */}
            <div className="flex-1 space-y-6">
              {/* Text Display */}
              {currentText && (
                <div className="break-words overflow-wrap-anywhere">
                  <ErrorBoundary fallback={<TextDisplayFallback text={currentText} />}>
                    <TextDisplay 
                      text={currentText}
                      isProcessing={isProcessing}
                      avatarConfig={avatarConfig}
                      isListening={isListening}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {/* Code Box */}
              {codeContent && (
                <div className="animate-fadeIn">
                  <CodeBox code={codeContent} />
                </div>
              )}

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="animate-fadeIn">
                  <ArticleCarousel articles={relatedArticles} />
                </div>
              )}
              
              {/* Related Videos */}
              {relatedVideos.length > 0 && (
                <div className="animate-fadeIn">
                  <YouTubeVideos videos={relatedVideos} />
                </div>
              )}
            </div>
          </div>
        </div>
      </VoiceFallback>
    </>
  )
}
