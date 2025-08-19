import { useState, useEffect } from 'react'

export default function VoiceFallback({ children, onVoiceSupportChange }) {
  const [isVoiceSupported, setIsVoiceSupported] = useState(true)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    // Check for speech recognition support
    const checkVoiceSupport = () => {
      const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      setIsVoiceSupported(isSupported)
      
      // Notify parent component about voice support status
      if (onVoiceSupportChange) {
        onVoiceSupportChange(isSupported)
      }

      // Show fallback message after a short delay if not supported
      if (!isSupported) {
        setTimeout(() => setShowFallback(true), 2000)
      }
    }

    checkVoiceSupport()
  }, [onVoiceSupportChange])

  // If voice is supported, render children normally
  if (isVoiceSupported) {
    return children
  }

  // Voice not supported - show fallback
  return (
    <>
      {children}
      
      {/* Non-intrusive fallback message */}
      {showFallback && (
        <div className="voice-fallback-message">
          <div className="voice-fallback-content">
            <div className="voice-fallback-icon">🎤</div>
            <div className="voice-fallback-text">
              <strong>Voice input not supported</strong>
              <span>Use Chrome/Android for best experience</span>
            </div>
            <button 
              className="voice-fallback-close"
              onClick={() => setShowFallback(false)}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
