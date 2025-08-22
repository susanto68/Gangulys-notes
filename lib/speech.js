// Enhanced Speech synthesis detection and TTS functionality with pause/resume support
// This module provides one-time detection of browser speech synthesis support
// and a unified speakText function with advanced controls

// Module-scoped variables for speech state management
let synthesizerSupported = false
let detectionComplete = false
let currentAudioElement = null // Track current audio element for Gemini TTS
let voicesLoaded = false
let isSpeaking = false // Track current speaking state
let isPaused = false // Track pause state
let currentUtterance = null // Track current utterance for pause/resume
let currentText = '' // Track current text being spoken
let currentOptions = {} // Track current speech options
let onCompleteCallback = null // Track completion callback

/**
 * Initialize speech synthesis detection
 * This function should be called once when the app loads
 * It checks if the browser supports speech synthesis and has voices available
 */
export function initSynth() {
  // Prevent multiple initializations
  if (detectionComplete) {
    console.log('🎤 Speech synthesis detection already completed')
    return
  }

  console.log('🔍 Initializing speech synthesis detection...')

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('❌ Speech synthesis not available (SSR environment)')
    synthesizerSupported = false
    detectionComplete = true
    return
  }

  // Check if speechSynthesis API exists
  if (!('speechSynthesis' in window)) {
    console.log('❌ Speech synthesis not supported in this browser')
    synthesizerSupported = false
    detectionComplete = true
    return
  }

  // Check if SpeechSynthesisUtterance exists
  if (!('SpeechSynthesisUtterance' in window)) {
    console.log('❌ SpeechSynthesisUtterance not supported in this browser')
    synthesizerSupported = false
    detectionComplete = true
    return
  }

  // Try to get voices immediately
  try {
    const voices = window.speechSynthesis.getVoices()
    
    if (voices && voices.length > 0) {
      console.log(`✅ Speech synthesis supported with ${voices.length} voices available`)
      synthesizerSupported = true
      voicesLoaded = true
      detectionComplete = true
    } else {
      // Voices might not be loaded yet, attach a one-time listener
      console.log('⏳ Voices not loaded yet, waiting for voiceschanged event...')
      
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices && voices.length > 0) {
          console.log(`✅ Speech synthesis supported with ${voices.length} voices available`)
          synthesizerSupported = true
          voicesLoaded = true
        } else {
          console.log('❌ No voices available for speech synthesis')
          synthesizerSupported = false
        }
        
        detectionComplete = true
        // Remove the listener after it fires
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { passive: true })
      
      // Set a timeout in case the event never fires
      setTimeout(() => {
        if (!detectionComplete) {
          console.log('⏰ Timeout waiting for voices, assuming speech synthesis not available')
          synthesizerSupported = false
          detectionComplete = true
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        }
      }, 5000) // 5 second timeout
    }
  } catch (error) {
    console.error('❌ Error during speech synthesis detection:', error)
    synthesizerSupported = false
    detectionComplete = true
  }
}

/**
 * Force re-initialization of speech synthesis (useful for troubleshooting)
 */
export function reinitSynth() {
  console.log('🔄 Re-initializing speech synthesis...')
  detectionComplete = false
  synthesizerSupported = false
  voicesLoaded = false
  initSynth()
}

/**
 * Get current speaking state
 * @returns {Object} - Complete speech state information
 */
export function getSpeakingState() {
  return {
    isSpeaking,
    isPaused,
    hasCurrentText: !!currentText,
    canPause: isSpeaking && !isPaused,
    canResume: isPaused,
    canStop: isSpeaking || isPaused
  }
}

/**
 * Pause current speech synthesis
 * @returns {boolean} - True if paused successfully, false otherwise
 */
export function pauseSpeaking() {
  if (!isSpeaking || isPaused) {
    console.log('⚠️ Cannot pause: not speaking or already paused')
    return false
  }

  try {
    if (synthesizerSupported && window.speechSynthesis) {
      if (window.speechSynthesis.pause) {
        window.speechSynthesis.pause()
        isPaused = true
        console.log('⏸️ Speech synthesis paused successfully')
        return true
      } else {
        console.log('⚠️ Pause not supported in this browser')
        return false
      }
    } else if (currentAudioElement) {
      currentAudioElement.pause()
      isPaused = true
      console.log('⏸️ Gemini TTS audio paused successfully')
      return true
    }
  } catch (error) {
    console.error('❌ Error pausing speech:', error)
    return false
  }

  return false
}

/**
 * Resume paused speech synthesis
 * @returns {boolean} - True if resumed successfully, false otherwise
 */
export function resumeSpeaking() {
  if (!isPaused) {
    console.log('⚠️ Cannot resume: not paused')
    return false
  }

  try {
    if (synthesizerSupported && window.speechSynthesis) {
      if (window.speechSynthesis.resume) {
        window.speechSynthesis.resume()
        isPaused = false
        console.log('▶️ Speech synthesis resumed successfully')
        return true
      } else {
        console.log('⚠️ Resume not supported in this browser')
        return false
      }
    } else if (currentAudioElement) {
      currentAudioElement.play()
      isPaused = false
      console.log('▶️ Gemini TTS audio resumed successfully')
      return true
    }
  } catch (error) {
    console.error('❌ Error resuming speech:', error)
    return false
  }

  return false
}

/**
 * Clean text for speech synthesis by removing or replacing special characters
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text suitable for speech synthesis
 */
function cleanTextForSpeech(text) {
  if (!text || typeof text !== 'string') return text
  
  // Remove markdown and special characters that can cause speech issues
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/[#*_~]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ') // Replace multiple newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
}

/**
 * Select appropriate voice based on language and avatar type
 * @param {Array} voices - Available voices
 * @param {string} lang - Language code
 * @param {string} avatarType - Avatar type for context
 * @returns {SpeechSynthesisVoice} - Selected voice
 */
function selectVoice(voices, lang, avatarType) {
  if (!voices || voices.length === 0) {
    console.warn('⚠️ No voices available for selection')
    return null
  }

  let selectedVoice = null

  // For Hindi teacher, prioritize Hindi voices
  if (avatarType === 'hindi-teacher' || lang === 'hi-IN') {
    selectedVoice = voices.find(v => 
      v.lang === 'hi-IN'
    ) || voices.find(v => 
      v.lang.startsWith('hi')
    )
    
    if (selectedVoice) {
      console.log('🎤 Selected Hindi voice:', selectedVoice.name, selectedVoice.lang)
    }
  } else {
    // English deep male voice preference
    selectedVoice = voices.find(v => 
      v.name.includes("Google UK English Male")
    ) || voices.find(v => 
      v.name.includes("en-GB-Standard-B")
    ) || voices.find(v => 
      v.lang === "en-GB" && v.name.toLowerCase().includes("male")
    ) || voices.find(v => 
      v.lang === "en-GB"
    ) || voices.find(v => 
      v.lang.startsWith("en") && v.name.toLowerCase().includes("male")
    )
    
    if (selectedVoice) {
      console.log('🎤 Selected English voice:', selectedVoice.name, selectedVoice.lang)
    }
  }

  // Fallback to first available voice if no preferred voice found
  if (!selectedVoice) {
    selectedVoice = voices[0]
    console.log('🎤 Using fallback voice:', selectedVoice.name, selectedVoice.lang)
  }

  return selectedVoice
}

// Chrome-specific compatibility fixes
const isChrome = () => {
  return /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)
}

// Chrome requires user interaction for speech synthesis
const ensureChromeCompatibility = () => {
  if (isChrome()) {
    // Chrome needs user interaction before allowing speech
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      console.log('🔧 Chrome detected - ensuring speech synthesis compatibility')
      // Try to initialize speech synthesis
      try {
        window.speechSynthesis.getVoices()
      } catch (e) {
        console.log('⚠️ Chrome speech synthesis initialization issue:', e)
      }
    }
  }
}

// Enhanced voice selection for Chrome
const selectVoiceForChrome = (voices, lang, avatarType) => {
  if (!isChrome()) {
    return selectVoice(voices, lang, avatarType)
  }
  
  // Chrome-specific voice selection
  let selectedVoice = null
  
  // For Hindi teacher, prioritize Hindi voices
  if (avatarType === 'hindi-teacher' || lang === 'hi-IN') {
    selectedVoice = voices.find(v => v.lang === 'hi-IN') || 
                   voices.find(v => v.lang.startsWith('hi')) ||
                   voices.find(v => v.name.includes('Hindi'))
  }
  
  // For other avatars, prioritize English voices
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang === 'en-US') ||
                   voices.find(v => v.lang.startsWith('en')) ||
                   voices.find(v => v.name.includes('US') || v.name.includes('English'))
  }
  
  // Fallback to any available voice
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0]
  }
  
  return selectedVoice
}

/**
 * Unified speakText function with enhanced controls
 * @param {string} text - The text to speak
 * @param {Function} onComplete - Optional callback when speaking is complete
 * @param {Object} options - Options including lang and avatarType
 */
export async function speakText(text, onComplete, options = {}) {
  const { lang = 'en-US', avatarType = 'computer-teacher' } = options
  
  console.log('🎤 speakText called with:', { text: text?.substring(0, 100) + '...', lang, avatarType })
  
  if (!text || typeof text !== 'string') {
    console.error('❌ Invalid text for speech synthesis:', text)
    if (onComplete) onComplete()
    return
  }
  
  // Clean text for better speech synthesis
  const cleanText = cleanTextForSpeech(text)
  if (!cleanText) {
    console.log('⚠️ No clean text remaining after cleaning')
    if (onComplete) onComplete()
    return
  }
  
  console.log('🎤 Clean text for speech:', cleanText.substring(0, 100) + '...')
  
  // Store current speech context for pause/resume
  currentText = cleanText
  currentOptions = { lang, avatarType }
  onCompleteCallback = onComplete
  
  // Ensure Chrome compatibility
  ensureChromeCompatibility()
  
  console.log('🎤 Speech synthesis status:', { synthesizerSupported, voicesLoaded, detectionComplete })
  
  if (synthesizerSupported && voicesLoaded) {
    try {
      const voices = window.speechSynthesis.getVoices()
      console.log('🎤 Available voices:', voices?.length || 0)
      
      if (!voices || voices.length === 0) {
        console.log('⚠️ No voices available, falling back to Gemini TTS')
        await generateGeminiTTS(cleanText, onComplete, { lang, avatarType })
        return
      }
      
      // Select appropriate voice based on language and avatar type
      const selectedVoice = selectVoiceForChrome(voices, lang, avatarType)
      
      if (selectedVoice) {
        console.log('🎤 Using voice:', selectedVoice.name, 'for language:', selectedVoice.lang)
      } else {
        console.log('⚠️ No suitable voice found, using default')
      }
      
      const utterance = new SpeechSynthesisUtterance(cleanText)
      currentUtterance = utterance
      
      // Configure utterance
      utterance.voice = selectedVoice || null
      utterance.lang = lang
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 0.8 // Slightly deeper voice
      utterance.volume = 1.0
      
      console.log('🎤 Utterance configured:', { lang: utterance.lang, rate: utterance.rate, pitch: utterance.pitch })
      
      // Event handlers
      utterance.onstart = () => {
        console.log('✅ Native speech synthesis started')
        isSpeaking = true
        isPaused = false
      }
      
      utterance.onend = () => {
        console.log('✅ Native speech synthesis completed')
        isSpeaking = false
        isPaused = false
        currentUtterance = null
        currentText = ''
        currentOptions = {}
        if (onCompleteCallback) {
          onCompleteCallback()
          onCompleteCallback = null
        }
      }
      
      utterance.onpause = () => {
        console.log('⏸️ Native speech synthesis paused')
        isPaused = true
      }
      
      utterance.onresume = () => {
        console.log('▶️ Native speech synthesis resumed')
        isPaused = false
      }
      
      utterance.onerror = (error) => {
        console.error('❌ Native speech synthesis error:', error)
        isSpeaking = false
        isPaused = false
        currentUtterance = null
        currentText = ''
        currentOptions = {}
        
        if (error.error === 'not-allowed') {
          console.log('⚠️ Speech blocked by browser - user interaction required')
          console.log('🔄 Falling back to Gemini TTS...')
          generateGeminiTTS(cleanText, onComplete, { lang, avatarType })
          return
        }
        
        if (error.error === 'network') {
          console.log('🌐 Network error, falling back to Gemini TTS...')
          generateGeminiTTS(cleanText, onComplete, { lang, avatarType })
          return
        }
        
        if (onCompleteCallback) {
          onCompleteCallback()
          onCompleteCallback = null
        }
      }
      
      try {
        console.log('🎤 Attempting to speak with native synthesis...')
        window.speechSynthesis.speak(utterance)
        console.log('✅ Native speech synthesis initiated successfully')
      } catch (speakError) {
        console.error('❌ Error calling speechSynthesis.speak:', speakError)
        console.log('🔄 Falling back to Gemini TTS...')
        await generateGeminiTTS(cleanText, onComplete, { lang, avatarType })
      }
    } catch (error) {
      console.error('❌ Error in native speech synthesis setup:', error)
      console.log('🔄 Falling back to Gemini TTS...')
      await generateGeminiTTS(cleanText, onComplete, { lang, avatarType })
    }
  } else {
    // Fallback to Gemini TTS
    console.log('🎤 Using Gemini TTS fallback (synthesizerSupported:', synthesizerSupported, 'voicesLoaded:', voicesLoaded, ')')
    await generateGeminiTTS(cleanText, onComplete, { lang, avatarType })
  }
}

/**
 * Generate Gemini TTS audio with pause/resume support
 * @param {string} text - The text to convert to speech
 * @param {Function} onComplete - Optional callback when speaking is complete
 */
async function generateGeminiTTS(text, onComplete, options = {}) {
  const { lang, avatarType } = options
  try {
    console.log('🎤 Calling Gemini TTS API...')
    
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: lang || (avatarType === 'hindi-teacher' ? 'hi-IN' : undefined), avatarType })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ TTS API error:', response.status, errorData)
      throw new Error(`TTS API error: ${response.status}`)
    }

    const { audio } = await response.json()
    
    if (!audio) {
      throw new Error('No audio content received from TTS API')
    }

    console.log('🎤 Audio content received, length:', audio.length)

    // Convert base64 to audio blob and play
    const bytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    
    // Stop any existing audio
    if (currentAudioElement) {
      currentAudioElement.pause()
      currentAudioElement.src = ''
      URL.revokeObjectURL(currentAudioElement.src)
    }
    
    const audioElement = new Audio(url)
    currentAudioElement = audioElement
    
    audioElement.onended = () => {
      console.log('🎤 Gemini TTS audio completed')
      URL.revokeObjectURL(url)
      currentAudioElement = null
      currentText = ''
      currentOptions = {}
      isSpeaking = false
      isPaused = false
      if (onCompleteCallback) {
        onCompleteCallback()
        onCompleteCallback = null
      }
    }
    
    audioElement.onerror = (error) => {
      console.error('❌ Gemini TTS audio error:', error)
      URL.revokeObjectURL(url)
      currentAudioElement = null
      currentText = ''
      currentOptions = {}
      isSpeaking = false
      isPaused = false
      if (onCompleteCallback) {
        onCompleteCallback()
        onCompleteCallback = null
      }
    }
    
    // Play the audio
    await audioElement.play()
    isSpeaking = true
    isPaused = false
    console.log('✅ Gemini TTS audio started playing')
    
  } catch (error) {
    console.error('❌ Gemini TTS failed:', error)
    currentText = ''
    currentOptions = {}
    isSpeaking = false
    isPaused = false
    if (onComplete) onComplete()
  }
}

/**
 * Test speech synthesis functionality
 * This function can be called to test if speech synthesis is working
 */
export function testSpeech() {
  console.log('🧪 Testing speech synthesis...')
  
  if (!synthesizerSupported) {
    console.log('❌ Speech synthesis not supported')
    return false
  }
  
  if (!voicesLoaded) {
    console.log('❌ Voices not loaded yet')
    return false
  }
  
  try {
    const testText = "Hello, this is a test of the speech synthesis system."
    const utterance = new window.SpeechSynthesisUtterance(testText)
    
    utterance.onstart = () => console.log('✅ Test speech started')
    utterance.onend = () => console.log('✅ Test speech completed')
    utterance.onerror = (error) => {
      console.error('❌ Test speech error:', error)
      if (error.error === 'not-allowed') {
        console.log('⚠️ Browser blocked speech - user interaction required')
      }
    }
    
    window.speechSynthesis.speak(utterance)
    return true
  } catch (error) {
    console.error('❌ Test speech failed:', error)
    return false
  }
}

/**
 * Get current speech synthesis status
 * @returns {Object} - Status information
 */
export function getSpeechStatus() {
  return {
    supported: synthesizerSupported,
    voicesLoaded: voicesLoaded,
    detectionComplete: detectionComplete,
    speaking: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.speaking : false,
    paused: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.paused : false,
    pending: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.pending : false,
    currentState: getSpeakingState()
  }
}

/**
 * Stop all speech synthesis
 */
export function stopSpeaking() {
  console.log('🛑 Attempting to stop speech...')
  
  // Reset all state
  isSpeaking = false
  isPaused = false
  currentText = ''
  currentOptions = {}
  onCompleteCallback = null
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
        console.log('✅ Native speech stopped successfully')
      } else {
        console.log('ℹ️ No speech currently playing')
      }
    } catch (error) {
      console.error('❌ Error stopping speech:', error)
    }
  }
  
  // Also stop any Gemini TTS audio
  if (currentAudioElement) {
    try {
      currentAudioElement.pause()
      currentAudioElement.currentTime = 0
      currentAudioElement = null
      console.log('✅ Gemini TTS audio stopped successfully')
    } catch (error) {
      console.error('❌ Error stopping Gemini TTS audio:', error)
    }
  }
  
  // Clear current utterance reference
  if (currentUtterance) {
    currentUtterance = null
  }
}

// Export the detection status
export { synthesizerSupported }
