import React from 'react'
import { UI_TEXT } from '../../context/constant.js'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-center text-white">
        <div className="loading-spinner mx-auto mb-6 animate-bounce">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3 animate-pulse">
          {UI_TEXT.LOADING.TITLE}
        </h1>
        <p className="text-sm md:text-base opacity-70 mb-4">
          Created by <strong>Sir Ganguly</strong>
        </p>
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm opacity-80">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          {UI_TEXT.LOADING.GREETING_READY}
        </div>
        <div className="mt-6 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  )
}
