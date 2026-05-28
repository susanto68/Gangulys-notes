import { UI_TEXT, ERROR_MESSAGES, getTextDisplayWelcome } from '../../context/constant.js'

export default function TextDisplayFallback({ text }) {
  return (
    <div className="bg-white/90 backdrop-blur-md text-gray-800 rounded-2xl p-6 border border-white/30 shadow-lg min-h-[120px] flex items-center justify-center">
      <div className="text-center">
        <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere text-base leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
