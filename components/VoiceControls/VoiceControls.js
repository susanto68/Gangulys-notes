export default function VoiceControls({ 
  isListening, 
  isSpeaking, 
  isProcessing, 
  onStartListening, 
  onStopListening, 
  onStopSpeaking,
  avatarConfig,
  permissionStatus,
  error,
  noSpeechDetected,
  timeoutError,
  recognitionSupported,
  speechSupported
}) {
  const isDisabled = isProcessing || permissionStatus === 'denied' || !recognitionSupported

  return (
    <div className="text-center">
      {/* Status Indicators */}
      <div className="mb-6">
        {isListening && (
          <div className="inline-flex items-center gap-3 bg-green-500/30 text-green-100 px-6 py-3 rounded-full text-base font-semibold animate-pulse shadow-lg">
            <div className="w-4 h-4 bg-green-300 rounded-full animate-ping"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span className="font-bold">🎤 Listening... Speak now!</span>
          </div>
        )}
        
        {isSpeaking && (
          <div className="inline-flex items-center gap-3 bg-blue-500/30 text-blue-100 px-6 py-3 rounded-full text-base font-semibold animate-pulse shadow-lg">
            <div className="w-4 h-4 bg-blue-300 rounded-full animate-ping"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <span className="font-bold">🔊 Speaking...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="inline-flex items-center gap-3 bg-purple-500/30 text-purple-100 px-6 py-3 rounded-full text-base font-semibold animate-pulse shadow-lg">
            <div className="w-4 h-4 bg-purple-300 rounded-full animate-ping"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span className="font-bold">🤔 Processing your question...</span>
          </div>
        )}
        
        {permissionStatus === 'denied' && (
          <div className="inline-flex items-center gap-3 bg-red-500/30 text-red-100 px-6 py-3 rounded-full text-base font-semibold shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span className="font-bold">🚫 Microphone access denied</span>
          </div>
        )}

        {noSpeechDetected && (
          <div className="inline-flex items-center gap-3 bg-orange-500/30 text-orange-100 px-6 py-3 rounded-full text-base font-semibold shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span className="font-bold">🔇 No speech detected</span>
          </div>
        )}

        {timeoutError && (
          <div className="inline-flex items-center gap-3 bg-yellow-500/30 text-yellow-100 px-6 py-3 rounded-full text-base font-semibold shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span className="font-bold">⏰ Request timeout</span>
          </div>
        )}
        
        {!isListening && !isSpeaking && !isProcessing && permissionStatus !== 'denied' && !noSpeechDetected && !timeoutError && (
          <div className="text-center">
            <p className="text-white/70 text-base mb-2 font-medium">
              🎤 Tap <strong>Talk</strong> to ask a question
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        {isListening ? (
          <button
            onClick={onStopListening}
            className="flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Stop Listening
          </button>
        ) : isSpeaking ? (
          <button
            onClick={onStopSpeaking}
            className="flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Stop Speaking
          </button>
        ) : (
          <button
            onClick={onStartListening}
            disabled={isDisabled}
            className={`flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full shadow-lg transform transition-all duration-200 ${
              isDisabled 
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            {permissionStatus === 'denied' ? 'Permission Required' : 
             !recognitionSupported ? 'Not Supported' : 'Talk'}
          </button>
        )}
      </div>

      {/* Help text for different states */}
      {permissionStatus === 'denied' && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            To use voice features, please allow microphone access in your browser settings and refresh the page.
          </p>
        </div>
      )}

      {!recognitionSupported && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            Speech recognition is not supported in your browser. Please use Chrome, Firefox, or Safari.
          </p>
        </div>
      )}

      {noSpeechDetected && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            Try speaking louder or check if your microphone is working properly.
          </p>
        </div>
      )}

      {timeoutError && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            The request took too long. Try asking a shorter question or check your internet connection.
          </p>
        </div>
      )}

      {/* General help text */}
      {!isListening && !isSpeaking && !isProcessing && permissionStatus !== 'denied' && !noSpeechDetected && !timeoutError && recognitionSupported && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            {isDisabled 
              ? 'Please wait for processing to complete...'
              : 'Click Talk to start speaking, or wait for the avatar to finish speaking.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
