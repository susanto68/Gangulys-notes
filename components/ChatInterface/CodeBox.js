import { useState } from 'react'

export default function CodeBox({ code, language = '' }) {
  const [copied, setCopied] = useState(false)
  const label = language || 'code'

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
    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-300 text-sm font-mono uppercase">{label}</span>
        <button
          onClick={copyToClipboard}
          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-teal-600"
        >
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>
      <pre className="max-h-[560px] overflow-auto rounded-xl bg-slate-900 p-4 text-sm leading-6 text-sky-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}
