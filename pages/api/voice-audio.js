import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const MAX_SPEECH_CHARS = 180;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const cleaned = String(text || '')
    .replace(/```[\s\S]*?```/g, 'code example shown on screen')
    .replace(/[*_`#>~|{}[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= MAX_SPEECH_CHARS) return cleaned;
  const preview = cleaned.slice(0, MAX_SPEECH_CHARS).replace(/\s+\S*$/, '');
  return `${preview}. The full answer is written on the screen.`;
}

async function quickAnswerForVoice(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 140,
      temperature: 0.5,
    },
  });

  const result = await model.generateContent(`You are Sir Ganguly, a kind computer teacher.
Give a short, complete spoken answer in 2 or 3 simple sentences.
Do not use markdown, headings, or code blocks.
End naturally.

Student question: ${question}`);

  const reply = result.response.text().trim();
  if (!reply) throw new Error('No quick answer returned');
  return reply;
}

async function quickAnswerForVoiceWithRetry(question) {
  try {
    return await quickAnswerForVoice(question);
  } catch (error) {
    console.warn('Quick spoken answer failed, retrying:', error.message);
    await sleep(1200);
    return quickAnswerForVoice(question);
  }
}

async function callGeminiTTSWithRetry(text) {
  try {
    return await callGeminiTTS(text);
  } catch (error) {
    console.warn('Gemini TTS failed, retrying:', error.message);
    await sleep(1200);
    return callGeminiTTS(text);
  }
}

async function callGeminiTTS(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const speechText = textForVoice(text);
  if (!speechText) throw new Error('No text available for audio');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Say in a calm, friendly teacher voice: ${speechText}` }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
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

async function callOpenAItTS(text, voice = 'verse') {
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
      voice: voice || 'verse',
      input: textForVoice(text),
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI TTS error: ${errorText || response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { audioBase64: Buffer.from(arrayBuffer).toString('base64'), audioMimeType: 'audio/mpeg' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, question, voice } = req.body || {};
    let speechSource = typeof text === 'string' ? text.trim() : '';

    if (!speechSource && typeof question === 'string' && question.trim()) {
      speechSource = await quickAnswerForVoiceWithRetry(question.trim());
    }

    if (!speechSource) {
      return res.status(400).json({ error: 'Missing text or question' });
    }

    try {
      const audio = await callOpenAItTS(speechSource, voice || 'verse');
      return res.status(200).json(audio);
    } catch (openAiErr) {
      console.error('OpenAI audio failed, trying Gemini:', openAiErr);
      const audio = await callGeminiTTSWithRetry(speechSource);
      return res.status(200).json(audio);
    }
  } catch (error) {
    console.error('Voice audio failed:', error);
    return res.status(200).json({ audioBase64: null, audioMimeType: null, error: 'Audio is temporarily unavailable' });
  }
}
