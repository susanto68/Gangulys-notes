import { UI_TEXT, ERROR_MESSAGES, getTextDisplayWelcome } from '../../context/constant.js'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ReactMarkdown to prevent hydration issues
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
})

export default function TextDisplay({ text, isProcessing, avatarConfig, isListening, interimTranscript, noSpeechDetected }) {
  const [isClient, setIsClient] = useState(false)
  const [markdownError, setMarkdownError] = useState(false)
  
  const displayText = isListening && interimTranscript ? interimTranscript : text
  const isInterim = isListening && interimTranscript

  // Ensure client-side rendering to prevent hydration errors
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle markdown rendering errors gracefully
  const handleMarkdownError = (error) => {
    console.warn('Markdown rendering error:', error)
    setMarkdownError(true)
  }

  // Safe markdown rendering with error boundary
  const renderMarkdown = (content) => {
    if (!isClient || markdownError) {
      // Fallback to plain text if markdown fails or not on client
      return (
        <div className="prose prose-sm max-w-none text-center">
          <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{content}</p>
        </div>
      )
    }

    try {
      return (
        <div className="prose prose-sm max-w-none text-center">
          <ReactMarkdown 
            components={{
              // Customize markdown components for better styling
              p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words overflow-wrap-anywhere">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900 break-words overflow-wrap-anywhere">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700 break-words overflow-wrap-anywhere">{children}</em>,
              code: ({ children, className }) => (
                <code className={`bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-words overflow-wrap-anywhere ${className || ''}`}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto break-words overflow-wrap-anywhere">
                  {children}
                </pre>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 break-words overflow-wrap-anywhere">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 break-words overflow-wrap-anywhere">{children}</ol>,
              li: ({ children }) => <li className="text-left break-words overflow-wrap-anywhere">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-300 pl-4 italic text-gray-700 break-words overflow-wrap-anywhere">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-2 break-words overflow-wrap-anywhere">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mb-2 break-words overflow-wrap-anywhere">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mb-1 break-words overflow-wrap-anywhere">{children}</h3>,
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 underline break-words overflow-wrap-anywhere"
                >
                  {children}
                </a>
              ),
            }}
            onError={handleMarkdownError}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    } catch (error) {
      handleMarkdownError(error)
      return (
        <div className="prose prose-sm max-w-none text-center">
          <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{content}</p>
        </div>
      )
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md text-gray-800 rounded-2xl p-6 border border-white/30 shadow-lg min-h-[120px] flex items-center justify-center">
      {isProcessing ? (
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-purple-600 animate-pulse">
            <div className="w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span className="font-semibold">{UI_TEXT.STATUS.PROCESSING}</span>
          </div>
        </div>
      ) : noSpeechDetected ? (
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-orange-600 mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span className="font-semibold">{UI_TEXT.STATUS.NO_SPEECH}</span>
          </div>
          <p className="text-gray-600 text-sm">
            {ERROR_MESSAGES.SPEECH.NO_SPEECH}
          </p>
        </div>
      ) : displayText ? (
        <div className="w-full">
          {/* Interim transcript indicator */}
          {isInterim && (
            <div className="flex items-center justify-center gap-2 mb-3 text-green-600 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{UI_TEXT.STATUS.LISTENING}</span>
            </div>
          )}
          
          {/* Content rendering with proper hydration handling */}
          <div className={`text-base leading-relaxed text-center ${isInterim ? 'text-gray-600 italic' : ''}`}>
            {isInterim ? (
              <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {displayText}
                <span className="inline-block w-1 h-4 bg-green-500 ml-1 animate-pulse"></span>
              </p>
            ) : (
              renderMarkdown(displayText)
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p className="text-base">
            {getTextDisplayWelcome(avatarConfig?.domain)}
          </p>
        </div>
      )}
    </div>
  )
}
