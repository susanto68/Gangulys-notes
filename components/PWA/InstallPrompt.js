import { useState, useEffect } from 'react'
import { speakText } from '../../lib/speech'

export default function InstallPrompt({ avatarConfig, isSpeaking, setIsSpeaking }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
      
      // Voice prompt for installation
      if (avatarConfig && !isSpeaking) {
        const installMessage = `Hello! I'm ${avatarConfig.name}. Would you like to install me as an app on your device? This will allow you to access me anytime, even offline. You can tap the install button below to add me to your home screen.`
        
        setIsSpeaking(true)
        speakText(installMessage, () => {
          setIsSpeaking(false)
        }, { avatarType: avatarConfig.type || 'computer-teacher' })
      }
    }

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('📱 App was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      
      // Success voice message
      if (avatarConfig && !isSpeaking) {
        const successMessage = `Excellent! I've been successfully installed on your device. You can now find me in your app drawer or home screen. I'm always ready to help you learn and explore new topics!`
        
        setIsSpeaking(true)
        speakText(successMessage, () => {
          setIsSpeaking(false)
        }, { avatarType: avatarConfig.type || 'computer-teacher' })
      }
    }

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        console.log('📱 App is already installed')
        setShowInstallPrompt(false)
      }
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Check installation status on mount
    checkIfInstalled()

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [avatarConfig, isSpeaking, setIsSpeaking])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt')
      
      // Voice confirmation
      if (avatarConfig && !isSpeaking) {
        const confirmMessage = `Great choice! I'm being installed on your device now. This will only take a moment.`
        
        setIsSpeaking(true)
        speakText(confirmMessage, () => {
          setIsSpeaking(false)
        }, { avatarType: avatarConfig.type || 'computer-teacher' })
      }
    } else {
      console.log('❌ User dismissed the install prompt')
      
      // Voice message for declined installation
      if (avatarConfig && !isSpeaking) {
        const declineMessage = `No problem! You can always install me later by looking for the install button or using your browser's menu. I'm still here to help you learn!`
        
        setIsSpeaking(true)
        speakText(declineMessage, () => {
          setIsSpeaking(false)
        }, { avatarType: avatarConfig.type || 'computer-teacher' })
      }
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setIsInstalling(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    
    // Voice message for dismissed prompt
    if (avatarConfig && !isSpeaking) {
      const dismissMessage = `That's perfectly fine! You can install me anytime later. I'm still here to help you with your questions and learning.`
      
      setIsSpeaking(true)
      speakText(dismissMessage, () => {
        setIsSpeaking(false)
      }, { avatarType: avatarConfig.type || 'computer-teacher' })
    }
  }

  // Don't show if no prompt or already installed
  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl max-w-sm">
        <div className="flex items-start gap-4">
          {/* Avatar Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Install {avatarConfig?.name || 'Avatar AI'}
            </h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Add me to your home screen for quick access and offline availability. I&apos;ll be your personal AI teacher anytime, anywhere!
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isInstalling
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {isInstalling ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Installing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Install App
                  </div>
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                Maybe Later
              </button>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        {/* Benefits */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
              </svg>
              Quick Access
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
              </svg>
              Offline Available
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
              </svg>
              Home Screen
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
              </svg>
              App-like Experience
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
