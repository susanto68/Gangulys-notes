import { useState, useEffect } from 'react'
import { initSynth, speakText, stopSpeaking, getSpeakingState, getSpeechStatus, reinitSynth } from '../lib/speech'

export default function DebugSpeech() {
  const [status, setStatus] = useState('Initializing...')
  const [speechState, setSpeechState] = useState({})
  const [testText, setTestText] = useState('Hello, this is a test of the speech synthesis system.')
  const [logs, setLogs] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog('🧪 Debug Speech Page: Initializing...')
    
    // Test browser support
    if (typeof window !== 'undefined') {
      addLog(`🌐 Browser: ${navigator.userAgent}`)
      addLog(`🔧 Window object: ${typeof window}`)
      addLog(`🎤 SpeechSynthesis: ${'speechSynthesis' in window}`)
      addLog(`🎤 SpeechSynthesisUtterance: ${'SpeechSynthesisUtterance' in window}`)
      
      if ('speechSynthesis' in window) {
        addLog(`🎤 speechSynthesis.speaking: ${window.speechSynthesis.speaking}`)
        addLog(`🎤 speechSynthesis.paused: ${window.speechSynthesis.paused}`)
        addLog(`🎤 speechSynthesis.pending: ${window.speechSynthesis.pending}`)
      }
    }
    
    initSynth()
    
    // Check status after initialization
    const timer = setTimeout(() => {
      const speechStatus = getSpeechStatus()
      const currentState = getSpeakingState()
      setStatus(`Speech Status: ${JSON.stringify(speechStatus, null, 2)}`)
      setSpeechState(currentState)
      addLog(`📊 Speech Status: ${JSON.stringify(speechStatus)}`)
      addLog(`📊 Speech State: ${JSON.stringify(currentState)}`)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  const testSpeech = () => {
    addLog('🎤 Testing speech with text: ' + testText.substring(0, 50) + '...')
    setIsSpeaking(true)
    
    speakText(testText, () => {
      addLog('✅ Test speech completed')
      setIsSpeaking(false)
    }, { avatarType: 'computer-teacher' })
  }

  const stopSpeech = () => {
    addLog('🛑 Stopping speech')
    stopSpeaking()
    setIsSpeaking(false)
  }

  const updateStatus = () => {
    const speechStatus = getSpeechStatus()
    const currentState = getSpeakingState()
    setStatus(`Speech Status: ${JSON.stringify(speechStatus, null, 2)}`)
    setSpeechState(currentState)
    addLog(`🔄 Status updated`)
  }

  const forceReinit = () => {
    addLog('🔄 Forcing speech synthesis re-initialization...')
    reinitSynth()
    
    setTimeout(() => {
      const speechStatus = getSpeechStatus()
      const currentState = getSpeakingState()
      setStatus(`Speech Status: ${JSON.stringify(speechStatus, null, 2)}`)
      setSpeechState(currentState)
      addLog(`📊 Re-initialization complete`)
    }, 2000)
  }

  const testBrowserSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      addLog('🧪 Testing browser speech synthesis directly...')
      
      try {
        const utterance = new window.SpeechSynthesisUtterance('Browser test speech')
        utterance.onstart = () => addLog('✅ Browser speech started')
        utterance.onend = () => addLog('✅ Browser speech completed')
        utterance.onerror = (error) => addLog(`❌ Browser speech error: ${error.error}`)
        
        window.speechSynthesis.speak(utterance)
        addLog('🎤 Browser speech synthesis initiated')
      } catch (error) {
        addLog(`❌ Browser speech error: ${error.message}`)
      }
    } else {
      addLog('❌ Browser speech synthesis not available')
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🧪 Speech Synthesis Debug
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Test Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Test Text:</label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={testSpeech}
                  disabled={isSpeaking}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg font-semibold"
                >
                  {isSpeaking ? '🎤 Speaking...' : '🎤 Test Speech'}
                </button>
                
                <button
                  onClick={stopSpeech}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                >
                  🛑 Stop
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={updateStatus}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  🔄 Update Status
                </button>
                
                <button
                  onClick={forceReinit}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                >
                  🔄 Force Re-init
                </button>
              </div>
              
              <button
                onClick={testBrowserSpeech}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
              >
                🌐 Test Browser Speech
              </button>
            </div>
          </div>

          {/* Status Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Speech Status</h2>
            <pre className="text-white text-sm bg-black/30 p-4 rounded-lg overflow-auto max-h-64">
              {status}
            </pre>
          </div>
        </div>

        {/* Speech State */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Current Speech State</h2>
          <pre className="text-white text-sm bg-black/30 p-4 rounded-lg overflow-auto max-h-32">
            {JSON.stringify(speechState, null, 2)}
          </pre>
        </div>

        {/* Debug Logs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Debug Logs</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
            >
              Clear
            </button>
          </div>
          <div className="bg-black/30 p-4 rounded-lg max-h-64 overflow-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-white text-sm font-mono mb-1">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-400 text-sm">No logs yet...</div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors mr-4"
          >
            ← Back to Home
          </a>
          
          <a
            href="/test-speech"
            className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 px-6 py-3 rounded-lg transition-colors"
          >
            🧪 Simple Test
          </a>
        </div>
      </div>
    </div>
  )
}
