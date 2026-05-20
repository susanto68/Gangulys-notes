import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { AVATAR_CONFIG } from '../lib/avatars'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import AvatarDisplay from '../components/ChatInterface/AvatarDisplay'
import CodeBox from '../components/ChatInterface/CodeBox'
import { speakText, stopSpeaking, isSpeechSupported } from '../services/speechService'

const FRIENDLY_ERROR = 'AI service is temporarily unavailable. Please try again.'
const INITIAL_MESSAGE = 'Hello, I am Sir Ganguly. Ask me anything about computer science.'

function TeacherButton({ children, onClick, disabled, variant = 'primary', type = 'button', className = '' }) {
  const variants = {
    primary: 'from-emerald-400 via-green-500 to-teal-700 text-white shadow-green-900/30',
    blue: 'from-sky-400 via-blue-600 to-indigo-800 text-white shadow-blue-900/30',
    purple: 'from-violet-400 via-purple-500 to-indigo-700 text-white shadow-purple-900/30',
    danger: 'from-rose-300 via-rose-500 to-red-700 text-white shadow-red-900/30',
    dark: 'from-slate-500 via-slate-700 to-slate-900 text-white shadow-slate-900/30'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl bg-gradient-to-b ${variants[variant]} px-5 py-4 text-base font-extrabold shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

export default function AvatarChat() {
  const router = useRouter()
  const { avatar } = router.query
  const avatarType = typeof avatar === 'string' ? avatar : 'computer-teacher'
  const avatarConfig = AVATAR_CONFIG[avatarType] || AVATAR_CONFIG['computer-teacher']
  const sessionId = useMemo(() => `teacher-${Date.now()}-${Math.random().toString(36).slice(2)}`, [])
  const answerRef = useRef(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(INITIAL_MESSAGE)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('Ready.')
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(true)
  const [error, setError] = useState('')

  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    resetTranscript,
    isSupported: recognitionSupported,
    error: speechError,
    clearError: clearSpeechError
  } = useSpeechRecognition()

  const stopVoice = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
    setStatus('Ready.')
  }, [])

  const readAnswer = useCallback((text = answer) => {
    if (isMuted || !text) return

    const started = speakText(text, {
      onStart: () => {
        setIsSpeaking(true)
        setStatus('Sir Ganguly is speaking...')
      },
      onEnd: () => {
        setIsSpeaking(false)
        setStatus('Ready for the next question.')
      },
      onError: () => {
        setIsSpeaking(false)
        setStatus('Speech is unavailable. Tap Read Again to try.')
      }
    })

    if (!started) {
      setIsSpeaking(false)
      setStatus('Speech is unavailable in this browser.')
    }
  }, [answer, isMuted])

  const askTeacher = useCallback(async (rawQuestion) => {
    const cleanQuestion = String(rawQuestion || '').trim()
    if (!cleanQuestion || isThinking) return

    stopVoice()
    setError('')
    setCode('')
    setLanguage('')
    setAnswer('')
    setIsThinking(true)
    setStatus('Sir Ganguly is thinking...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanQuestion,
          avatarType,
          sessionId
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.error || FRIENDLY_ERROR)
      }

      const nextAnswer = data.answer || data.reply || data.part1 || ''
      const nextCode = data.code || data.part2 || ''

      setAnswer(nextAnswer)
      setCode(nextCode)
      setLanguage(data.language || '')
      setStatus('Answer ready.')
      setQuestion('')

      requestAnimationFrame(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        readAnswer(nextAnswer)
      })
    } catch (requestError) {
      setError(requestError.message || FRIENDLY_ERROR)
      setAnswer(requestError.message || FRIENDLY_ERROR)
      setStatus('Please try again.')
    } finally {
      setIsThinking(false)
    }
  }, [avatarType, isThinking, readAnswer, sessionId, stopVoice])

  useEffect(() => {
    if (!transcript || isListening) return
    setQuestion(transcript)
    askTeacher(transcript)
    resetTranscript()
  }, [askTeacher, isListening, resetTranscript, transcript])

  useEffect(() => {
    if (!speechError) return
    setError(speechError)
    setStatus(speechError)
    const timer = setTimeout(() => {
      clearSpeechError()
      setError('')
      setStatus('Ready.')
    }, 5000)
    return () => clearTimeout(timer)
  }, [clearSpeechError, speechError])

  useEffect(() => {
    setSpeechAvailable(isSpeechSupported())
    return () => stopSpeaking()
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    askTeacher(question)
  }

  const handleQuestionKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      askTeacher(question)
    }
  }

  const toggleListening = async () => {
    if (isListening) {
      stopListening()
      return
    }

    setError('')
    setStatus('Listening... ask your question now.')
    await startListening()
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (nextMuted) {
      stopVoice()
      setStatus('Voice muted.')
    } else {
      setStatus('Voice unmuted.')
    }
  }

  return (
    <>
      <Head>
        <title>Sir Ganguly AI Computer Teacher</title>
        <meta name="description" content="Ask Sir Ganguly AI computer teacher by voice or text." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0,#eff6ff_38%,#f8fafc_100%)] px-3 py-4 text-slate-900 sm:px-5">
        <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[28px] border border-white/70 bg-white/78 p-4 shadow-2xl shadow-blue-900/10 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white"
              >
                Back
              </button>
              <div className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                {isThinking ? 'Thinking' : isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Online'}
              </div>
            </div>

            <header className="text-center">
              <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">AI Voice Assistant</h1>
              <p className="mt-2 text-base font-semibold text-slate-600">Sir Ganguly Computer Teacher</p>
            </header>

            <div className="mt-5 flex justify-center">
              <div className={`rounded-full p-2 transition duration-300 ${isSpeaking ? 'bg-blue-100 shadow-xl shadow-blue-300/50' : isListening ? 'bg-emerald-100 shadow-xl shadow-emerald-300/50' : 'bg-slate-100'}`}>
                <AvatarDisplay avatar={avatarType} config={avatarConfig} isSpeaking={isSpeaking} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <label htmlFor="questionInput" className="sr-only">Type your question</label>
              <textarea
                id="questionInput"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleQuestionKeyDown}
                placeholder="Type your question here. You can ask computer theory, Java, Python, programming errors, or study questions."
                className="min-h-[112px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base leading-relaxed text-slate-900 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />

              <TeacherButton type="submit" disabled={isThinking || !question.trim()}>
                Send Question to Sir Ganguly AI
              </TeacherButton>
            </form>

            <div ref={answerRef} className="mt-5 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner">
              {isThinking ? (
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="h-3 w-3 animate-ping rounded-full bg-blue-600" />
                  <span className="font-bold">Sir Ganguly is thinking...</span>
                </div>
              ) : (
                <p className="max-h-[340px] overflow-y-auto whitespace-pre-wrap text-base leading-7 text-slate-800">
                  {answer || 'Ask a question to begin.'}
                </p>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <p className="mt-4 text-center text-sm font-bold text-slate-600" aria-live="polite">
              {status}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TeacherButton onClick={toggleListening} disabled={!recognitionSupported || isThinking} variant="blue">
                {isListening ? 'Stop Listening' : 'Press/Click this button and ask any question'}
              </TeacherButton>
              <TeacherButton onClick={() => readAnswer()} disabled={!answer || isThinking || isMuted} variant="purple">
                Read Again
              </TeacherButton>
              <TeacherButton onClick={stopVoice} disabled={!isSpeaking} variant="danger">
                Stop Voice
              </TeacherButton>
              <TeacherButton onClick={toggleMute} variant="dark">
                {isMuted ? 'Unmute' : 'Mute'}
              </TeacherButton>
            </div>

            {!recognitionSupported && (
              <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Voice input is not supported in this browser. Please type your question and press Send.
              </p>
            )}

            {!speechAvailable && (
              <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Voice reading is not supported in this browser, but written answers will still work.
              </p>
            )}
          </div>

          <aside className="rounded-[28px] border border-white/70 bg-white/78 p-4 shadow-2xl shadow-blue-900/10 backdrop-blur-xl sm:p-6">
            <h2 className="text-2xl font-black text-blue-900">Code Snippet</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Programming answers appear here separately.</p>
            <div className="mt-4">
              {code ? (
                <CodeBox code={code} language={language} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm font-semibold text-slate-500">
                  Ask for a program in Java, Python, C, or another language to see code here.
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}
