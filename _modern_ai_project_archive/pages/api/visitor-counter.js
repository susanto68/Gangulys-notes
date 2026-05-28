const DEFAULT_GLOBAL_COUNT = 503;
const DEFAULT_INDIA_COUNT = 127;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

const visitorState = globalThis.__visitorCounterState || {
  globalCount: parseInt(process.env.GLOBAL_VISITOR_COUNT || `${DEFAULT_GLOBAL_COUNT}`, 10),
  indiaCount: parseInt(process.env.INDIA_VISITOR_COUNT || `${DEFAULT_INDIA_COUNT}`, 10),
  activeVisitors: new Map()
};

globalThis.__visitorCounterState = visitorState;

function cleanupActiveVisitors(now = Date.now()) {
  for (const [visitorId, lastSeen] of visitorState.activeVisitors.entries()) {
    if (now - lastSeen > ACTIVE_WINDOW_MS) {
      visitorState.activeVisitors.delete(visitorId);
    }
  }
}

function getStats() {
  cleanupActiveVisitors();

  return {
    success: true,
    globalCount: visitorState.globalCount,
    indiaCount: visitorState.indiaCount,
    totalVisitors: visitorState.globalCount + visitorState.indiaCount,
    activeNow: visitorState.activeVisitors.size,
    activeWindowSeconds: ACTIVE_WINDOW_MS / 1000,
    lastUpdated: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getStats());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      countryCode,
      ipAddress,
      userAgent,
      visitorId,
      countVisit = true
    } = req.body;

    const today = new Date().toISOString().split('T')[0];
    const clientIP = ipAddress ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress;

    const isIndia = countryCode === 'IN';
    const stableVisitorId = visitorId || `${clientIP || 'unknown'}:${userAgent || 'unknown'}`;

    visitorState.activeVisitors.set(stableVisitorId, Date.now());
    cleanupActiveVisitors();

    if (countVisit && countryCode !== 'ADMIN') {
      if (isIndia) {
        visitorState.indiaCount++;
      } else {
        visitorState.globalCount++;
      }
    }

    console.log('New visitor activity:', {
      date: today,
      country: countryCode || 'Unknown',
      isIndia,
      ip: clientIP,
      userAgent: userAgent?.substring(0, 100),
      globalCount: visitorState.globalCount,
      indiaCount: visitorState.indiaCount,
      activeNow: visitorState.activeVisitors.size,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      ...getStats(),
      message: countVisit
        ? `${isIndia ? 'Indian' : 'International'} visitor counted`
        : 'Visitor activity updated',
      note: 'For production, use a database like Vercel KV or MongoDB for persistent counts'
    });
  } catch (error) {
    console.error('Visitor counter error:', error);
    return res.status(500).json({
      error: 'Failed to update visitor counter',
      details: error.message
    });
  }
}
