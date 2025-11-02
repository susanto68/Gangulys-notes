import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function HomeDebug() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🧪 HomeDebug: Component mounted, step:', step)
    
    const timer = setTimeout(() => {
      try {
        console.log('🧪 HomeDebug: Moving to next step')
        setStep(prev => prev + 1)
      } catch (err) {
        console.error('🧪 HomeDebug: Error in step progression:', err)
        setError(err.message)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [step])

  // Test different components step by step
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🧪 Step 1: Basic React</h1>
          <p className="text-xl">Testing basic React functionality...</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🧪 Step 2: State Management</h1>
          <p className="text-xl">Testing state changes...</p>
          <p className="text-lg mt-2">Current step: {step}</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🧪 Step 3: Head Component</h1>
          <p className="text-xl">Testing Next.js Head component...</p>
          <Head>
            <title>Debug Test - Avatar AI</title>
          </Head>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🧪 Step 4: Constants Import</h1>
          <p className="text-xl">Testing constants import...</p>
          <p className="text-lg mt-2">Step: {step}</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">❌ Error Detected</h1>
          <p className="text-xl mb-4">React app failed to render</p>
          <p className="text-lg bg-red-800 p-4 rounded-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">✅ All Tests Passed!</h1>
        <p className="text-xl mb-6">React is working correctly</p>
        <p className="text-lg mb-4">Completed {step} steps</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => setStep(0)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold mr-4"
          >
            Restart Test
          </button>
          
          <Link 
            href="/" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold inline-block"
          >
            Try Main Page
          </Link>
        </div>
      </div>
    </div>
  )
}
