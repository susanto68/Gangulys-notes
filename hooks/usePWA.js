import { useState, useEffect } from 'react'

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstallationStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true
      setIsInstalled(isStandalone)
    }

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Check for service worker updates
    const checkForUpdates = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            })
          }
        } catch (error) {
          console.error('Error checking for updates:', error)
        }
      }
    }

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('✅ Service Worker registered successfully:', registration)
          
          // Check for updates
          checkForUpdates()
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error)
        }
      }
    }

    // Initial setup
    checkInstallationStatus()
    registerServiceWorker()

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', checkInstallationStatus)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', checkInstallationStatus)
    }
  }, [])

  // Function to update the app
  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          setUpdateAvailable(false)
          window.location.reload()
        }
      } catch (error) {
        console.error('Error updating app:', error)
      }
    }
  }

  // Function to check if PWA is supported
  const isPWASupported = () => {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window
  }

  return {
    isInstalled,
    isOnline,
    updateAvailable,
    updateApp,
    isPWASupported
  }
}
