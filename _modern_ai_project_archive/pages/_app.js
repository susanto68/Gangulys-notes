import '../styles/globals.css'
import '../styles/modern-cursor.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import ModernCursor from '../components/ModernCursor/ModernCursor'

export default function App({ Component, pageProps }) {
  const [showIntro, setShowIntro] = useState(true)
  const [isSpeakingIntro, setIsSpeakingIntro] = useState(false)
  const introStartedRef = useRef(false)

  const introText = `The vision behind this effort is inspired by the words of Rabindranath Tagore:

Where the mind is without fear and the head is held high.
Where knowledge is free.

This portal believes that education and knowledge should reach every learner without barriers.`

  const speakIntro = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || introStartedRef.current) {
      return
    }

    introStartedRef.current = true
    window.speechSynthesis.cancel()

    const speak = () => {
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find((voice) =>
        /en-IN|hi-IN/i.test(voice.lang) && /male|ravi|hemant|amit|arjun|madhur/i.test(voice.name)
      ) || voices.find((voice) =>
        /en-IN|hi-IN/i.test(voice.lang)
      ) || voices.find((voice) =>
        /india|indian/i.test(voice.name)
      )

      const utterance = new SpeechSynthesisUtterance(introText)
      utterance.lang = preferredVoice?.lang || 'en-IN'
      utterance.voice = preferredVoice || null
      utterance.pitch = 0.72
      utterance.rate = 0.82
      utterance.volume = 1
      utterance.onstart = () => setIsSpeakingIntro(true)
      utterance.onend = () => setIsSpeakingIntro(false)
      utterance.onerror = () => setIsSpeakingIntro(false)

      window.speechSynthesis.speak(utterance)
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      speak()
    } else {
      window.speechSynthesis.onvoiceschanged = speak
      setTimeout(speak, 700)
    }
  }, [introText])

  const enterPortal = () => {
    speakIntro()
    setTimeout(() => setShowIntro(false), 900)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const hasSeenIntro = sessionStorage.getItem('portalIntroPlayed') === 'true'
    if (hasSeenIntro) {
      setShowIntro(false)
      return
    }

    speakIntro()
  }, [speakIntro])

  useEffect(() => {
    if (!showIntro && typeof window !== 'undefined') {
      sessionStorage.setItem('portalIntroPlayed', 'true')
    }
  }, [showIntro])

  return (
    <>
      <ModernCursor />
      {showIntro ? (
        <main className="intro-gate">
          <section className="intro-gate__content" aria-live="polite">
            <p className="intro-gate__eyebrow">Gangulys Notes</p>
            <h1>The vision behind this effort is inspired by the words of Rabindranath Tagore:</h1>
            <blockquote>
              <p>“Where the mind is without fear and the head is held high…”</p>
              <p>“Where knowledge is free…”</p>
            </blockquote>
            <p className="intro-gate__belief">
              This portal believes that education and knowledge should reach every learner without barriers.
            </p>
            <button className="intro-gate__button" type="button" onClick={enterPortal}>
              {isSpeakingIntro ? 'Enter Portal' : 'Hear and Enter Portal'}
            </button>
          </section>
        </main>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  )
}
