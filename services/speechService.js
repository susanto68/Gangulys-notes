let currentUtterance = null

function hasSpeechSupport() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

function getVoices() {
  if (!hasSpeechSupport()) return []
  return window.speechSynthesis.getVoices() || []
}

function scoreVoice(voice) {
  const name = `${voice.name || ''} ${voice.lang || ''}`.toLowerCase()
  let score = 0

  if (/en-in|india|indian/.test(name)) score += 50
  if (/english/.test(name)) score += 20
  if (/google|microsoft|natural|online/.test(name)) score += 15
  if (voice.default) score += 10
  if (/en-/.test(name)) score += 8
  if (/female/.test(name)) score -= 3

  return score
}

function pickVoice() {
  const voices = getVoices().filter((voice) => /^en/i.test(voice.lang || ''))
  if (!voices.length) return null

  return voices
    .map((voice) => ({ voice, score: scoreVoice(voice) }))
    .sort((a, b) => b.score - a.score)[0].voice
}

function cleanForSpeech(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, 'The code is shown on screen.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_>\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stopSpeaking() {
  if (!hasSpeechSupport()) return false

  try {
    window.speechSynthesis.cancel()
    currentUtterance = null
    return true
  } catch {
    return false
  }
}

export function speakText(text, options = {}) {
  if (!hasSpeechSupport()) {
    return false
  }

  const speechText = cleanForSpeech(text)
  if (!speechText) return false

  stopSpeaking()

  const utterance = new SpeechSynthesisUtterance(speechText)
  const voice = pickVoice()

  utterance.lang = voice?.lang || 'en-IN'
  utterance.voice = voice
  utterance.rate = options.rate || 0.94
  utterance.pitch = options.pitch || 0.88
  utterance.volume = options.volume ?? 1
  utterance.onstart = () => options.onStart?.()
  utterance.onend = () => {
    currentUtterance = null
    options.onEnd?.()
  }
  utterance.onerror = () => {
    currentUtterance = null
    options.onError?.()
    options.onEnd?.()
  }

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
  return true
}

export function isSpeechSupported() {
  return hasSpeechSupport()
}
