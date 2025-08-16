import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { AVATAR_CONFIG } from '../lib/avatars'
import { initSynth, speakText, stopSpeaking } from '../lib/speech'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { usePWA } from '../hooks/usePWA'
import { generateContentSuggestions } from '../lib/contentSuggestions'
import AvatarDisplay from '../components/ChatInterface/AvatarDisplay'
import TextDisplay from '../components/ChatInterface/TextDisplay'
import CodeBox from '../components/ChatInterface/CodeBox'
import ArticleCarousel from '../components/ChatInterface/ArticleCarousel'
import YouTubeVideos from '../components/ChatInterface/YouTubeVideos'
import VoiceControls from '../components/VoiceControls/VoiceControls'
import BackButton from '../components/Navigation/BackButton'
import InstallPrompt from '../components/PWA/InstallPrompt'
import { ERROR_MESSAGES, UI_TEXT, getAvatarGreeting } from '../context/constant.js'
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary'
import TextDisplayFallback from '../components/ChatInterface/TextDisplayFallback'

export default function AvatarChat() {
  const router = useRouter()
  const { avatar } = router.query
  const [currentText, setCurrentText] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [noSpeechDetected, setNoSpeechDetected] = useState(false)
  const [timeoutError, setTimeoutError] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [relatedVideos, setRelatedVideos] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [visitorCount, setVisitorCount] = useState('Loading...')
  const greetingTimeoutRef = useRef(null)
  const speechTimeoutRef = useRef(null)
  const apiTimeoutRef = useRef(null)

  // PWA functionality
  const { isInstalled, isOnline, updateAvailable, updateApp, isPWASupported } = usePWA()

  // Cleanup function for timeouts
  const clearAllTimeouts = useCallback(() => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }
    if (apiTimeoutRef.current) {
      clearTimeout(apiTimeoutRef.current)
      apiTimeoutRef.current = null
    }
  }, [])

  // Initialize speech synthesis detection on component mount
  useEffect(() => {
    initSynth()
  }, [])

  // Detect mobile device and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate unique session ID for conversation context
  useEffect(() => {
    if (avatar && !sessionId) {
      const newSessionId = `${avatar}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      console.log('🆔 Generated new session ID:', newSessionId)
    }
  }, [avatar, sessionId])

  // Visitor counter effect
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      // Get or create visitor count from localStorage
      const getVisitorCount = () => {
        try {
          const stored = localStorage.getItem('visitorCount');
          if (stored) {
            return parseInt(stored);
          }
          return 0;
        } catch (error) {
          console.warn('localStorage not available:', error);
          return 0;
        }
      };

      // Get global visitor count (stored with timestamp for uniqueness)
      const getGlobalVisitorCount = () => {
        try {
          const globalData = localStorage.getItem('globalVisitorData');
          if (globalData) {
            const data = JSON.parse(globalData);
            return data.count || 0;
          }
          return 0;
        } catch (error) {
          console.warn('Global visitor data not available:', error);
          return 0;
        }
      };

      // Check if this is a new session
      const hasVisited = sessionStorage.getItem('hasVisited');
      
      if (!hasVisited) {
        // This is a new session, increment both local and global counts
        const currentCount = getVisitorCount() + 1;
        const globalCount = getGlobalVisitorCount() + 1;
        
        try {
          // Store local count
          localStorage.setItem('visitorCount', currentCount.toString());
          
          // Store global count with timestamp for uniqueness
          const globalData = {
            count: globalCount,
            lastUpdated: Date.now(),
            sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          localStorage.setItem('globalVisitorData', JSON.stringify(globalData));
          
          // Mark this session as visited
          sessionStorage.setItem('hasVisited', 'true');
        } catch (error) {
          console.warn('Storage not available:', error);
        }
        
        // Animate both counts
        let displayCount = 0;
        let displayGlobalCount = 0;
        const target = currentCount;
        const globalTarget = globalCount;
        
        const interval = setInterval(() => {
          displayCount += Math.ceil((target - displayCount) / 10);
          displayGlobalCount += Math.ceil((globalTarget - displayGlobalCount) / 10);
          
          if (displayCount >= target && displayGlobalCount >= globalTarget) {
            displayCount = target;
            displayGlobalCount = globalTarget;
            clearInterval(interval);
          }
          
          setVisitorCount(`🌍 Global: ${displayGlobalCount.toLocaleString()} | Local: ${displayCount.toLocaleString()}`);
        }, 50);
      } else {
        // Already visited this session, just display the counts
        const currentCount = getVisitorCount();
        const globalCount = getGlobalVisitorCount();
        setVisitorCount(`🌍 Global: ${globalCount.toLocaleString()} | Local: ${currentCount.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Visitor counter error:', error);
      setVisitorCount('🌍 Global: 1 | Local: 1');
    }
  }, []);

  // State for speech synthesis status
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { 
    startListening, 
    stopListening, 
    isListening, 
    transcript, 
    interimTranscript,
    resetTranscript,
    error: speechError,
    clearError: clearSpeechError,
    permissionStatus,
    checkPermission,
    isSupported: recognitionSupported
  } = useSpeechRecognition()

  // Get avatar configuration
  const avatarConfig = avatar ? AVATAR_CONFIG[avatar] : null

  // Real API call function with comprehensive error handling
  const handleApiCall = useCallback(async (message) => {
    // Frontend validation
    if (!message || typeof message !== 'string') {
      const errorMessage = ERROR_MESSAGES.API.INVALID_MESSAGE
      setCurrentText(errorMessage)
      setIsSpeaking(true)
      speakText(errorMessage, () => setIsSpeaking(false), { avatarType: avatar })
      return
    }

    if (message.trim().length === 0) {
      const errorMessage = ERROR_MESSAGES.API.INVALID_MESSAGE
      setCurrentText(errorMessage)
      setIsSpeaking(true)
      speakText(errorMessage, () => setIsSpeaking(false), { avatarType: avatar })
      return
    }

    if (!avatar || typeof avatar !== 'string') {
      const errorMessage = ERROR_MESSAGES.API.INVALID_MESSAGE
      setCurrentText(errorMessage)
      setIsSpeaking(true)
      speakText(errorMessage, () => setIsSpeaking(false), { avatarType: avatar })
      return
    }

    setIsProcessing(true)
    setApiError(null)
    setCodeContent('')
    setRelatedArticles([])
    setRelatedVideos([])
    setTimeoutError(false)
    
    // Stop any ongoing speech when starting new API call
    stopSpeaking()
    clearAllTimeouts()
    
    try {
      // Set API timeout (30 seconds)
      const apiTimeoutPromise = new Promise((_, reject) => {
        apiTimeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout. Please try again.'))
        }, 30000)
      })

      const requestBody = {
        prompt: message,
        avatarType: avatar,
        sessionId: sessionId // Include sessionId in the request body
      }
      
      console.log('🔗 Frontend: Making API request to /api/chat')
      console.log('🔗 Frontend: Request body:', requestBody)
      
      const fetchPromise = fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, apiTimeoutPromise])

      if (!response.ok) {
        let errorMessage = 'Server error occurred. Please try again.'
        
        // Try to get detailed error message from response
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          // If we can't parse the error response, use status-based messages
          if (response.status === 400) {
            errorMessage = ERROR_MESSAGES.API.INVALID_MESSAGE
          } else if (response.status === 404) {
            errorMessage = ERROR_MESSAGES.API.INVALID_MESSAGE
          } else if (response.status === 500) {
            errorMessage = ERROR_MESSAGES.API.API_ERROR
          } else if (response.status === 503) {
            errorMessage = ERROR_MESSAGES.API.API_ERROR
          }
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Handle the two-part response
      if (data.part1) {
        setCurrentText(data.part1)
        
        // Speak the response with a small delay to ensure UI updates first
        // speechTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(true)
          speakText(data.part1, () => {
            setIsSpeaking(false)
            console.log('Finished speaking API response')
          }, { avatarType: avatar })
        // }, 100)
      }

      if (data.part2) {
        setCodeContent(data.part2)
      }

      // Use API-generated related content if available, otherwise fall back to suggestions
      if (data.relatedArticles && data.relatedArticles.length > 0) {
        setRelatedArticles(data.relatedArticles)
      } else {
        // Generate fallback content suggestions based on the question and avatar type
        const suggestions = generateContentSuggestions(message, avatar)
        setRelatedArticles(suggestions.articles)
      }
      
      if (data.relatedVideos && data.relatedVideos.length > 0) {
        setRelatedVideos(data.relatedVideos)
      } else {
        // Generate fallback content suggestions based on the question and avatar type
        const suggestions = generateContentSuggestions(message, avatar)
        setRelatedVideos(suggestions.videos)
      }

    } catch (error) {
      console.error('API call error:', error)
      
      let userFriendlyMessage = ERROR_MESSAGES.API.API_ERROR
      
      if (error.message.includes('timeout')) {
        setTimeoutError(true)
        userFriendlyMessage = ERROR_MESSAGES.API.TIMEOUT
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userFriendlyMessage = ERROR_MESSAGES.API.NETWORK_ERROR
      } else if (error.message.includes('avatar')) {
        userFriendlyMessage = ERROR_MESSAGES.API.INVALID_MESSAGE
      } else if (error.message.includes('AI service') || error.message.includes('configuration')) {
        userFriendlyMessage = ERROR_MESSAGES.API.API_ERROR
      } else {
        setApiError(error.message)
      }
      
      setCurrentText(userFriendlyMessage)
      
      // Speak fallback response
      speechTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(true)
          speakText(userFriendlyMessage, () => {
          setIsSpeaking(false)
          console.log('Finished speaking fallback response')
          }, { avatarType: avatar })
      }, 100)
    } finally {
      setIsProcessing(false)
      clearAllTimeouts()
    }
  }, [avatar, sessionId, clearAllTimeouts, setIsProcessing, setApiError, setCodeContent, setRelatedArticles, setRelatedVideos, setTimeoutError, setIsSpeaking, setCurrentText])

  // Auto-greeting on page load
  const playAvatarGreeting = useCallback(() => {
    if (hasPlayedGreeting || !avatarConfig) return

    const greetingMessage = getAvatarGreeting(avatar, avatarConfig)
    
    // Set flag immediately to prevent multiple greetings
    setHasPlayedGreeting(true)
    
    setIsSpeaking(true)
    speakText(greetingMessage, () => {
      setIsSpeaking(false)
    }, { avatarType: avatar })
  }, [hasPlayedGreeting, avatarConfig, avatar, setHasPlayedGreeting])

  // Handle speech recognition result
  useEffect(() => {
    if (transcript && !isListening) {
      setCurrentText(transcript)
      setNoSpeechDetected(false) // Clear no speech error
      // Call API with transcript
      handleApiCall(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, handleApiCall, resetTranscript])

  // Handle interim transcript display
  useEffect(() => {
    if (isListening && interimTranscript) {
      setCurrentText(interimTranscript)
      setNoSpeechDetected(false) // Clear no speech error when speech is detected
    }
  }, [interimTranscript, isListening])

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      setShowError(true)
      
      // Handle specific speech recognition errors
      if (speechError.includes('no-speech') || speechError.includes('No speech detected')) {
        setNoSpeechDetected(true)
        const noSpeechMessage = ERROR_MESSAGES.SPEECH.NO_SPEECH
        setCurrentText(noSpeechMessage)
        setIsSpeaking(true)
        speakText(noSpeechMessage, () => setIsSpeaking(false), { avatarType: avatar })
      } else if (speechError.includes('not-allowed') || speechError.includes('permission')) {
        const permissionMessage = ERROR_MESSAGES.SPEECH.PERMISSION
        setCurrentText(permissionMessage)
        setIsSpeaking(true)
        speakText(permissionMessage, () => setIsSpeaking(false), { avatarType: avatar })
      } else if (speechError.includes('network') || speechError.includes('connection')) {
        const networkMessage = ERROR_MESSAGES.SPEECH.NETWORK
        setCurrentText(networkMessage)
        setIsSpeaking(true)
        speakText(networkMessage, () => setIsSpeaking(false), { avatarType: avatar })
      } else {
        const genericMessage = ERROR_MESSAGES.SPEECH.GENERIC
        setCurrentText(genericMessage)
        setIsSpeaking(true)
        speakText(genericMessage, () => setIsSpeaking(false), { avatarType: avatar })
      }
      
      // Auto-hide error after 8 seconds for speech errors
      const timer = setTimeout(() => {
        setShowError(false)
        clearSpeechError()
        setNoSpeechDetected(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [speechError, clearSpeechError, avatar])

  // Check permissions on component mount
  useEffect(() => {
    if (avatarConfig) {
      checkPermission()
    }
  }, [avatarConfig, checkPermission, avatar])

  // Initialize greeting
  useEffect(() => {
    if (avatarConfig) {
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
  }, [avatarConfig, playAvatarGreeting, clearAllTimeouts])

  // Handle back navigation
  const handleBack = useCallback(() => {
    // Stop any ongoing speech when navigating back
    stopSpeaking()
    clearAllTimeouts()
    router.push('/')
  }, [clearAllTimeouts, router])

  // Handle start listening with comprehensive error handling
  const handleStartListening = useCallback(async () => {
    // Stop any ongoing speech when starting to listen
    stopSpeaking()
    clearAllTimeouts()
    setNoSpeechDetected(false)
    setApiError(null)
    setTimeoutError(false)
    
    // Check if speech recognition is supported
    if (!recognitionSupported) {
      const unsupportedMessage = ERROR_MESSAGES.SPEECH.GENERIC
      setCurrentText(unsupportedMessage)
      setIsSpeaking(true)
      speakText(unsupportedMessage, () => setIsSpeaking(false), { avatarType: avatar })
      return
    }
    
    // Check permissions before starting
    if (permissionStatus === 'denied') {
      const permissionMessage = ERROR_MESSAGES.SPEECH.PERMISSION
      setCurrentText(permissionMessage)
      setIsSpeaking(true)
      speakText(permissionMessage, () => setIsSpeaking(false), { avatarType: avatar })
      return
    }
    
    const success = await startListening()
    if (!success) {
      setShowError(true)
      const errorMessage = ERROR_MESSAGES.SPEECH.GENERIC
      setCurrentText(errorMessage)
      setIsSpeaking(true)
      speakText(errorMessage, () => setIsSpeaking(false), { avatarType: avatar })
    }
  }, [clearAllTimeouts, setNoSpeechDetected, setApiError, setTimeoutError, recognitionSupported, permissionStatus, avatar, setCurrentText, setIsSpeaking, startListening, setShowError])

  // Handle stop listening
  const handleStopListening = useCallback(() => {
    stopListening()
    
    // Check if no speech was detected
    if (!transcript && !interimTranscript) {
      setNoSpeechDetected(true)
      const noSpeechMessage = ERROR_MESSAGES.SPEECH.NO_SPEECH
      setCurrentText(noSpeechMessage)
      setIsSpeaking(true)
      speakText(noSpeechMessage, () => setIsSpeaking(false), { avatarType: avatar })
    }
  }, [stopListening, transcript, interimTranscript, setNoSpeechDetected, setCurrentText, setIsSpeaking, avatar])

  // Handle stop speaking
  const handleStopSpeaking = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
    clearAllTimeouts()
  }, [setIsSpeaking, clearAllTimeouts])



  // Dismiss error
  const dismissError = useCallback(() => {
    setShowError(false)
    clearSpeechError()
    setApiError(null)
    setNoSpeechDetected(false)
    setTimeoutError(false)
  }, [setShowError, clearSpeechError, setApiError, setNoSpeechDetected, setTimeoutError])

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
            {UI_TEXT.BUTTONS.BACK}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden break-words overflow-wrap-anywhere">
      {/* Global Visitor Counter */}
      <div id="visitor-counter" style={{
        position: 'fixed',
        top: '15px',
        left: '15px',
        fontSize: '16px',
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
        animation: 'floatCounter 2s infinite alternate',
        maxWidth: '300px',
        minWidth: '280px',
        textAlign: 'center',
        lineHeight: '1.2'
      }}>
        <span>🌸</span>
        <span id="visitor-count-number" style={{ fontSize: '14px' }}>{visitorCount}</span>
      </div>

      <Head>
        <title>{avatarConfig.name} - AI Avatar Assistant</title>
        <meta name="description" content={`Chat with ${avatarConfig.name} about ${avatarConfig.domain}`} />
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

      {/* PWA Install Prompt */}
      <InstallPrompt 
        avatarConfig={avatarConfig} 
        isSpeaking={isSpeaking} 
        setIsSpeaking={setIsSpeaking} 
      />

      {/* Floating Back Button */}
      <BackButton onClick={handleBack} />

      {/* Main scrollable content */}
      <div className="container mx-auto px-4 pb-32 flex flex-col min-h-screen break-words overflow-wrap-anywhere overflow-x-hidden">
        {/* Header with Avatar Info */}
        <div className="flex items-center justify-center mb-6 pt-6">
          <div className="text-center text-white">
            <h1 className="text-xl md:text-2xl font-semibold mb-2">{avatarConfig.name}</h1>
            <p className="text-sm md:text-base opacity-70">{avatarConfig.domain}</p>
          </div>
        </div>

        {/* Error Banner */}
        {(showError && speechError) || apiError || noSpeechDetected || timeoutError ? (
          <div className="mb-6 bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-red-100 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span className="font-medium text-sm md:text-base">
                  {noSpeechDetected ? UI_TEXT.STATUS.NO_SPEECH : 
                   timeoutError ? "Request timeout" :
                   apiError || speechError}
                </span>
              </div>
              <button
                onClick={dismissError}
                className="text-red-300 hover:text-red-100 transition-colors p-1 hover:bg-red-500/20 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ) : null}

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 text-yellow-100 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="font-medium text-sm md:text-base">
                {ERROR_MESSAGES.SPEECH.PERMISSION}
              </span>
            </div>
          </div>
        )}

        {/* Browser Support Warning */}
        {!recognitionSupported && (
          <div className="mb-6 bg-orange-500/20 border border-orange-400/30 rounded-xl p-4 text-orange-100 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="font-medium text-sm md:text-base">
                {ERROR_MESSAGES.SPEECH.GENERIC}
              </span>
            </div>
          </div>
        )}

        {/* Avatar Display */}
        <div className="mb-8 flex justify-center">
          <div className="transform transition-all duration-300 hover:scale-105">
            <AvatarDisplay 
              avatar={avatar} 
              config={avatarConfig} 
              isSpeaking={isSpeaking}
            />
          </div>
        </div>

        {/* Content Area - Flex container for text and code */}
        <div className="flex flex-col flex-1 space-y-6 break-words overflow-wrap-anywhere">
          {/* Text Display */}
          <div className="flex-1 break-words overflow-wrap-anywhere">
            <ErrorBoundary fallback={<TextDisplayFallback text={currentText} />}>
              <TextDisplay 
                text={currentText}
                isProcessing={isProcessing}
                avatarConfig={avatarConfig}
                isListening={isListening}
                interimTranscript={interimTranscript}
                noSpeechDetected={noSpeechDetected}
              />
            </ErrorBoundary>
          </div>

          {/* Code Box - Only render if codeContent exists */}
          {codeContent && codeContent.trim() !== '' && (
            <div className="animate-fadeIn break-words overflow-wrap-anywhere">
              <CodeBox code={codeContent} />
            </div>
          )}
        </div>

        {/* Content Suggestions */}
        {relatedArticles.length > 0 && (
          <div className="mt-8 animate-fadeIn">
            <ArticleCarousel articles={relatedArticles} />
          </div>
        )}
        
        {relatedVideos.length > 0 && (
          <div className="mt-6 animate-fadeIn">
            <YouTubeVideos videos={relatedVideos} />
          </div>
        )}

        {/* Status Indicators */}
        <div className="text-center mb-6 mt-8">
          {/* PWA Status Indicators */}
          {isPWASupported && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {isInstalled && (
                <div className="inline-flex items-center gap-2 bg-green-500/30 text-green-100 px-3 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md border border-green-400/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                  </svg>
                  <span>App Installed</span>
                </div>
              )}
              
              {!isOnline && (
                <div className="inline-flex items-center gap-2 bg-yellow-500/30 text-yellow-100 px-3 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md border border-yellow-400/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="M21 12h-6m-6 0H3"/>
                  </svg>
                  <span>Offline Mode</span>
                </div>
              )}
              
              {updateAvailable && (
                <button
                  onClick={updateApp}
                  className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-100 px-3 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md border border-blue-400/30 hover:bg-blue-500/50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Update Available</span>
                </button>
              )}
            </div>
          )}

          {isListening && (
            <div className="inline-flex items-center gap-3 bg-green-500/30 text-green-100 px-4 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold animate-pulse shadow-lg backdrop-blur-md border border-green-400/30">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-green-300 rounded-full animate-ping"></div>
              <svg width="18" height="18" className="md:w-5 md:h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span className="font-bold">{UI_TEXT.STATUS.LISTENING}</span>
            </div>
          )}
          
          {isSpeaking && (
            <div className="inline-flex items-center gap-3 bg-blue-500/30 text-blue-100 px-4 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold animate-pulse shadow-lg backdrop-blur-md border border-blue-400/30">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-300 rounded-full animate-ping"></div>
              <svg width="18" height="18" className="md:w-5 md:h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <span className="font-bold">{UI_TEXT.STATUS.SPEAKING}</span>
            </div>
          )}
          
          {isProcessing && (
            <div className="inline-flex items-center gap-3 bg-purple-500/30 text-purple-100 px-4 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold animate-pulse shadow-lg backdrop-blur-md border border-purple-400/30">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-300 rounded-full animate-ping"></div>
              <svg width="18" height="18" className="md:w-5 md:h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <span className="font-bold">{UI_TEXT.STATUS.PROCESSING}</span>
            </div>
          )}
          
          {permissionStatus === 'denied' && (
            <div className="inline-flex items-center gap-3 bg-red-500/30 text-red-100 px-4 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold shadow-lg backdrop-blur-md border border-red-400/30">
              <svg width="18" height="18" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span className="font-bold">🚫 {UI_TEXT.STATUS.PERMISSION_DENIED}</span>
            </div>
          )}

          {noSpeechDetected && (
            <div className="inline-flex items-center gap-3 bg-orange-500/30 text-orange-100 px-4 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold shadow-lg backdrop-blur-md border border-orange-400/30">
              <svg width="18" height="18" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span className="font-bold">🔇 {UI_TEXT.STATUS.NO_SPEECH}</span>
            </div>
          )}

          {timeoutError && (
            <div className="inline-flex items-center gap-3 bg-yellow-500/30 text-yellow-100 px-4 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold shadow-lg backdrop-blur-md border border-yellow-400/30">
              <svg width="18" height="18" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span className="font-bold">⏰ {UI_TEXT.STATUS.TIMEOUT}</span>
            </div>
          )}
          
          {!isListening && !isSpeaking && !isProcessing && permissionStatus !== 'denied' && !noSpeechDetected && !timeoutError && (
            <div className="text-center">
              <p className="text-white/70 text-sm md:text-base mb-2 font-medium">
                🎤 {UI_TEXT.STATUS.WELCOME_MESSAGE}
              </p>
            </div>
          )}
        </div>
      </div>



      {/* Fixed Talk Button at Bottom Center */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        {isListening ? (
          <button
            onClick={handleStopListening}
            className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse backdrop-blur-md border border-red-400/30"
          >
            <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            <span className="hidden md:inline">{UI_TEXT.BUTTONS.STOP}</span>
            <span className="md:hidden">Stop</span>
          </button>
        ) : isSpeaking ? (
          <button
            onClick={handleStopSpeaking}
            className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse backdrop-blur-md border border-orange-400/30"
          >
            <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            <span className="hidden md:inline">{UI_TEXT.BUTTONS.STOP}</span>
            <span className="md:hidden">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleStartListening}
            disabled={isProcessing || permissionStatus === 'denied' || !recognitionSupported}
            className={`flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full shadow-2xl transform transition-all duration-200 backdrop-blur-md border ${
              isProcessing || permissionStatus === 'denied' || !recognitionSupported
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50 border-gray-400/30' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 active:scale-95 border-blue-400/30'
            }`}
          >
            <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span className="hidden md:inline">
              {permissionStatus === 'denied' ? 'Permission Required' : 
               !recognitionSupported ? 'Not Supported' : UI_TEXT.BUTTONS.TALK}
            </span>
            <span className="md:hidden">
              {permissionStatus === 'denied' ? 'Permission' : 
               !recognitionSupported ? 'Not Supported' : 'Talk'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
