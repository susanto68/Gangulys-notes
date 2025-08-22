import { useState, useEffect } from 'react'
import { getSpeakingState, pauseSpeaking, resumeSpeaking, stopSpeaking } from '../../lib/speech'

export default function SpeechControl({ 
  isSpeaking, 
  setIsSpeaking, 
  onStop, 
  className = "",
  size = "default" // "small", "default", "large"
}) {
  const [speechState, setSpeechState] = useState({
    isSpeaking: false,
    isPaused: false,
    canPause: false,
    canResume: false,
    canStop: false
  })

  // Update speech state from the library
  useEffect(() => {
    const updateSpeechState = () => {
      const state = getSpeakingState()
      setSpeechState(state)
    }

    // Update immediately
    updateSpeechState()

    // Update periodically to catch state changes
    const interval = setInterval(updateSpeechState, 100)
    
    return () => clearInterval(interval)
  }, [isSpeaking])

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (speechState.canPause) {
      // Currently speaking, pause it
      const success = pauseSpeaking()
      if (success) {
        setIsSpeaking(false)
      }
    } else if (speechState.canResume) {
      // Currently paused, resume it
      const success = resumeSpeaking()
      if (success) {
        setIsSpeaking(true)
      }
    }
  }

  // Handle stop
  const handleStop = () => {
    stopSpeaking()
    setIsSpeaking(false)
    if (onStop) onStop()
  }

  // Determine button state and appearance
  const getButtonState = () => {
    if (speechState.canPause) {
      return {
        icon: "⏸",
        text: "Pause",
        action: "pause",
        className: "bg-orange-500 hover:bg-orange-600 border-orange-400/30"
      }
    } else if (speechState.canResume) {
      return {
        icon: "▶",
        text: "Play",
        action: "resume",
        className: "bg-green-500 hover:bg-green-600 border-green-400/30"
      }
    } else {
      return {
        icon: "🔇",
        text: "No Speech",
        action: "none",
        className: "bg-gray-500 border-gray-400/30 cursor-not-allowed opacity-50"
      }
    }
  }

  const buttonState = getButtonState()
  const canInteract = buttonState.action !== "none"

  // Size classes
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    default: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg"
  }

  const iconSize = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6"
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={!canInteract}
        className={`flex items-center gap-2 ${sizeClasses[size]} font-semibold rounded-full shadow-lg transform transition-all duration-200 backdrop-blur-md border ${
          canInteract 
            ? `${buttonState.className} text-white hover:scale-105 active:scale-95` 
            : buttonState.className
        }`}
        title={buttonState.text}
      >
        <span className={`${iconSize[size]}`}>
          {buttonState.icon}
        </span>
        <span className="hidden sm:inline">
          {buttonState.text}
        </span>
      </button>

      {/* Stop Button - Only show when speaking or paused */}
      {(speechState.canStop) && (
        <button
          onClick={handleStop}
          className={`flex items-center gap-2 ${sizeClasses[size]} font-semibold bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md border border-red-400/30`}
          title="Stop Speech"
        >
          <span className={`${iconSize[size]}`}>
            ⏹
          </span>
          <span className="hidden sm:inline">
            Stop
          </span>
        </button>
      )}
    </div>
  )
}
