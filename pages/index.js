import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AvatarGrid from '../components/AvatarSelection/AvatarGrid'
import LoadingScreen from '../components/AvatarSelection/LoadingScreen'
import VoiceFallback from '../components/VoiceControls/VoiceFallback'
import { AVATAR_CONFIG } from '../lib/avatars'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { WELCOME_MESSAGES, UI_TEXT } from '../context/constant.js'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)
  const welcomeTimeoutRef = useRef(null)

  const { speakText, isSpeaking } = useSpeechSynthesis()



  // Auto-greeting audio on load - only once per session
  const playWelcomeGreeting = useCallback(() => {
    // Multiple safety checks to prevent infinite loops
    if (hasPlayedWelcome) {
      console.log('🛑 Welcome already played, skipping')
      return
    }

    // Check sessionStorage as primary safety (persists only for this session)
    if (typeof window !== 'undefined' && sessionStorage.getItem('welcomePlayed') === 'true') {
      console.log('🛑 Welcome already played (sessionStorage), skipping')
      setHasPlayedWelcome(true)
      return
    }

    const welcomeMessage = WELCOME_MESSAGES.MAIN_PAGE
    console.log('🎤 Starting welcome message...')

    try {
      // Mark as playing immediately to prevent multiple calls
      setHasPlayedWelcome(true)
      
      // Store in sessionStorage to prevent playing again in this session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('welcomePlayed', 'true')
      }
      
      speakText(welcomeMessage, "en", "welcome", () => {
        console.log('✅ Welcome message completed successfully')
      })
      
      console.log('🎤 Welcome message started')
    } catch (error) {
      console.warn('⚠️ Welcome message failed:', error)
      // Mark as played even on error to prevent retries
      setHasPlayedWelcome(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('welcomePlayed', 'true')
      }
    }
  }, [hasPlayedWelcome, speakText])

  // Handle avatar selection
  const handleAvatarSelect = (avatarType) => {
    router.push(`/${avatarType}`)
  }

  // Visitor counter functionality
  useEffect(() => {
    // Check if visitor already counted in this session
    const sessionKey = 'visitorCounted';
    
    // Reset session on page refresh for testing purposes
    const isPageRefresh = performance.navigation.type === 1 || 
                         (window.performance && window.performance.getEntriesByType('navigation')[0]?.type === 'reload');
    
    if (isPageRefresh) {
      console.log('🔄 Page refreshed - resetting visitor session');
      sessionStorage.removeItem(sessionKey);
      
      // Also clear corrupted counter data on refresh
      const globalCount = parseInt(localStorage.getItem('globalCount')) || 0;
      const indiaCount = parseInt(localStorage.getItem('indiaCount')) || 0;
      
      if (globalCount < 0 || globalCount > 1000000) {
        console.log('🔄 Clearing corrupted global counter on refresh');
        localStorage.removeItem('globalCount');
      }
      
      if (indiaCount < 0 || indiaCount > 1000000) {
        console.log('🔄 Clearing corrupted Indian counter on refresh');
        localStorage.removeItem('indiaCount');
      }
    }
    
    if (sessionStorage.getItem(sessionKey)) {
        console.log('🔄 Visitor already counted in this session, showing current counts');
        // Just display current counts without incrementing
        const globalCount = parseInt(localStorage.getItem('globalCount')) || 503;
        const indiaCount = parseInt(localStorage.getItem('indiaCount')) || 127;
        
        const globalElement = document.getElementById("global-count");
        const indiaElement = document.getElementById("india-count");
        
        if (globalElement) globalElement.innerText = globalCount;
        if (indiaElement) indiaElement.innerText = indiaCount;
        
        // Update status message
        const statusElement = document.querySelector('.visitor.status');
        if (statusElement) {
          statusElement.innerHTML = '🔄 Showing current counts';
        }
        return;
      }

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      // Smooth count animation
      const animateCount = (el, newValue) => {
        if (!el) return;
        
        let start = parseInt(el.dataset.count) || 0;
        let end = newValue;
        
        // Prevent negative counting - always count up
        if (end < start) {
          end = start; // Don't allow decreasing counts
        }
        
        let duration = 800;
        let stepTime = Math.abs(Math.floor(duration / (end - start))) || 20;
        let current = start;
        let increment = 1; // Always increment, never decrement

        // If start and end are the same, just update the display
        if (start === end) {
          el.innerText = end;
          el.dataset.count = end;
          return;
        }

        let timer = setInterval(() => {
          current += increment;
          el.innerText = current;
          if (current >= end) {
            clearInterval(timer);
            el.innerText = end;
            el.dataset.count = end;
          }
        }, stepTime);
      };

      // Get current counts from localStorage or use defaults
      const getCurrentCounts = () => {
        let globalCount = parseInt(localStorage.getItem('globalCount')) || 503;
        let indiaCount = parseInt(localStorage.getItem('indiaCount')) || 127;
        
        // Check if counts are corrupted (negative or extremely high)
        if (globalCount < 0 || globalCount > 1000000) {
          console.warn('⚠️ Corrupted global count detected, resetting to default');
          globalCount = 503;
          localStorage.setItem('globalCount', '503');
        }
        
        if (indiaCount < 0 || indiaCount > 1000000) {
          console.warn('⚠️ Corrupted Indian count detected, resetting to default');
          indiaCount = 127;
          localStorage.setItem('indiaCount', '127');
        }
        
        // Ensure counts are never negative
        globalCount = Math.max(0, globalCount);
        indiaCount = Math.max(0, indiaCount);
        
        return { globalCount, indiaCount };
      };

      // Update counter in localStorage and animate
      const updateCounter = (type, newValue) => {
        // Ensure the new value is never negative
        const safeValue = Math.max(0, newValue);
        localStorage.setItem(`${type}Count`, safeValue.toString());
        const element = document.getElementById(`${type}-count`);
        if (element) {
          animateCount(element, safeValue);
        }
      };

      // Detect visitor country and update counters using our API
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          console.log('🌍 Visitor location detected:', data.country_code, data.country_name);
          console.log('📍 Location details:', {
            country: data.country_name,
            code: data.country_code,
            city: data.city,
            region: data.region
          });
          
          let isIndia = (data.country_code === "IN");
          
          // Send visitor data to our API for proper tracking
          fetch('/api/visitor-counter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: data.country_code,
              ipAddress: data.ip,
              userAgent: navigator.userAgent
            })
          })
          .then(res => res.json())
          .then(apiResponse => {
            if (apiResponse.success) {
              console.log('✅ Visitor counted via API:', apiResponse.message);
              
              // Update display with new counts from API
              updateCounter('global', apiResponse.globalCount);
              updateCounter('india', apiResponse.indiaCount);
              
              // Update status message
              const statusElement = document.querySelector('.visitor.status');
              if (statusElement) {
                statusElement.innerHTML = `📍 ${isIndia ? '🇮🇳 Indian' : '🌍 International'} visitor counted`;
              }
            } else {
              console.warn('⚠️ API counter failed, using local fallback');
              // Fallback to local counting
              let { globalCount, indiaCount } = getCurrentCounts();
              if (isIndia) {
                indiaCount++;
                updateCounter('india', indiaCount);
                updateCounter('global', globalCount);
              } else {
                globalCount++;
                updateCounter('global', globalCount);
                updateCounter('india', indiaCount);
              }
            }
          })
          .catch(error => {
            console.warn('⚠️ API call failed, using local fallback:', error);
            // Fallback to local counting
            let { globalCount, indiaCount } = getCurrentCounts();
            if (isIndia) {
              indiaCount++;
              updateCounter('india', indiaCount);
              updateCounter('global', globalCount);
            } else {
              globalCount++;
              updateCounter('global', globalCount);
              updateCounter('india', indiaCount);
            }
          });

          // Mark this visitor as counted for this session
          sessionStorage.setItem(sessionKey, 'true');
          console.log('✅ Visitor counted and session marked');
        })
        .catch(error => {
          console.warn('⚠️ Location detection failed, using default counters:', error);
          // Fallback to default behavior
          let { globalCount, indiaCount } = getCurrentCounts();
          globalCount++; // Assume global visitor
          updateCounter('global', globalCount);
          updateCounter('india', indiaCount);
          
          // Mark this visitor as counted for this session
          sessionStorage.setItem(sessionKey, 'true');
          console.log('✅ Visitor counted (fallback) and session marked');
          
          // Update status message
          const statusElement = document.querySelector('.visitor.status');
          if (statusElement) {
            statusElement.innerHTML = '📍 Visitor counted (location unknown)';
          }
        });
    }, 1000); // Wait 1 second for DOM to be ready

    return () => clearTimeout(timer);
  }, []);

  // Initialize app
  useEffect(() => {
    const initApp = () => {
      console.log('🚀 Initializing app...')
      
      // Check if welcome message has been played in this session
      if (typeof window !== 'undefined') {
        const welcomePlayed = sessionStorage.getItem('welcomePlayed')
        if (welcomePlayed === 'true') {
          console.log('✅ Welcome already played in this session')
          setHasPlayedWelcome(true)
        } else {
          console.log('🆕 New session - welcome message will play')
          setHasPlayedWelcome(false)
        }
      }

      // Simulate loading time for smooth experience
      setTimeout(() => {
        setIsLoading(false)
        console.log('📱 Loading complete, checking welcome message...')

        // Play welcome greeting after loading only if not played yet
        if (!hasPlayedWelcome) {
          console.log('🎤 Scheduling welcome message...')
          welcomeTimeoutRef.current = setTimeout(() => {
            playWelcomeGreeting()
          }, 500)
        } else {
          console.log('🛑 Welcome already played, skipping')
        }
      }, 1000)
    }

    initApp()

    // Cleanup timeout on unmount
    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current)
        console.log('🧹 Cleaned up welcome timeout')
      }
    }
  }, [playWelcomeGreeting]) // Removed hasPlayedWelcome from dependencies to prevent loops

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <>
      <Head>
        <title>Avatar AI Assistant - Choose Your AI Teacher</title>
        <meta name="description" content="Interactive AI Avatar Assistant Created by Sir Ganguly. Choose from various AI teachers for personalized learning experiences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Avatar AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/assets/icons/icon-152x152.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      
      <VoiceFallback onVoiceSupportChange={(supported) => console.log('Voice support:', supported)}>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
          {/* Visitor Counters */}
          <div id="visitor-counters">
            <div className="visitor global">
              🌍 <b>Global:</b> <span id="global-count" data-count="503">503</span>
            </div>
            <div className="visitor india">
              🇮🇳 <b>India:</b> <span id="india-count" data-count="127">127</span>
            </div>
            <div className="visitor status" style={{fontSize: '8px', opacity: 0.6, marginTop: '2px'}}>
              📍 Detecting...
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {UI_TEXT.TITLES.MAIN_PAGE}
              </h1>
              <p className="text-xl text-white/80 mb-2">
                {UI_TEXT.TITLES.SUBTITLE}
              </p>
              <p className="text-sm text-white/60">
                {UI_TEXT.TITLES.CREATOR}
              </p>
            </div>

            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm animate-pulse">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                  {UI_TEXT.STATUS.WELCOME_PLAYING}
                </div>
              </div>
            )}

            {/* Welcome status */}
            {hasPlayedWelcome && !isSpeaking && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  {UI_TEXT.STATUS.WELCOME_COMPLETED}
                </div>
              </div>
            )}

            {/* Avatar Grid */}
            <AvatarGrid 
              avatars={AVATAR_CONFIG} 
              onAvatarSelect={handleAvatarSelect}
            />

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/60 text-sm mb-4">
                {UI_TEXT.TITLES.FOOTER}
              </p>
              <Link 
                href="/admin/visitors" 
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                📊 View Visitor Analytics
              </Link>
                        </div>
          </div>
        </div>
      </VoiceFallback>
    </>
  )
}