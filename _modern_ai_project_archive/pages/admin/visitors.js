import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function VisitorAnalytics() {
  const [visitorData, setVisitorData] = useState({
    globalCount: 503,
    indiaCount: 127,
    totalVisitors: 630,
    activeNow: 0,
    lastUpdated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVisitorData = async () => {
      try {
        const response = await fetch('/api/visitor-counter')

        if (response.ok) {
          const data = await response.json()
          setVisitorData({
            globalCount: data.globalCount || 503,
            indiaCount: data.indiaCount || 127,
            totalVisitors: data.totalVisitors || (data.globalCount || 503) + (data.indiaCount || 127),
            activeNow: data.activeNow || 0,
            lastUpdated: data.lastUpdated || new Date().toISOString()
          })
          setError(null)
        } else {
          setError('Failed to fetch visitor data')
        }
      } catch (err) {
        console.error('Error fetching visitor data:', err)
        setError('Failed to fetch visitor data')
      } finally {
        setLoading(false)
      }
    }

    fetchVisitorData()
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
            Visitor Analytics
          </h1>
          <p className="text-xl text-white/80">
            Track your website visitors and active users
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
              {error}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Current Counts</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-white/80">Total Visitors:</span>
                  <span className="text-3xl font-bold text-cyan-300">
                    {visitorData.totalVisitors.toLocaleString()}+
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-white/80">Active Now:</span>
                  <span className="text-3xl font-bold text-emerald-300">
                    {visitorData.activeNow.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-white/80">Global Visitors:</span>
                  <span className="text-3xl font-bold text-blue-400">
                    {visitorData.globalCount.toLocaleString()}+
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-white/80">Indian Visitors:</span>
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

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Live Status</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80">Counter is active</span>
                </div>
                <div className="space-y-2 text-white/80 text-sm">
                  <p><strong>Current Setup:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Visitor counter is shown on the homepage.</li>
                    <li>Active users are counted from recent visitor heartbeats.</li>
                    <li>This dashboard auto-refreshes every 30 seconds.</li>
                  </ul>
                </div>
                <div className="space-y-2 text-white/80 text-sm">
                  <p><strong>For Persistent Tracking:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Add a database such as Vercel KV, MongoDB, or PostgreSQL.</li>
                    <li>Store visitor records permanently.</li>
                    <li>Use authentication before making this dashboard public.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
