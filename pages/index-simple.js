import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function HomeSimple() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    console.log('🧪 HomeSimple: Component mounted')
    
    const timer = setTimeout(() => {
      setIsLoaded(false)
      console.log('📱 Loading complete')
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🎓 Choose Your AI Teacher</h1>
          <p className="text-xl mb-2">Select an avatar to start your learning journey</p>
          <p className="text-sm text-white/60">Created by Sir Ganguly</p>
          <div className="mt-6 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Avatar AI Assistant - Choose Your AI Teacher</title>
        <meta name="description" content="Interactive AI Avatar Assistant Created by Sir Ganguly. Choose from various AI teachers for personalized learning experiences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              🎓 Choose Your AI Teacher
            </h1>
            <p className="text-xl text-white/80 mb-2">
              Select an avatar to start your learning journey
            </p>
            <p className="text-sm text-white/60">
              Created by Sir Ganguly
            </p>
          </div>

          {/* Simple Avatar Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {/* Computer Teacher */}
            <div 
              onClick={() => window.location.href = '/computer-teacher'}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">💻</div>
                <h3 className="text-xl font-bold text-white mb-2">Computer Teacher</h3>
                <p className="text-white/80 text-sm">Programming & Technology</p>
              </div>
            </div>

            {/* History Teacher */}
            <div 
              onClick={() => window.location.href = '/history-teacher'}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">History Teacher</h3>
                <p className="text-white/80 text-sm">Historical Events & Culture</p>
              </div>
            </div>

            {/* Physics Teacher */}
            <div 
              onClick={() => window.location.href = '/physics-teacher'}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-2">Physics Teacher</h3>
                <p className="text-white/80 text-sm">Mechanics & Energy</p>
              </div>
            </div>

            {/* English Teacher */}
            <div 
              onClick={() => window.location.href = '/english-teacher'}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-white mb-2">English Teacher</h3>
                <p className="text-white/80 text-sm">Language & Literature</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center mt-8">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors mr-4"
            >
              ← Back to Full Version
            </a>
            
            <a 
              href="/index-debug" 
              className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 px-6 py-3 rounded-lg transition-colors"
            >
              🧪 Debug Test
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
