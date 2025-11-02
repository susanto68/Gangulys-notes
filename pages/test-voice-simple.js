import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function TestVoiceSimple() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('Ask me anything about computer science...')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  
  const recognitionRef = useRef(null)
  const utteranceRef = useRef(null)

  // Initialize speech recognition like the working example
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.lang = 'en-IN'
        recognitionRef.current.interimResults = false
        recognitionRef.current.maxAlternatives = 1

        recognitionRef.current.onstart = () => {
          setIsListening(true)
          setStatus('Listening...')
          setError('')
        }

        recognitionRef.current.onresult = async (event) => {
          const transcript = event.results[0][0].transcript
          setTranscript(transcript)
          setStatus('Thinking...')
          
          try {
            // Call API exactly like the working example
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: transcript,
                avatarType: 'computer-teacher',
                sessionId: 'test-session'
              })
            })
            
            const data = await res.json()
            processReply(data.reply || data.part1 || 'No response received')
          } catch (err) {
            processReply('Sorry, I could not reach the server.')
          }
        }

        recognitionRef.current.onerror = (event) => {
          setStatus('Error: ' + event.error)
          setError(event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          if (!isSpeaking) {
            setStatus('')
          }
        }
      }
    }
  }, [])

  // Process reply and speak like the working example
  const processReply = (reply) => {
    setResponse(reply)
    speakText(reply)
  }

  // Speak text like the working example
  const speakText = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Stop any existing speech
      window.speechSynthesis.cancel()
      
      setIsSpeaking(true)
      setStatus('Speaking...')
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-IN'
      utterance.rate = 1
      utterance.pitch = 1
      
      // Try to find a male voice
      const voices = window.speechSynthesis.getVoices()
      const maleVoice = voices.find(v => /male/i.test(v.name))
      if (maleVoice) utterance.voice = maleVoice
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setStatus('')
      }
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event.error)
        setIsSpeaking(false)
        setStatus('')
      }
      
      window.speechSynthesis.speak(utterance)
      utteranceRef.current = utterance
    }
  }

  // Stop speech
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setStatus('')
    }
  }

  // Start listening
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      stopSpeech()
      recognitionRef.current.start()
    }
  }

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  return (
    <>
      <Head>
        <title>Simple Voice Test - AI Avatar Assistant</title>
        <meta name="description" content="Simple voice test page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full border border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            🎤 Simple Voice Test
          </h1>
          
          {/* Avatar placeholder */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
              🤖
            </div>
          </div>
          
          {/* Response box */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6 min-h-[100px]">
            <div className="text-gray-800 whitespace-pre-wrap">
              {transcript && (
                <div className="mb-2 p-2 bg-blue-100 rounded">
                  <strong>You said:</strong> {transcript}
                </div>
              )}
              <div>{response}</div>
            </div>
          </div>
          
          {/* Status */}
          <div className="text-center mb-6">
            <div className="text-white/80 text-sm min-h-[1.2em]">
              {status}
            </div>
            {error && (
              <div className="text-red-300 text-sm mt-2">
                Error: {error}
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? '⏹ Stop' : '🎤 Talk'}
            </button>
            
            <button
              onClick={stopSpeech}
              disabled={!isSpeaking}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔇 Stop Speech
            </button>
          </div>
          
          {/* Debug info */}
          <div className="mt-8 text-center text-white/60 text-sm">
            <div>Listening: {isListening ? 'Yes' : 'No'}</div>
            <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
            <div>Speech Recognition: {recognitionRef.current ? 'Supported' : 'Not Supported'}</div>
            <div>Speech Synthesis: {typeof window !== 'undefined' && 'speechSynthesis' in window ? 'Supported' : 'Not Supported'}</div>
          </div>
          
          {/* Navigation */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

