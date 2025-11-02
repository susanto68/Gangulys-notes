export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

async function callGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const personality = `You are Susanto Ganguly, known as Sir Ganguly, a supportive computer teacher.
Speak in simple, friendly English without markdown or special characters.
Students ask questions about computer science following the ICSE curriculum.

For programming language questions (Java, Python, etc.), return a code snippet enclosed in triple backticks (```).
For conceptual questions (HTTPS, Server, Networking, Peripheral devices), return:

Question:
(student's question)
Answer:
(simple explanation)

If a question is off-topic, politely say:
"That's a great question, but let's focus on computer applications as per the ICSE curriculum."

Always be positive, humble, and excited to teach.
If asked about money or financial topics, respond that this is for educational purposes only and return to computer science.
End every reply with a short motivational note such as
“Keep learning, you’re doing great!”`;

  const text = `${personality}\n\nStudent question: ${question}`;

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [ { parts: [ { text } ] } ]
    })
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`Gemini error: ${t || resp.status}`);
  }
  const data = await resp.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!reply) throw new Error('Empty Gemini reply');
  return reply.trim();
}

async function callOpenAItTS(text, voice = 'verse') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: voice || 'verse',
      input: text
    })
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`OpenAI TTS error: ${t || resp.status}`);
  }

  const arrayBuf = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString('base64');
  return base64;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, voice } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing question' });
    }

    const reply = await callGemini(question);
    let audioBase64 = null;
    try {
      audioBase64 = await callOpenAItTS(reply, voice || 'verse');
    } catch (ttsErr) {
      // Still return text if TTS fails
      console.error(ttsErr);
    }

    return res.status(200).json({ reply, audioBase64 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}


