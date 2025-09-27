export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  console.log('=== TEST API DEBUG ===')
  console.log('Method:', req.method)
  console.log('Environment:', process.env.VERCEL_ENV || 'local')
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
  console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0)
  console.log('========================')

  try {
    // Test basic functionality
    const testData = {
      success: true,
      message: 'Test API is working',
      environment: process.env.VERCEL_ENV || 'local',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      apiKeyStart: process.env.GEMINI_API_KEY?.substring(0, 10) || 'not found',
      allEnvVars: Object.keys(process.env).filter(key => key.includes('GEMINI')),
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    }

    if (req.method === 'POST') {
      const body = req.body
      testData.requestBody = body
      testData.bodyType = typeof body
    }

    return res.status(200).json(testData)
  } catch (error) {
    console.error('Test API Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      environment: process.env.VERCEL_ENV || 'local'
    })
  }
}
