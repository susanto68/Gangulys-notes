import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const MAX_SPEECH_CHARS = 900;
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

function localSpokenAnswer(question) {
  const q = String(question || '').toLowerCase();
  if (/\bpython\b/.test(q) && /\b(add|sum)\b/.test(q) && /\bdigits?\b/.test(q)) {
    return 'In Python, add all digits of a number by taking the last digit with modulus 10, adding it to a sum, and removing that digit with integer division by 10. The full program is written on the screen.';
  }
  if (/\brecursion\b/.test(q) && /\bjava\b/.test(q)) {
    return 'Recursion in Java means a method calls itself. It needs a base condition to stop, and it is useful for problems like factorial and Fibonacci. The full explanation and Java example are written on the screen.';
  }
  if (/\brecursion\b/.test(q)) {
    return 'Recursion means a function or method calls itself to solve smaller parts of the same problem.';
  }
  if (/artificial\s+intelligen/.test(q) || /\bai\b/.test(q)) {
    return 'Artificial Intelligence is a branch of computer science that helps machines learn, reason, solve problems, and make decisions like humans.';
  }
  if (/selection\s*sort/.test(q) && /\bjava\b/.test(q)) {
    return 'Selection sort in Java repeatedly finds the smallest element from the unsorted part of the array and swaps it into the correct position. The full explanation and Java program are written on the screen.';
  }
  if (/selection\s*sort/.test(q)) {
    return 'Selection sort repeatedly selects the smallest element from the unsorted part and places it in the correct position.';
  }
  if (/bubble\s*sort/.test(q) && /\bjava\b/.test(q)) {
    return 'Bubble sort in Java compares adjacent array elements and swaps them when they are in the wrong order. The full explanation and Java program are written on the screen.';
  }
  if (/bubble\s*sort/.test(q)) {
    return 'Bubble sort compares adjacent elements and swaps them until the list becomes sorted. It is simple to learn, but slow for large data.';
  }
  if (/\bram\b|random access memory/.test(q)) {
    return 'RAM stands for Random Access Memory. It is the temporary working memory of a computer. It helps programs run quickly, but its data is lost when power is switched off.';
  }
  if (/\brom\b|read only memory/.test(q)) {
    return 'ROM stands for Read Only Memory. It stores permanent startup instructions for the computer and keeps its data even when power is switched off.';
  }
  if (/\bcpu\b|processor/.test(q)) {
    return 'CPU stands for Central Processing Unit. It is the main processing part of the computer and is often called the brain of the computer.';
  }
  if (/\balgorithm\b/.test(q)) {
    return 'An algorithm is a step-by-step method for solving a problem. It helps us plan the logic before writing a program.';
  }
  return 'I have written the answer on the screen. Read it carefully, and ask again with the topic name if you want a more detailed explanation.';
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
  const localAnswer = localSpokenAnswer(question);
  if (!/answer on the screen/i.test(localAnswer)) return localAnswer;

  try {
    return await quickAnswerForVoice(question);
  } catch (error) {
    console.warn('Quick spoken answer failed, retrying:', error.message);
    await sleep(1200);
    try {
      return await quickAnswerForVoice(question);
    } catch (retryError) {
      console.warn('Quick spoken answer retry failed, using local spoken answer:', retryError.message);
      return localSpokenAnswer(question);
    }
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
      model: 'tts-1',
      voice: voice || 'verse',
      input: textForVoice(text),
      response_format: 'mp3',
      speed: 1.03,
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
