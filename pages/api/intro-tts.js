export const config = {
  api: {
    bodyParser: {
      sizeLimit: '32kb',
    },
  },
};

const INTRO_TEXT = `The vision behind this effort is inspired by the words of Rabindranath Tagore.

Where the mind is without fear and the head is held high.
Where knowledge is free.

This portal believes that education and knowledge should reach every learner without barriers.`;

async function callOpenAItTS(text) {
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
      input: text,
      format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI TTS error: ${errorText || response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestedText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const text = requestedText || INTRO_TEXT;

    if (text !== INTRO_TEXT) {
      return res.status(400).json({ error: 'Invalid introduction text' });
    }

    const audioBase64 = await callOpenAItTS(text);
    return res.status(200).json({ audioBase64 });
  } catch (error) {
    console.error('Intro TTS API Error:', error);
    return res.status(500).json({ error: 'Introduction audio is temporarily unavailable' });
  }
}
