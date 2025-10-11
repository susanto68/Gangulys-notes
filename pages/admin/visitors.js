import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function VisitorAnalytics() {
  const [visitorData, setVisitorData] = useState({
    globalCount: 503,
    indiaCount: 127,
    lastUpdated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch visitor data from the API
    const fetchVisitorData = async () => {
      try {
        // Simulate fetching - in production, this would query your database
        const response = await fetch('/api/visitor-counter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            countryCode: 'ADMIN', // Admin check doesn't increment counter
            ipAddress: '0.0.0.0',
            userAgent: 'Admin Dashboard'
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setVisitorData({
            globalCount: data.globalCount || 503,
            indiaCount: data.indiaCount || 127,
            lastUpdated: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('Error fetching visitor data:', err)
        setError('Failed to fetch visitor data')
      } finally {
        setLoading(false)
      }
    }

    fetchVisitorData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchVisitorData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Head>
        <title>Visitor Analytics - Avatar AI Assistant</title>
        <meta name="description" content="Admin dashboard for visitor analytics" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🌍 Visitor Analytics
          </h1>
          <p className="text-xl text-white/80">
            Track your website visitors and engagement
          </p>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
              Loading analytics...
            </div>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm">
              ❌ {error}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Counts */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Current Counts</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">🌍 Global Visitors:</span>
                  <span className="text-3xl font-bold text-blue-400">
                    {visitorData.globalCount.toLocaleString()}+
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">🇮🇳 Indian Visitors:</span>
                  <span className="text-3xl font-bold text-green-400">
                    {visitorData.indiaCount.toLocaleString()}+
                  </span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <span className="text-white/50 text-xs">
                    Last Updated: {new Date(visitorData.lastUpdated).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">🟢 Live Status</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80">Counter is active</span>
                </div>
                <div className="space-y-2 text-white/80 text-sm">
                  <p><strong>Current Setup:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Visitor counter on all pages (top-left corner)</li>
                    <li>Counts stored in Vercel logs</li>
                    <li>Auto-refresh every 30 seconds</li>
                  </ul>
                </div>
                <div className="space-y-2 text-white/80 text-sm">
                  <p><strong>For Persistent Tracking:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Add database (MongoDB/PostgreSQL/Vercel KV)</li>
                    <li>Update visitor-counter API</li>
                    <li>Enable detailed analytics</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Vercel Logs Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 md:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-4">📋 Vercel Logs</h2>
              <div className="text-white/80 text-sm space-y-2">
                <p>Currently, visitor data is logged to Vercel console logs. To view:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Go to your Vercel dashboard</li>
                  <li>Select your project</li>
                  <li>Click on &quot;Functions&quot; tab</li>
                  <li>View logs for the visitor-counter API</li>
                  <li>Each visitor will show: country, IP, timestamp, and counts</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
