import { useState, useEffect } from 'react'
import { getSpeakingState, pauseSpeaking, resumeSpeaking } from '../../lib/speech'

export default function SpeechControl({ isSpeaking, onCopy, currentText }) {
  const [speechState, setSpeechState] = useState({})
  const [copyStatus, setCopyStatus] = useState('')

  // Update speech state from the library and sync with props
  useEffect(() => {
    const updateSpeechState = () => {
      const state = getSpeakingState()
      
      // Sync with the avatar's speaking state
      if (isSpeaking && !state.isSpeaking && !state.isPaused) {
        // Avatar is speaking but library doesn't know - update library state
        state.isSpeaking = true
        state.canPause = true
        state.canStop = true
      }
      
      setSpeechState(state)
    }
    
    updateSpeechState()
    
    // Update more frequently to catch state changes
    const interval = setInterval(updateSpeechState, 50)
    
    return () => clearInterval(interval)
  }, [isSpeaking])

  // Handle play/pause toggle
  const handlePlayPause = () => {
    console.log('🎮 Play/Pause clicked, current state:', speechState)
    
    if (speechState.canPause || isSpeaking) {
      // Currently speaking, pause it
      console.log('⏸️ Pausing speech...')
      const success = pauseSpeaking()
      if (success) {
        console.log('✅ Speech paused successfully')
      } else {
        console.log('❌ Failed to pause speech')
      }
    } else if (speechState.canResume || speechState.isPaused) {
      // Currently paused, resume it
      console.log('▶️ Resuming speech...')
      const success = resumeSpeaking()
      if (success) {
        console.log('✅ Speech resumed successfully')
      } else {
        console.log('❌ Failed to resume speech')
      }
    }
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!currentText || currentText.trim() === '') {
      setCopyStatus('❌ No text to copy')
      setTimeout(() => setCopyStatus(''), 2000)
      return
    }

    try {
      await navigator.clipboard.writeText(currentText)
      setCopyStatus('✅ Answer copied!')
      setTimeout(() => setCopyStatus(''), 2000)
      
      // Notify parent component
      if (onCopy) {
        onCopy(currentText)
      }
    } catch (error) {
      console.error('Copy failed:', error)
      setCopyStatus('❌ Copy failed')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  // Determine button state and appearance
  const getButtonState = () => {
    // Check if avatar is currently speaking
    if (isSpeaking || speechState.isSpeaking) {
      return {
        icon: "⏸",
        text: "Pause",
        className: "bg-blue-500 hover:bg-blue-600 border-blue-400/30"
      }
    } else if (speechState.isPaused || speechState.canResume) {
      return {
        icon: "▶",
        text: "Play",
        className: "bg-blue-500 hover:bg-blue-600 border-blue-400/30"
      }
    } else {
      return {
        icon: "▶",
        text: "Play",
        className: "bg-blue-400 hover:bg-blue-500 border-blue-300/30"
      }
    }
  }

  const buttonState = getButtonState()

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className={`${buttonState.className} text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-xl opacity-90`}
        title={`${buttonState.text} speech`}
      >
        <span className="text-2xl mr-2">{buttonState.icon}</span>
        {buttonState.text}
      </button>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg border-2 border-blue-400/30 transition-all duration-200 transform hover:scale-105 hover:shadow-xl opacity-90"
        title="Copy answer to clipboard"
      >
        📋 Copy Answer
      </button>

      {/* Copy Status */}
      {copyStatus && (
        <div className={`text-sm font-medium px-3 py-1 rounded-full ${
          copyStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {copyStatus}
        </div>
      )}

      {/* Speech Status Indicator */}
      <div className="text-xs text-gray-500 text-center">
        {isSpeaking ? '🔊 Speaking...' : speechState.isPaused ? '⏸️ Paused' : '🔇 Ready'}
      </div>
    </div>
  )
}
