'use client'

import { useState, useEffect } from 'react'

export default function BackButton({ onClick }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show button after component mounts for smooth fade-in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Desktop hover detection
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false)
    }
  }

  // Mobile touch highlight effect
  const handleTouchStart = () => {
    if (isMobile) {
      setIsHovered(true)
    }
  }

  const handleTouchEnd = () => {
    if (isMobile) {
      setTimeout(() => setIsHovered(false), 150)
    }
  }

  return (
    <div 
      className="fixed top-6 left-6 z-50 transition-opacity duration-500 ease-out"
      style={{ opacity: isVisible ? 1 : 0 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClick}
        className={`
          group flex items-center gap-3 px-5 py-3 
          text-white/90 hover:text-white 
          bg-white/10 hover:bg-white/20 
          rounded-full 
          transition-all duration-300 ease-out
          backdrop-blur-md border border-white/20
          shadow-lg hover:shadow-xl
          transform hover:scale-105 active:scale-95
          opacity-100
          ${isHovered ? 'bg-white/25 shadow-2xl' : ''}
        `}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Back arrow icon */}
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          className="transition-transform duration-300 group-hover:-translate-x-1"
        >
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        
        {/* Back text */}
        <span className="font-medium tracking-wide">
          Back
        </span>
        
        {/* Subtle glow effect on hover */}
        <div 
          className={`
            absolute inset-0 rounded-full 
            bg-gradient-to-r from-white/20 to-transparent 
            opacity-0 transition-opacity duration-300
            ${isHovered ? 'opacity-100' : ''}
          `}
        />
      </button>
    </div>
  )
}
