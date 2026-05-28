import { useEffect, useState, useCallback } from 'react'

export default function ModernCursor() {
  const [isMobile, setIsMobile] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const [touchRipples, setTouchRipples] = useState([])

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    ('ontouchstart' in window) ||
                    (navigator.maxTouchPoints > 0)
      setIsMobile(mobile)
    }

    checkMobile()

    // Only add cursor effects on desktop
    if (!isMobile) {
      // Track mouse movement
      const handleMouseMove = (e) => {
        setCursorPosition({ x: e.clientX, y: e.clientY })
      }

      // Track mouse clicks
      const handleMouseDown = () => setIsClicking(true)
      const handleMouseUp = () => setIsClicking(false)

      // Add event listeners
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mouseup', handleMouseUp)

      // Cleanup
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mousedown', handleMouseDown)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isMobile])

  // Handle touch events for mobile ripple effects
  const handleTouchStart = useCallback((e) => {
    if (isMobile) {
      const touch = e.touches[0]
      const ripple = {
        id: Date.now(),
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }
      
      setTouchRipples(prev => [...prev, ripple])
      
      // Remove ripple after animation
      setTimeout(() => {
        setTouchRipples(prev => prev.filter(r => r.id !== ripple.id))
      }, 1000)
    }
  }, [isMobile])

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
      }
    }
  }, [isMobile, handleTouchStart])

  // Don't render cursor on mobile
  if (isMobile) {
    return (
      <>
        {/* Touch ripple effects */}
        {touchRipples.map(ripple => (
          <div
            key={ripple.id}
            className="touch-ripple"
            style={{
              left: ripple.x - 25,
              top: ripple.y - 25
            }}
          />
        ))}
      </>
    )
  }

  // Desktop cursor
  return (
    <>
      {/* Main cursor */}
      <div
        className={`modern-cursor ${isClicking ? 'clicking' : ''}`}
        style={{
          left: cursorPosition.x - 15,
          top: cursorPosition.y - 15
        }}
      />
      
      {/* Cursor trail */}
      <div
        className="cursor-trail"
        style={{
          left: cursorPosition.x - 8,
          top: cursorPosition.y - 8
        }}
      />
    </>
  )
}
