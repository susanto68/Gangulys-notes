import { useState, useEffect } from 'react'
import { initSynth, speakText, stopSpeaking, getSpeakingState, getSpeechStatus } from '../lib/speech'

export default function TestSpeech() {
  const [status, setStatus] = useState('Initializing...')
  const [speechState, setSpeechState] = useState({})
  const [testText, setTestText] = useState('Hello, this is a test of the speech synthesis system. I am testing if the avatar can read answers properly.')

  useEffect(() => {
    console.log('🧪 Test Speech Page: Initializing...')
    initSynth()
    
    // Check status after initialization
    const timer = setTimeout(() => {
      const speechStatus = getSpeechStatus()
      const currentState = getSpeakingState()
      setStatus(`Speech Status: ${JSON.stringify(speechStatus, null, 2)}`)
      setSpeechState(currentState)
      console.log('🧪 Speech Status:', speechStatus)
      console.log('🧪 Speech State:', currentState)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  const testSpeech = () => {
    console.log('🧪 Testing speech with text:', testText)
    speakText(testText, () => {
      console.log('✅ Test speech completed')
    }, { avatarType: 'computer-teacher' })
  }

  const stopSpeech = () => {
    console.log('🛑 Stopping speech')
    stopSpeaking()
  }

  const updateStatus = () => {
    const speechStatus = getSpeechStatus()
    const currentState = getSpeakingState()
    setStatus(`Speech Status: ${JSON.stringify(speechStatus, null, 2)}`)
    setSpeechState(currentState)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🧪 Speech Synthesis Test
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
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
            
            <div className="flex gap-4">
              <button
                onClick={testSpeech}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
              >
                🎤 Test Speech
              </button>
              
              <button
                onClick={stopSpeech}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                🛑 Stop Speech
              </button>
              
              <button
                onClick={updateStatus}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
              >
                🔄 Update Status
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Speech Status</h2>
          <pre className="text-white text-sm bg-black/30 p-4 rounded-lg overflow-auto">
            {status}
          </pre>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Current Speech State</h2>
          <pre className="text-white text-sm bg-black/30 p-4 rounded-lg overflow-auto">
            {JSON.stringify(speechState, null, 2)}
          </pre>
        </div>
        
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
