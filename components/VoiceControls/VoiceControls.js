import { useState, useEffect } from 'react'
import { startListening, stopListening, isListening, transcript, resetTranscript, error: speechError, clearError: clearSpeechError, permissionStatus, checkPermission, isSupported: recognitionSupported } from '../hooks/useSpeechRecognition'

export default function VoiceControls({ onTranscript, onError, onStartListening, onStopListening, className = "" }) {
  const [isActive, setIsActive] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    // Check permission status on mount
    if (recognitionSupported) {
      checkPermission()
    }
  }, [recognitionSupported, checkPermission])

  useEffect(() => {
    // Update local state when hook state changes
    setIsActive(isListening)
  }, [isListening])

  useEffect(() => {
    // Update permission status
    setPermissionGranted(permissionStatus === 'granted')
  }, [permissionStatus])

  // Handle start listening
  const handleStartListening = async () => {
    try {
      if (!recognitionSupported) {
        onError?.('Speech recognition not supported in this browser')
        return
      }

      if (permissionStatus === 'denied') {
        onError?.('Microphone permission denied. Please enable it in your browser settings.')
        return
      }

      // Reset any previous transcript
      resetTranscript()
      
      // Start listening
      await startListening()
      
      // Notify parent component
      onStartListening?.()
      
    } catch (error) {
      console.error('Failed to start listening:', error)
      onError?.(error.message || 'Failed to start listening')
    }
  }

  // Handle stop listening
  const handleStopListening = async () => {
    try {
      await stopListening()
      
      // Notify parent component
      onStopListening?.()
      
      // Send final transcript if available
      if (transcript) {
        onTranscript?.(transcript)
      }
      
    } catch (error) {
      console.error('Failed to stop listening:', error)
      onError?.(error.message || 'Failed to stop listening')
    }
  }

  // Handle talk button click (refresh session)
  const handleTalkClick = () => {
    // Reset transcript and start fresh
    resetTranscript()
    
    // If currently listening, stop first
    if (isActive) {
      handleStopListening()
    } else {
      // Start listening
      handleStartListening()
    }
  }

  // Get button state and styling
  const getButtonState = () => {
    if (isActive) {
      return {
        icon: "⏹",
        text: "Stop",
        className: "bg-red-500 hover:bg-red-600 border-red-400/30",
        action: "stop"
      }
    } else {
      return {
        icon: "🎤",
        text: "Talk",
        className: "bg-blue-500 hover:bg-blue-600 border-blue-400/30",
        action: "start"
      }
    }
  }

  const buttonState = getButtonState()

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Talk Button - Main control */}
      <button
        onClick={handleTalkClick}
        className={`${buttonState.className} text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-xl opacity-90`}
        title={buttonState.action === 'stop' ? 'Stop listening' : 'Start talking'}
      >
        <span className="text-3xl mr-3">{buttonState.icon}</span>
        {buttonState.text}
      </button>

      {/* Status Indicators */}
      <div className="flex flex-col items-center space-y-2">
        {/* Listening Status */}
        {isActive && (
          <div className="flex items-center space-x-2 text-blue-600 font-medium">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )}

        {/* Permission Status */}
        {!permissionGranted && recognitionSupported && (
          <div className="text-sm text-amber-600 font-medium">
            ⚠️ Microphone permission needed
          </div>
        )}

        {/* Support Status */}
        {!recognitionSupported && (
          <div className="text-sm text-red-600 font-medium">
            ❌ Speech recognition not supported
          </div>
        )}
      </div>

      {/* Error Display */}
      {speechError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm max-w-xs text-center">
          <div className="flex items-center justify-between">
            <span>{speechError}</span>
            <button
              onClick={clearSpeechError}
              className="ml-2 text-red-500 hover:text-red-700"
              title="Clear error"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
