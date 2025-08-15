import { useState } from 'react'

export default function CodeBox({ code }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-300 text-sm font-mono">javascript</span>
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy code
            </>
          )}
        </button>
      </div>
      <pre className="text-gray-100 text-sm break-words overflow-wrap-anywhere whitespace-pre-wrap">
        <code className="break-words overflow-wrap-anywhere">{code}</code>
      </pre>
    </div>
  )
}
