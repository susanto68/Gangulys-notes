import { useState, useEffect, useRef, useCallback } from 'react'

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const recognitionRef = useRef(null)

  // Check browser support and initialize
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setIsSupported(supported)

    if (supported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      // Configure recognition settings - simplified like working example
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-IN'
      recognitionRef.current.maxAlternatives = 1

      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setError(null)
        setInterimTranscript('')
        console.log('Speech recognition started')
      }

      recognitionRef.current.onresult = (event) => {
        // Simplified like working example - only process final results
        const transcript = event.results[0][0].transcript
        setTranscript(transcript)
        setInterimTranscript('')
        console.log('Speech recognized:', transcript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        let errorMessage = 'Speech recognition error occurred'
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.'
            setPermissionStatus('denied')
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.'
            break
          case 'audio-capture':
            errorMessage = 'Audio capture error. Please check your microphone.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.'
            break
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed.'
            break
          case 'bad-grammar':
            errorMessage = 'Speech recognition grammar error.'
            break
          case 'language-not-supported':
            errorMessage = 'Language not supported.'
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }
        
        setError(errorMessage)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        console.log('Speech recognition ended')
      }

      recognitionRef.current.onaudiostart = () => {
        console.log('Audio capturing started')
      }

      recognitionRef.current.onaudioend = () => {
        console.log('Audio capturing ended')
      }

      recognitionRef.current.onsoundstart = () => {
        console.log('Sound detected')
      }

      recognitionRef.current.onsoundend = () => {
        console.log('Sound ended')
      }

      recognitionRef.current.onspeechstart = () => {
        console.log('Speech started')
      }

      recognitionRef.current.onspeechend = () => {
        console.log('Speech ended')
      }
    }
  }, [])

  // Check microphone permissions
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionStatus('unknown')
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: 'microphone' })
      setPermissionStatus(permission.state)
      
      permission.onchange = () => {
        setPermissionStatus(permission.state)
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error)
      setPermissionStatus('unknown')
    }
  }, [])

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setPermissionStatus('granted')
      setError(null)
      return true
    } catch (error) {
      console.error('Error requesting microphone permission:', error)
      setPermissionStatus('denied')
      setError('Microphone access denied. Please allow microphone permissions in your browser settings.')
      return false
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.')
      return false
    }

    if (isListening) {
      console.log('Already listening')
      return false
    }

    // Check and request permission if needed
    await checkPermission()
    
    if (permissionStatus === 'denied') {
      const granted = await requestPermission()
      if (!granted) {
        return false
      }
    }

    try {
      recognitionRef.current.start()
      return true
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setError('Failed to start speech recognition. Please try again.')
      return false
    }
  }, [isSupported, isListening, permissionStatus, checkPermission, requestPermission])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    resetTranscript,
    isSupported,
    error,
    clearError,
    permissionStatus,
    checkPermission,
    requestPermission
  }
}
