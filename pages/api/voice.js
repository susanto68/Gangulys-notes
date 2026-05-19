import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_VOICE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';

async function callGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const personality = `You are Susanto Ganguly, known as Sir Ganguly, a supportive computer teacher.
Speak in simple, friendly English without markdown or special characters.
Students ask questions about computer science following the ICSE curriculum.

For programming language questions (Java, Python, etc.), return a code snippet enclosed in triple backticks (\`\`\`).
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

  let lastError = null;
  for (const modelName of GEMINI_VOICE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 700,
          temperature: 0.7,
        },
      });
      const result = await model.generateContent(text);
      const reply = result.response.text();
      if (reply && reply.trim()) return reply.trim();
    } catch (error) {
      lastError = error;
      console.warn(`Gemini voice model failed: ${modelName}`, error.message);
    }
  }

  throw lastError || new Error('Empty Gemini reply');
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
      input: text,
      response_format: 'mp3'
    })
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`OpenAI TTS error: ${t || resp.status}`);
  }

  const arrayBuf = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString('base64');
  return { audioBase64: base64, audioMimeType: 'audio/mpeg' };
}

function createWaveBuffer(pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function callGeminiTTS(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Say in a calm, friendly teacher voice: ${text}`,
        }],
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Charon',
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini TTS error: ${errorText || response.status}`);
  }

  const data = await response.json();
  const inlineAudio = data?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData || part.inline_data);
  const audioBase64 = inlineAudio?.inlineData?.data || inlineAudio?.inline_data?.data;
  if (!audioBase64) throw new Error('Gemini TTS returned no audio');

  const waveBuffer = createWaveBuffer(Buffer.from(audioBase64, 'base64'));
  return { audioBase64: waveBuffer.toString('base64'), audioMimeType: 'audio/wav' };
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
    let audioMimeType = null;
    try {
      const audio = await callOpenAItTS(reply, voice || 'verse');
      audioBase64 = audio.audioBase64;
      audioMimeType = audio.audioMimeType;
    } catch (ttsErr) {
      console.error('OpenAI TTS failed, trying Gemini TTS:', ttsErr);
      try {
        const audio = await callGeminiTTS(reply);
        audioBase64 = audio.audioBase64;
        audioMimeType = audio.audioMimeType;
      } catch (geminiTtsErr) {
        console.error('Gemini TTS failed:', geminiTtsErr);
      }
    }

    return res.status(200).json({ reply, audioBase64, audioMimeType });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
