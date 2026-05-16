const INTRO_TEXT = `The vision behind this effort is inspired by the words of Rabindranath Tagore.

Where the mind is without fear and the head is held high.
Where knowledge is free.

This portal believes that education and knowledge should reach every learner without barriers.`;

async function createIntroAudio() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'verse',
      input: INTRO_TEXT,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI TTS error: ${errorText || response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end('Method not allowed');
  }

  try {
    const audio = await createIntroAudio();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.setHeader('Content-Length', audio.length);

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).send(audio);
  } catch (error) {
    console.error('Intro audio API Error:', error);
    return res.status(500).end('Introduction audio is temporarily unavailable');
  }
}
