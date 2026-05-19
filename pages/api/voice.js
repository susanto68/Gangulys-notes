import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_VOICE_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];
const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const MAX_SPEECH_CHARS = 650;

function fallbackAnswer(question) {
  return `Question:
${question}
Answer:
I am having a temporary server connection problem, but I can still guide you. Please check that your question is clear and try again in a moment. If it is a computer science question, write the topic name, class, and what part you do not understand. I will explain it step by step.

Keep learning, you're doing great!`;
}

async function callGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const personality = `You are Susanto Ganguly, known as Sir Ganguly, a supportive computer teacher.
Speak in simple, friendly English.
Students ask questions about computer science following the ICSE curriculum.

For programming language questions, explain the idea first and include a short code example only when useful.
For conceptual questions, give a direct detailed answer with definitions, key points, examples, and differences when useful.

If a question is off-topic, politely say:
"That's a great question, but let's focus on computer applications as per the ICSE curriculum."

Always be positive, humble, and excited to teach.
If asked about money or financial topics, respond that this is for educational purposes only and return to computer science.
End every reply with a short motivational note such as
“Keep learning, you’re doing great!”`;

  const text = `${personality}

Give a detailed, accurate, student-friendly answer. Use simple language, examples, and steps when useful.

Student question: ${question}`;

  let lastError = null;
  for (const modelName of GEMINI_VOICE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 900,
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

async function callOpenAIText(question) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Sir Ganguly, a supportive computer science teacher for students. Give detailed, accurate, simple answers with examples and steps when useful. Avoid markdown tables.',
        },
        { role: 'user', content: question },
      ],
      max_tokens: 900,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI text error: ${errorText || response.status}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply || !reply.trim()) throw new Error('OpenAI returned no answer');
  return reply.trim();
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

function textForVoice(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, 'code example shown on screen')
    .replace(/[*_`#>~|{}[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SPEECH_CHARS);
}

async function callGeminiTTS(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const speechText = textForVoice(text);
  if (!speechText) throw new Error('No text available for Gemini TTS');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Say in a calm, friendly teacher voice: ${speechText}`,
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
    const { question, voice, includeAudio = true } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing question' });
    }

    let reply = null;
    try {
      reply = await callGemini(question);
    } catch (geminiErr) {
      console.error('Gemini answer failed, trying OpenAI text:', geminiErr);
      try {
        reply = await callOpenAIText(question);
      } catch (openAiTextErr) {
        console.error('OpenAI text failed, returning fallback answer:', openAiTextErr);
        reply = fallbackAnswer(question);
      }
    }

    if (!includeAudio) {
      return res.status(200).json({ reply, audioBase64: null, audioMimeType: null });
    }

    let audioBase64 = null;
    let audioMimeType = null;
    try {
      const audio = await callGeminiTTS(reply);
      audioBase64 = audio.audioBase64;
      audioMimeType = audio.audioMimeType;
    } catch (ttsErr) {
      console.error('Gemini TTS failed, trying OpenAI TTS:', ttsErr);
      try {
        const audio = await callOpenAItTS(textForVoice(reply), voice || 'verse');
        audioBase64 = audio.audioBase64;
        audioMimeType = audio.audioMimeType;
      } catch (openAiTtsErr) {
        console.error('OpenAI TTS failed:', openAiTtsErr);
      }
    }

    return res.status(200).json({ reply, audioBase64, audioMimeType });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
