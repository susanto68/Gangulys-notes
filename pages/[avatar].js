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
  const [isPaused, setIsPaused] = useState(false)
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
    setIsPaused(false)
    speakText(greeting, () => {
      setIsSpeaking(false)
      setIsPaused(false)
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

  // Test speech function for mobile debugging
  const testSpeech = () => {
    if (currentText) {
      console.log('🧪 Testing speech with text:', currentText.substring(0, 50) + '...')
      setIsSpeaking(true)
      setIsPaused(false)
      speakText(currentText.substring(0, 100), () => {
        console.log('✅ Test speech finished')
        setIsSpeaking(false)
        setIsPaused(false)
      }, { avatarType: avatar })
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

  // Handle speech recognition result - simplified like working example
  useEffect(() => {
    if (transcript && !isListening) {
      console.log('🎤 Speech recognized:', transcript)
      setCurrentText(transcript)
      setNoSpeechDetected(false)
      // Call API with transcript immediately
      handleApiCall(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript, handleApiCall])

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

  // API call function - simplified like the working example
  const handleApiCall = useCallback(async (prompt) => {
    if (!prompt || !avatarConfig) return
    
    setApiProcessing(true)
    setApiError(null)
    setShowError(false)
    
    try {
      console.log('🚀 Making API call to /api/chat with:', { prompt: prompt.substring(0, 50) + '...', avatarType: avatar, sessionId })
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          avatarType: avatar,
          sessionId
        })
      })

      console.log('📡 API Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 API Response data:', { 
        success: data.success, 
        hasPart1: !!data.part1, 
        hasPart2: !!data.part2,
        error: data.error
      })
      
      // Use the response text directly like the working example
      const responseText = data.part1 || data.reply || 'No response received'
      setCurrentText(responseText)
      setCodeContent(data.part2 || '')
      setRelatedArticles(data.relatedArticles || [])
      setRelatedVideos(data.relatedVideos || [])

      // Start speaking immediately like the working example
      if (responseText && responseText !== 'No response received') {
        console.log('🎤 Starting to speak answer:', responseText.substring(0, 100) + '...')
        stopSpeaking()
        setIsPaused(false)
        setTimeout(() => {
          setIsSpeaking(true)
          speakText(responseText, () => {
            console.log('✅ Finished speaking answer')
            setIsSpeaking(false)
            setIsPaused(false)
          }, { avatarType: avatar })
        }, 100) // Reduced delay for faster response
      }

    } catch (error) {
      console.error('❌ API call failed:', error)
      setApiError(error.message)
      setShowError(true)
      
      // Simple fallback message like the working example
      const fallbackMessage = `Sorry, I could not reach the server.`
      setCurrentText(fallbackMessage)
      
    } finally {
      setApiProcessing(false)
    }
  }, [avatarConfig, avatar, sessionId])

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

            {/* Control Buttons - All Side by Side Below Avatar */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-6 px-4">
              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  if (isSpeaking && !isPaused) {
                    // Pause speech
                    const success = pauseSpeaking()
                    if (success) {
                      setIsPaused(true)
                      console.log('🎤 Speech paused')
                    }
                  } else if (isPaused) {
                    // Resume speech
                    const success = resumeSpeaking()
                    if (success) {
                      setIsPaused(false)
                      console.log('🎤 Speech resumed')
                    }
                  }
                }}
                disabled={!currentText}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                  isSpeaking && !isPaused
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title={isSpeaking && !isPaused ? 'Pause speech' : 'Play speech'}
              >
                <span className="text-lg">{isSpeaking && !isPaused ? '⏸' : '▶️'}</span>
                <span className="font-bold">{isSpeaking && !isPaused ? 'PAUSE' : 'PLAY'}</span>
              </button>

              {/* Copy Answer Button */}
              <button
                onClick={handleCopyAnswer}
                disabled={!currentText}
                className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                title="Copy answer to clipboard"
              >
                <span className="text-lg">📋</span>
                <span className="font-bold">COPY</span>
              </button>

              {/* Talk Button - More Prominent */}
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening()
                  } else {
                    handleStartListening()
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl'
                }`}
                title={isListening ? 'Stop listening' : 'Click to ask a question'}
              >
                <span className="text-xl">🎤</span>
                <span className="font-bold">{isListening ? 'STOP' : 'ASK QUESTION'}</span>
              </button>
            </div>

            {/* User Instruction */}
            <div className="text-center mb-6">
              <p className="text-white text-base sm:text-lg font-bold">
                {isListening ? "🎤 LISTENING... SPEAK NOW!" : "🎯 TAP THE 🎤 BUTTON ABOVE TO ASK A QUESTION"}
              </p>
            </div>

            {/* Button Legend - Help Users Understand */}
            <div className="text-center mb-4">
              <div className="inline-flex flex-wrap justify-center gap-4 text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                  <span>PLAY: Resume speech</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span>PAUSE: Stop speech</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                  <span>COPY: Save answer</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></span>
                  <span>ASK: Voice question</span>
                </div>
              </div>
            </div>

            {/* Debug Info for Mobile */}
            <div className="text-center mb-4">
              <div className="inline-flex flex-wrap justify-center gap-2 text-xs text-white/50">
                <span>🎤 Speaking: {isSpeaking ? 'Yes' : 'No'}</span>
                <span>⏸ Paused: {isPaused ? 'Yes' : 'No'}</span>
                <span>📝 Text: {currentText ? 'Available' : 'None'}</span>
              </div>
            </div>

            {/* Test Speech Button for Mobile Debugging */}
            {currentText && (
              <div className="text-center mb-4">
                <button
                  onClick={testSpeech}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm transition-all duration-200"
                  title="Test speech synthesis on mobile"
                >
                  🧪 Test Speech
                </button>
              </div>
            )}

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
