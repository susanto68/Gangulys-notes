// Gemini TTS API endpoint
// This endpoint converts text to speech using Gemini's Flash TTS model
// Returns base64-encoded MP3 audio data

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Only POST requests are accepted.',
      method: req.method 
    })
  }

  try {
    const { text, lang, avatarType } = req.body || {}

    // Validate required fields
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid text. Please provide a valid text string.',
        received: { text }
      })
    }

    // Check for Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return res.status(500).json({ 
        error: 'TTS service configuration error. Please try again later.'
      })
    }

    // Add timeout and retry logic for network issues
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      // Choose Hindi male voice candidates when applicable
      const isHindi = (lang && typeof lang === 'string' && lang.toLowerCase().startsWith('hi')) || avatarType === 'hindi-teacher'
      const voiceCandidates = isHindi
        ? ['hi-IN-Neural2-D', 'hi-IN-Standard-D', 'hi-IN-Standard-B', 'hi-IN-Standard-A']
        : ['en-US-Standard-A']

      console.log('🎤 Calling Gemini TTS API with text:', text.substring(0, 50) + '...')

      let audioContent = null
      let lastError = null

      for (const candidate of voiceCandidates) {
        try {
          const requestBody = {
            responseModality: "audio",
            speechConfig: {
              voice: { name: candidate },
              audioEncoding: "MP3"
            },
            prompt: text
          }
          console.log(`🎤 Attempting voice: ${candidate}`)

          const geminiResponse = await fetch(
            `https://api.ai.google/v1/models/gemini-2.5-flash-preview-tts:generate?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: controller.signal
            }
          )

          if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json().catch(() => ({}))
            console.warn(`⚠️ TTS error for voice ${candidate}:`, errorData)
            lastError = { status: geminiResponse.status, errorData }
            // On 400 try next candidate; for 401/429/others break and handle below
            if (geminiResponse.status === 400) {
              continue
            } else if (geminiResponse.status === 429) {
              return res.status(429).json({ error: 'TTS service rate limit exceeded. Please try again in a moment.' })
            } else if (geminiResponse.status === 401) {
              return res.status(500).json({ error: 'TTS service authentication error. Please try again later.' })
            } else {
              continue
            }
          }

          const data = await geminiResponse.json()
          audioContent = data.audioContent
          if (audioContent) {
            break
          }
        } catch (err) {
          console.warn(`⚠️ Exception trying voice ${candidate}:`, err.message)
          lastError = err
          
          // Check if it's a network error
          if (err.name === 'AbortError') {
            console.error('⏰ TTS request timed out')
            return res.status(408).json({ 
              error: 'TTS request timed out. Please check your internet connection and try again.',
              suggestion: 'Try using the text display instead of voice for now.'
            })
          }
          
          if (err.code === 'ENOTFOUND' || err.message.includes('fetch failed')) {
            console.error('🌐 Network error - cannot reach TTS service')
            return res.status(503).json({ 
              error: 'TTS service is currently unavailable due to network issues.',
              suggestion: 'Please check your internet connection or try again later.',
              fallback: 'Use the text display feature instead of voice.'
            })
          }
          
          continue
        }
      }

      if (!audioContent) {
        console.error('Gemini TTS failed for all voice candidates', lastError)
        return res.status(500).json({ 
          error: 'TTS generation failed for all voices. Please try again later.',
          suggestion: 'Use the text display feature instead of voice for now.',
          fallback: 'The avatar will still respond with text even without voice.'
        })
      }

      if (!audioContent) {
        throw new Error('No audio content received from Gemini TTS API')
      }
    } finally {
      clearTimeout(timeoutId)
    }

    console.log('✅ Gemini TTS API call successful, audio content received')

    // Return the base64 audio content
    return res.status(200).json({
      audio: audioContent,
      success: true
    })

  } catch (error) {
    console.error('TTS API Error:', error)
    
    // Return user-friendly error response
    let errorMessage = 'TTS service temporarily unavailable. Please try again later.'
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error during TTS conversion. Please check your internet connection.'
    } else if (error.message.includes('timeout')) {
      errorMessage = 'TTS request timed out. Please try again.'
    } else if (error.message.includes('audio')) {
      errorMessage = 'Audio generation failed. Please try again.'
    }
    
    return res.status(500).json({
      error: errorMessage,
      success: false
    })
  }
}
