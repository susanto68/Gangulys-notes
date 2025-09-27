export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  console.log('=== GEMINI API DEBUG ===')
  console.log('Environment:', process.env.VERCEL_ENV || 'local')
  console.log('API Key exists:', !!process.env.GEMINI_API_KEY)
  console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 0)
  console.log('API Key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10) || 'N/A')
  console.log('========================')

  try {
    // Test if we can import the Gemini library
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    console.log('✅ Gemini library imported successfully')

    // Test if we can create the client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    console.log('✅ Gemini client created successfully')

    // Test if we can get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    console.log('✅ Model retrieved successfully')

    // Test a simple API call
    const result = await model.generateContent('Hello, respond with just "Hi"')
    const response = await result.response
    const text = response.text()
    console.log('✅ API call successful, response:', text)

    return res.status(200).json({
      success: true,
      message: 'Gemini API is working correctly',
      environment: process.env.VERCEL_ENV || 'local',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      testResponse: text,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Gemini API Error:', error)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })

    return res.status(200).json({
      success: false,
      error: error.message,
      errorType: error.name,
      environment: process.env.VERCEL_ENV || 'local',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      timestamp: new Date().toISOString()
    })
  }
}
