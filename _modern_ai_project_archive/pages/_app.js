import '../styles/globals.css'
import '../styles/modern-cursor.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import ModernCursor from '../components/ModernCursor/ModernCursor'

const INTRO_PLAYED_STORAGE_KEY = 'sirgangulyPortalIntroPlayed'

function hasIntroPlayed() {
  if (typeof window === 'undefined') return false
  if (window.__sirGangulyPortalIntroPlayed === true) return true

  try {
    if (window.localStorage.getItem(INTRO_PLAYED_STORAGE_KEY) === 'true') {
      window.__sirGangulyPortalIntroPlayed = true
      return true
    }
  } catch (_) {}

  try {
    const cookieName = `${INTRO_PLAYED_STORAGE_KEY}=true`
    if (document.cookie.split('; ').includes(cookieName)) {
      window.__sirGangulyPortalIntroPlayed = true
      return true
    }
  } catch (_) {}

  return false
}

function markIntroPlayed() {
  if (typeof window === 'undefined') return
  window.__sirGangulyPortalIntroPlayed = true

  try {
    window.localStorage.setItem(INTRO_PLAYED_STORAGE_KEY, 'true')
  } catch (_) {}

  try {
    document.cookie = `${INTRO_PLAYED_STORAGE_KEY}=true; Max-Age=31536000; Path=/; SameSite=Lax`
  } catch (_) {}
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [showIntro, setShowIntro] = useState(true)
  const [isSpeakingIntro, setIsSpeakingIntro] = useState(false)
  const introStartedRef = useRef(false)

  const introText = `The vision behind this effort is inspired by the words of Rabindranath Tagore:

Where the mind is without fear and the head is held high.
Where knowledge is free.

This portal believes that education and knowledge should reach every learner without barriers.`

  const speakIntro = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || introStartedRef.current || hasIntroPlayed()) {
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
      utterance.onstart = () => {
        markIntroPlayed()
        setIsSpeakingIntro(true)
      }
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
    markIntroPlayed()
    setTimeout(() => setShowIntro(false), 900)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (hasIntroPlayed()) {
      setShowIntro(false)
      return
    }

    speakIntro()
  }, [speakIntro])

  useEffect(() => {
    if (!showIntro && typeof window !== 'undefined') {
      markIntroPlayed()
    }
  }, [showIntro])

  // Inject Sir Ganguly Analytics Core on client-side mount & track SPA page views
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.SirGangulyAnalyticsLoaded) {
      window.SirGangulyAnalyticsLoaded = true;
      const analyticsScript = document.createElement('script');
      const primaryDomain = 'https://sirganguly.com';
      analyticsScript.src = primaryDomain + '/sirganguly-analytics.js?v=20260530-unified-v1';
      analyticsScript.async = true;
      document.head.appendChild(analyticsScript);
    }

    const handleRouteChange = () => {
      if (window.SirGangulyAnalytics) {
        window.SirGangulyAnalytics.firePageView();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

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
