export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'JDoodle credentials not configured' });
  }

  const { code, language = 'java', versionIndex = '3', stdin = '' } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const resp = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script: code,
        language,
        versionIndex,
        stdin,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(502).json({ error: 'JDoodle API error', details: text });
    }

    const data = await resp.json();
    // Normalize response
    return res.status(200).json({
      output: data.output ?? '',
      memory: data.memory ?? null,
      cpuTime: data.cpuTime ?? null,
      statusCode: data.statusCode ?? null,
    });
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || err.code === 'ABORT_ERR');
    return res.status(500).json({ error: aborted ? 'Request timed out' : 'Execution failed' });
  }
}


