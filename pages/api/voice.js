import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_VOICE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];
const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const MAX_SPEECH_CHARS = 1200;
const conversationHistory = new Map();
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 9000);
const AI_HISTORY_LIMIT = Number(process.env.AI_HISTORY_LIMIT || 4);

function wantsDetailedAnswer(question) {
  return /\b(detail|detailed|explain fully|briefly explain|step by step|difference between|compare|example|examples|program|code|why|how)\b/i.test(String(question || ''));
}

function isCompleteEnough(reply) {
  const text = String(reply || '').trim();
  if (text.length < 90) return false;
  return /[.!?)]$/.test(text);
}

function normalizeQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isProgrammingQuestion(question) {
  return /\b(java|python|c\+\+|cpp|c language|program|programme|coding|code|algorithm|function|class|method|array|loop|sort|search)\b/i.test(String(question || ''));
}

function exactTopicPhrase(question) {
  const normalized = normalizeQuestion(question);
  const knownPhrases = ['selection sort', 'bubble sort', 'insertion sort', 'linear search', 'binary search', 'prime number', 'palindrome', 'fibonacci', 'factorial', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'constructor', 'recursion', 'array', 'loop', 'variable', 'algorithm', 'cpu', 'ram', 'rom'];
  return knownPhrases.find((phrase) => normalized.includes(phrase)) || '';
}

function looksRelevant(question, answer) {
  const text = String(answer || '').toLowerCase();
  if (!isCompleteEnough(answer)) return false;
  if (/here is a simple way to understand it|identify the main term|please send the topic name/i.test(text)) return false;
  const phrase = exactTopicPhrase(question);
  if (phrase && !text.includes(phrase)) return false;
  if (/selection\s*sort/i.test(question) && /bubble\s*sort/i.test(text)) return false;
  if (/bubble\s*sort/i.test(question) && /selection\s*sort/i.test(text)) return false;
  if (isProgrammingQuestion(question) && /\b(program|example|code)\b/i.test(question) && !/```[\s\S]*?```/.test(String(answer || ''))) return false;
  return true;
}

function fallbackAnswer(question) {
  const q = String(question || '').toLowerCase();
  if (/\brecursion\b/.test(q) && /\bjava\b/.test(q)) {
    return 'Recursion in Java is a technique where a method calls itself to solve a problem. It is useful when a problem can be divided into smaller similar sub-problems, such as factorial, Fibonacci series, or tree traversal. Every recursive method must have a base condition to stop the repeated calls; otherwise, it will continue forever and cause a stack overflow error.\n\n' +
'```java\n' +
'public class RecursionExample {\n' +
'    static int factorial(int n) {\n' +
'        if (n == 0 || n == 1) {\n' +
'            return 1;\n' +
'        }\n' +
'        return n * factorial(n - 1);\n' +
'    }\n\n' +
'    public static void main(String[] args) {\n' +
'        int number = 5;\n' +
'        int result = factorial(number);\n' +
'        System.out.println("Factorial of " + number + " is " + result);\n' +
'    }\n' +
'}\n' +
'```\n\n' +
'Output: Factorial of 5 is 120\n\n' +
'Keep learning, you are doing great!';
  }
  if (/\brecursion\b/.test(q)) {
    return 'Recursion is a method of solving a problem where a function calls itself. It works by breaking a large problem into smaller similar problems. A recursive solution must have a base condition to stop the repeated calls. Keep learning, you are doing great!';
  }
  if (/artificial\s+intelligen/.test(q) || /\bai\b/.test(q)) {
    return 'Artificial Intelligence, or AI, is a branch of computer science that helps machines perform tasks that normally need human intelligence. These tasks include learning, reasoning, problem solving, understanding language, recognizing images, and making decisions. For example, a voice assistant understands your question and gives a useful answer, which is an application of AI. AI is used in education, healthcare, search engines, maps, chatbots, robotics, and recommendation systems. In simple words, AI allows a computer system to learn from data and act intelligently. Keep learning, you are doing great!';
  }
  if (/selection\s*sort/.test(q) && /\bjava\b/.test(q)) {
    return 'Selection sort is a simple sorting technique that repeatedly selects the smallest element from the unsorted part of an array and places it at the beginning. In the first pass, it finds the smallest element and swaps it with the first element. In the second pass, it finds the smallest element from the remaining part and swaps it with the second element. This continues until the array is sorted. Its time complexity is O(n^2), so it is easy to learn but not efficient for large data.\n\n' +
'```java\n' +
'public class SelectionSortExample {\n' +
'    public static void main(String[] args) {\n' +
'        int[] numbers = {5, 2, 8, 1, 3};\n\n' +
'        for (int i = 0; i < numbers.length - 1; i++) {\n' +
'            int minIndex = i;\n\n' +
'            for (int j = i + 1; j < numbers.length; j++) {\n' +
'                if (numbers[j] < numbers[minIndex]) {\n' +
'                    minIndex = j;\n' +
'                }\n' +
'            }\n\n' +
'            int temp = numbers[i];\n' +
'            numbers[i] = numbers[minIndex];\n' +
'            numbers[minIndex] = temp;\n' +
'        }\n\n' +
'        for (int number : numbers) {\n' +
'            System.out.print(number + " ");\n' +
'        }\n' +
'    }\n' +
'}\n' +
'```\n\n' +
'Output: 1 2 3 5 8\n\n' +
'Keep learning, you are doing great!';
  }
  if (/selection\s*sort/.test(q)) {
    return 'Selection sort is a sorting algorithm that repeatedly selects the smallest element from the unsorted part and places it in its correct position. It is simple to understand, but its time complexity is O(n^2), so it is not suitable for large data. Keep learning, you are doing great!';
  }
  if (/bubble\s*sort/.test(q) && /\bjava\b/.test(q)) {
    return 'Bubble sort is a simple sorting technique that arranges elements by repeatedly comparing two adjacent elements and swapping them if they are in the wrong order. In each pass, the largest unsorted element moves to its correct position at the end of the array. It is easy to understand, but it is not efficient for large data because its average and worst-case time complexity is O(n^2).\n\n' +
'```java\n' +
'public class BubbleSortExample {\n' +
'    public static void main(String[] args) {\n' +
'        int[] numbers = {5, 2, 8, 1, 3};\n\n' +
'        for (int i = 0; i < numbers.length - 1; i++) {\n' +
'            for (int j = 0; j < numbers.length - 1 - i; j++) {\n' +
'                if (numbers[j] > numbers[j + 1]) {\n' +
'                    int temp = numbers[j];\n' +
'                    numbers[j] = numbers[j + 1];\n' +
'                    numbers[j + 1] = temp;\n' +
'                }\n' +
'            }\n' +
'        }\n\n' +
'        for (int number : numbers) {\n' +
'            System.out.print(number + " ");\n' +
'        }\n' +
'    }\n' +
'}\n' +
'```\n\n' +
'Output: 1 2 3 5 8\n\n' +
'Keep learning, you are doing great!';
  }
  if (/bubble\s*sort/.test(q)) {
    return 'Bubble sort is a basic sorting algorithm. It repeatedly compares adjacent elements and swaps them when they are in the wrong order. After each pass, the largest remaining element reaches its correct position. Its average and worst-case time complexity is O(n^2), so it is mainly useful for learning sorting logic rather than sorting large data. Keep learning, you are doing great!';
  }
  if (/\bram\b|random access memory/.test(q)) {
    return 'RAM stands for Random Access Memory. It is the temporary memory of a computer where data and programs are kept while they are being used. RAM is fast, so the CPU can quickly read and write data from it. When the computer is switched off, the data in RAM is lost, so it is called volatile memory. More RAM helps a computer run more programs smoothly at the same time. Keep learning, you are doing great!';
  }
  if (/\brom\b|read only memory/.test(q)) {
    return 'ROM stands for Read Only Memory. It stores important instructions needed to start a computer, such as the boot program. ROM is non-volatile, so its data remains even when the power is switched off. Unlike RAM, ROM is usually not changed during normal use. Keep learning, you are doing great!';
  }
  if (/\bcpu\b|processor/.test(q)) {
    return 'CPU stands for Central Processing Unit. It is often called the brain of the computer because it processes instructions and controls other parts of the system. The CPU performs calculations, makes decisions, and runs programs. Its main parts include the Control Unit, ALU, and registers. Keep learning, you are doing great!';
  }
  if (/\balgorithm\b/.test(q)) {
    return 'An algorithm is a step-by-step method for solving a problem. In computer science, we write algorithms before coding so that the logic is clear. A good algorithm should be correct, finite, and easy to understand. For example, the steps for adding two numbers are: take two inputs, add them, and display the result. Keep learning, you are doing great!';
  }
  if (/\bloop\b|for loop|while loop/.test(q)) {
    return 'A loop is used to repeat a set of instructions again and again. It helps us avoid writing the same code many times. A for loop is useful when we know how many times to repeat, while a while loop is useful when repetition depends on a condition. Keep learning, you are doing great!';
  }
  if (/\bvariable\b/.test(q)) {
    return 'A variable is a named memory location used to store data in a program. Its value can change while the program runs. For example, in Java, int marks = 95; creates a variable named marks that stores an integer value. Variables make programs flexible and reusable. Keep learning, you are doing great!';
  }
  return `I could not get a strong live AI response right now, but I will still answer directly. ${String(question || '').trim()} is an important computer applications topic. It means understanding the concept, its purpose, and one practical example. Please try the same question again after a moment for a richer OpenAI or Gemini explanation. Keep learning, you are doing great!`;
}

function hasFastLocalAnswer(question) {
  const q = String(question || '').toLowerCase();
  return /\brecursion\b|selection\s*sort|bubble\s*sort|\bram\b|random access memory|\brom\b|read only memory|\bcpu\b|processor|\balgorithm\b|\bloop\b|for loop|while loop|\bvariable\b/.test(q);
}

async function callGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const personality = `You are Susanto Ganguly, known as Sir Ganguly, a supportive computer teacher.
Speak in simple, friendly English.
Students ask questions about computer science following the ICSE curriculum.

For programming language questions, explain the idea first and include one complete working code example inside a fenced code block with the language tag.
For conceptual questions, give a direct detailed answer with definitions, key points, examples, and differences when useful.

If a question is off-topic, politely say:
"That's a great question, but let's focus on computer applications as per the ICSE curriculum."

Begin directly with the answer. Do not start with long greetings like "Hello there" or "fantastic question".
Answer the exact question. Never give generic advice about how to answer.
Always be positive, humble, and encouraging.
If asked about money or financial topics, respond that this is for educational purposes only and return to computer science.
End every reply with a short motivational note such as
“Keep learning, you’re doing great!”`;

  const answerDepth = wantsDetailedAnswer(question)
    ? 'The student is asking for explanation. Give a complete detailed answer with simple examples or steps when useful.'
    : 'Give a short but complete answer in 4 to 7 clear sentences. Do not stop in the middle of a sentence. Do not make it too long unless the student asks for detail.';

  const text = `${personality}

${answerDepth}

Student question: ${question}`;

  let lastError = null;
  for (const modelName of GEMINI_VOICE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: wantsDetailedAnswer(question) ? 1200 : 420,
          temperature: 0.7,
        },
      });
      const result = await model.generateContent(text);
      const reply = result.response.text();
      if (isCompleteEnough(reply)) return reply.trim();
      if (reply && reply.trim()) {
        const continuation = await model.generateContent(`${text}

Your previous answer was incomplete:
${reply}

Now provide the complete final answer only.`);
        const completedReply = continuation.response.text();
        if (isCompleteEnough(completedReply)) return completedReply.trim();
      }
      lastError = new Error(`Incomplete Gemini reply from ${modelName}`);
      console.warn(lastError.message);
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
      model: 'tts-1',
      voice: voice || 'verse',
      input: text,
      response_format: 'mp3',
      speed: 1.03
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
  const answerDepth = wantsDetailedAnswer(question)
    ? 'Give a complete detailed answer with simple examples or steps when useful.'
    : 'Give a short but complete answer in 4 to 7 clear sentences.';
  const programming = /\b(java|python|c\+\+|cpp|c language|program|programme|coding|code|algorithm|function|class|method|array|loop|sort|search)\b/i.test(question)
    ? 'This is a programming question. Include a clear explanation first, then provide one complete working code example inside a fenced code block with the correct language tag.'
    : 'If code is not needed, do not add code.';

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
          content: `You are Sir Ganguly, a supportive computer science teacher for students. Begin directly with the answer. Answer the student's exact question. Never give generic advice about how to answer. Use simple English. ${programming} ${answerDepth} Avoid markdown tables. End with one short encouraging sentence.`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: wantsDetailedAnswer(question) ? 900 : 280,
      temperature: 0.5,
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
      reply = await callOpenAIText(question);
      if (!looksRelevant(question, reply)) throw new Error('OpenAI answer did not match the question');
    } catch (openAiTextErr) {
      console.error('OpenAI text failed, trying Gemini:', openAiTextErr);
      try {
        reply = await callGemini(question);
        if (!looksRelevant(question, reply)) throw new Error('Gemini answer did not match the question');
      } catch (geminiErr) {
        console.error('Gemini answer failed, returning fallback answer:', geminiErr);
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
