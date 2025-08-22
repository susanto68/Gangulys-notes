import { useState, useEffect } from 'react'

export default function TestMinimal() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    console.log('🧪 TestMinimal: Component mounted')
    
    const timer = setTimeout(() => {
      console.log('🧪 TestMinimal: Setting loaded to true')
      setIsLoaded(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🧪 Testing React Mounting</h1>
          <p className="text-xl">Loading... (2 seconds)</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">✅ React is Working!</h1>
        <p className="text-xl mb-6">The React app mounted successfully</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => alert('Button click works!')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold"
          >
            Test Button Click
          </button>
          
          <div className="mt-4">
            <a 
              href="/" 
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold inline-block"
            >
              Back to Main Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
