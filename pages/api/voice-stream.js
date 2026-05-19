export const config = {
  api: {
    bodyParser: {
      sizeLimit: '64kb',
    },
  },
};

const answerCache = new Map();
const conversationLog = [];
const conversationHistory = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODELS = (process.env.GEMINI_MODEL || 'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-flash-latest')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 9000);
const AI_HISTORY_LIMIT = Number(process.env.AI_HISTORY_LIMIT || 4);
const FIREBASE_DATABASE_URL = (process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '').replace(/\/$/, '');

function wantsDetailedAnswer(question) {
  return /\b(detail|detailed|explain fully|step by step|difference between|compare|why|how)\b/i.test(String(question || ''));
}

function buildSystemPrompt(question) {
  const depth = wantsDetailedAnswer(question)
    ? 'Give a medium answer in 6 to 9 clear sentences or short bullets. Add steps only when needed.'
    : 'Give a short but complete answer in 3 to 5 clear sentences.';
  const programming = isProgrammingQuestion(question)
    ? 'This is a programming question. Give a short explanation first, then one complete working code example inside a fenced code block with the correct language tag. Keep code clean and add only essential comments, preferably none.'
    : 'If code is not needed, do not add code.';

  return `You are Susanto Ganguly, known as Sir Ganguly, a warm, accurate AI teacher for ICSE students.
Begin directly with the answer.
Use simple English.
Avoid markdown tables.
Keep the answer medium or short unless the student explicitly asks for detail.
Answer the student's exact question. Never give generic advice about how to answer.
Do not change the topic. If the question asks selection sort, answer selection sort; if it asks bubble sort, answer bubble sort.
You can answer any educational topic, not only computer science.
${programming}
${depth}
End with one short encouraging sentence.`;
}

function getConversationHistory(sessionId = 'default') {
  return conversationHistory.get(sessionId) || [];
}

function addToConversationHistory(sessionId = 'default', role, content) {
  const history = getConversationHistory(sessionId);
  history.push({ role, content: String(content || '').slice(0, 1600), timestamp: Date.now() });
  if (history.length > 10) history.splice(0, history.length - 10);
  conversationHistory.set(sessionId, history);
}

function cleanupConversationHistory() {
  const oneHourAgo = Date.now() - 1000 * 60 * 60;
  for (const [key, history] of conversationHistory.entries()) {
    const last = history[history.length - 1];
    if (!last || last.timestamp < oneHourAgo) conversationHistory.delete(key);
  }
}

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), AI_TIMEOUT_MS)),
  ]);
}

function normalizeQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .replace(/\b(what|is|are|the|a|an|define|explain|please|tell|me|about|briefly|detail|detailed)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return new Set(normalizeQuestion(text).split(' ').filter(Boolean));
}

function similarity(a, b) {
  const left = tokenize(a);
  const right = tokenize(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });
  return intersection / Math.max(left.size, right.size);
}

function isProgrammingQuestion(question) {
  return /\b(java|python|c\+\+|cpp|c language|program|programme|coding|code|algorithm|function|class|method|array|loop|sort|search)\b/i.test(String(question || ''));
}

function extractImportantTerms(question) {
  return normalizeQuestion(question)
    .split(' ')
    .filter((term) => term.length > 2 && !['give', 'example', 'program', 'code', 'with', 'using', 'one'].includes(term));
}

function exactTopicPhrase(question) {
  const normalized = normalizeQuestion(question);
  const knownPhrases = [
    'selection sort',
    'bubble sort',
    'insertion sort',
    'linear search',
    'binary search',
    'prime number',
    'palindrome',
    'fibonacci',
    'factorial',
    'inheritance',
    'polymorphism',
    'encapsulation',
    'abstraction',
    'constructor',
    'recursion',
    'array',
    'loop',
    'variable',
    'algorithm',
    'cpu',
    'ram',
    'rom',
  ];
  return knownPhrases.find((phrase) => normalized.includes(phrase)) || '';
}

function splitAnswerParts(answer) {
  const text = String(answer || '');
  const codeMatch = text.match(/```([\w+-]*)\n?([\s\S]*?)```/);
  if (!codeMatch) return { explanation: text.trim(), code: '', language: '' };
  return {
    explanation: text.replace(codeMatch[0], '').trim(),
    code: codeMatch[2].trim(),
    language: codeMatch[1] || '',
  };
}

function removeCodeCommentOnlyLines(answer) {
  return String(answer || '').replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (match, language, code) => {
    const cleanedCode = code
      .split('\n')
      .filter((line) => !/^\s*(#|\/\/)\s+/.test(line))
      .join('\n')
      .trim();
    return `\`\`\`${language || ''}\n${cleanedCode}\n\`\`\``;
  });
}

function cachePayload(question, answer, provider) {
  const parts = splitAnswerParts(answer);
  return {
    question,
    normalizedQuestion: normalizeQuestion(question),
    answer,
    explanation: parts.explanation,
    code: parts.code,
    language: parts.language,
    provider,
    source: provider,
    timestamp: Date.now(),
  };
}

function findLocalCache(question) {
  const now = Date.now();
  let best = null;
  for (const [key, item] of answerCache.entries()) {
    if (!item || now - item.timestamp > CACHE_TTL_MS) {
      answerCache.delete(key);
      continue;
    }
    const score = key === normalizeQuestion(question) ? 1 : similarity(question, item.question || item.normalizedQuestion);
    if (score >= 0.72 && (!best || score > best.score)) {
      best = { ...item, score };
    }
  }
  return best;
}

async function readFirebaseCache(question) {
  if (!FIREBASE_DATABASE_URL) return null;
  const response = await fetch(`${FIREBASE_DATABASE_URL}/aiTeacherCache.json?orderBy="timestamp"&limitToLast=60`);
  if (!response.ok) throw new Error(`Firebase read failed: ${response.status}`);
  const data = await response.json();
  if (!data) return null;
  let best = null;
  for (const [id, item] of Object.entries(data)) {
    const score = similarity(question, item.question || item.normalizedQuestion || '');
    if (score >= 0.72 && (!best || score > best.score)) {
      best = { ...item, id, score };
    }
  }
  return best;
}

async function writeFirebase(path, payload) {
  if (!FIREBASE_DATABASE_URL) return;
  try {
    await fetch(`${FIREBASE_DATABASE_URL}/${path}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('firebase-write-failed', error.message);
  }
}

function saveLocalCache(payload) {
  answerCache.set(payload.normalizedQuestion, payload);
}

async function saveAnswer(question, answer, provider) {
  const payload = cachePayload(question, answer, provider);
  saveLocalCache(payload);
  await writeFirebase('aiTeacherCache', payload);
  return payload;
}

async function logConversation(question, answer, provider, source) {
  const entry = {
    question,
    answer,
    provider,
    source,
    timestamp: Date.now(),
  };
  conversationLog.push(entry);
  if (conversationLog.length > 200) conversationLog.shift();
  await writeFirebase('aiTeacherConversations', entry);
}

async function completeOpenAIAnswer(question, sessionId = 'default') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  const history = getConversationHistory(sessionId).slice(-AI_HISTORY_LIMIT);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.5,
      max_tokens: wantsDetailedAnswer(question) || isProgrammingQuestion(question) ? 700 : 260,
      messages: [
        { role: 'system', content: buildSystemPrompt(question) },
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: 'user', content: question },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI answer error: ${errorText || response.status}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('OpenAI returned no answer');
  return removeCodeCommentOnlyLines(reply);
}

async function completeGeminiAnswer(question, sessionId = 'default') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const history = getConversationHistory(sessionId).slice(-AI_HISTORY_LIMIT);
  const recentConversation = history.length
    ? history.map((item) => `${item.role}: ${item.content}`).join('\n')
    : 'No previous conversation.';
  const prompt = `${buildSystemPrompt(question)}

Recent conversation for context only:
${recentConversation}

Student question: ${question}`;

  const errors = [];
  const needsCode = isProgrammingQuestion(question) && /\b(program|example|code)\b/i.test(question);
  for (const modelName of GEMINI_MODELS) {
    try {
      const requestGemini = async (text, maxOutputTokens) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              maxOutputTokens,
              temperature: 0.45,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join('')
          .trim() || '';
      };

      const maxTokens = wantsDetailedAnswer(question) || needsCode ? 1300 : 520;
      let reply = await requestGemini(prompt, maxTokens);

      if (reply && (!looksComplete(reply) || (needsCode && !/```[\s\S]*?```/.test(reply)))) {
        reply = await requestGemini(`${prompt}

Your previous answer was incomplete or did not include the requested code:
${reply}

Now provide the complete final answer from the beginning. Keep it medium/short. If code is required, include one complete working code block with minimal comments. Do not stop halfway.`, maxTokens);
      }

      reply = reply
        .replace(/^(hello there!?|hello!?|hi!?)[\s,!.:-]*/i, '')
        .replace(/^i'?m sir ganguly[^\n.]*[.\n]\s*/i, '')
        .trim();

      if (reply) return { text: removeCodeCommentOnlyLines(reply), modelName };
      errors.push(`${modelName}: empty response`);
    } catch (error) {
      errors.push(`${modelName}: ${error.message}`);
    }
  }

  throw new Error(errors.join(' | '));
}

function looksComplete(text) {
  const answer = String(text || '').trim();
  return answer.length >= 120 && /[.!?)]$/.test(answer);
}

function looksRelevant(question, answer) {
  const text = String(answer || '').toLowerCase();
  if (!looksComplete(answer)) return false;
  if (/here is a simple way to understand it|identify the main term|please send the topic name/i.test(text)) return false;
  const phrase = exactTopicPhrase(question);
  if (phrase && !text.includes(phrase)) return false;
  if (/selection\s*sort/i.test(question) && /bubble\s*sort/i.test(text)) return false;
  if (/bubble\s*sort/i.test(question) && /selection\s*sort/i.test(text)) return false;
  if (isProgrammingQuestion(question) && /\b(program|example|code)\b/i.test(question) && !/```[\s\S]*?```/.test(String(answer || ''))) {
    return false;
  }
  if (phrase) return true;
  if (/bubble sort/i.test(question) && /bubble sort|sorting|adjacent|swap/i.test(text)) return true;
  if (/selection sort/i.test(question) && /selection sort|minimum|smallest|select/i.test(text)) return true;
  return true;
}

function canShowProviderAnswer(question, answer) {
  const text = String(answer || '').toLowerCase().trim();
  if (text.length < 30) return false;
  if (/here is a simple way to understand it|identify the main term|please send the topic name/i.test(text)) return false;
  if (/selection\s*sort/i.test(question) && /bubble\s*sort/i.test(text)) return false;
  if (/bubble\s*sort/i.test(question) && /selection\s*sort/i.test(text)) return false;
  return true;
}

function localTeachingAnswer(question) {
  const q = String(question || '').toLowerCase();
  if (/\bpython\b/.test(q) && /\b(add|sum)\b/.test(q) && /\bdigits?\b/.test(q)) {
    return 'To add all the digits of any number in Python, we can repeatedly take the last digit using modulus `% 10`, add it to a sum, and then remove the last digit using integer division `// 10`. This continues until the number becomes 0. For example, if the number is 456, the sum is 4 + 5 + 6 = 15.\n\n' +
'```python\n' +
'num = int(input("Enter any number: "))\n' +
'sum_digits = 0\n' +
'\n' +
'num = abs(num)\n' +
'\n' +
'while num > 0:\n' +
'    digit = num % 10\n' +
'    sum_digits = sum_digits + digit\n' +
'    num = num // 10\n' +
'\n' +
'print("Sum of digits =", sum_digits)\n' +
'```\n\n' +
'Example:\n' +
'Input: 456\n' +
'Output: Sum of digits = 15\n\n' +
'Keep learning, you are doing great!';
  }
  if (/\brecursion\b/.test(q) && /\bjava\b/.test(q)) {
    return 'Recursion in Java is a technique where a method calls itself to solve a problem. It is useful when a problem can be divided into smaller similar sub-problems, such as factorial, Fibonacci series, or tree traversal. Every recursive method must have a base condition to stop the repeated calls; otherwise, it will continue forever and cause a stack overflow error.\n\n' +
'Important parts of recursion:\n' +
'1. Base condition: stops the recursion.\n' +
'2. Recursive call: the method calls itself with a smaller or simpler input.\n' +
'3. Progress toward the base condition: each call should move closer to stopping.\n\n' +
'Example: Factorial using recursion\n\n' +
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
'Working steps:\n' +
'1. Start from the first position of the array.\n' +
'2. Find the smallest element in the unsorted part of the array.\n' +
'3. Swap it with the current position.\n' +
'4. Move to the next position and repeat until the array is sorted.\n\n' +
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
'        System.out.println("Sorted array:");\n' +
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
    return 'Bubble sort is a simple sorting technique that arranges elements by repeatedly comparing two adjacent elements and swapping them if they are in the wrong order. In each pass, the largest unsorted element moves to its correct position at the end of the array. It is easy to understand, but it is not efficient for large data because its average and worst-case time complexity is O(n^2). It is useful for learning sorting logic and nested loops.\n\n' +
'Working steps:\n' +
'1. Start from the first element of the array.\n' +
'2. Compare the current element with the next element.\n' +
'3. If the current element is greater, swap them.\n' +
'4. Repeat this for all elements in multiple passes until the array becomes sorted.\n\n' +
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
'        System.out.println("Sorted array:");\n' +
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
    return `Bubble sort is a basic sorting algorithm. It repeatedly compares adjacent elements and swaps them when they are in the wrong order. After each pass, the largest remaining element reaches its correct position. Its average and worst-case time complexity is O(n^2), so it is mainly useful for learning sorting logic rather than sorting large data. Keep learning, you are doing great!`;
  }
  if (/\bram\b|random access memory/.test(q)) {
    return `RAM stands for Random Access Memory. It is the temporary memory of a computer where data and programs are kept while they are being used. RAM is fast, so the CPU can quickly read and write data from it. When the computer is switched off, the data in RAM is lost, so it is called volatile memory. More RAM helps a computer run more programs smoothly at the same time. Keep learning, you are doing great!`;
  }
  if (/\brom\b|read only memory/.test(q)) {
    return `ROM stands for Read Only Memory. It stores important instructions needed to start a computer, such as the boot program. ROM is non-volatile, so its data remains even when the power is switched off. Unlike RAM, ROM is usually not changed during normal use. Keep learning, you are doing great!`;
  }
  if (/\bcpu\b|processor/.test(q)) {
    return `CPU stands for Central Processing Unit. It is often called the brain of the computer because it processes instructions and controls other parts of the system. The CPU performs calculations, makes decisions, and runs programs. Its main parts include the Control Unit, ALU, and registers. Keep learning, you are doing great!`;
  }
  if (/\balgorithm\b/.test(q)) {
    return `An algorithm is a step-by-step method for solving a problem. In computer science, we write algorithms before coding so that the logic is clear. A good algorithm should be correct, finite, and easy to understand. For example, the steps for adding two numbers are: take two inputs, add them, and display the result. Keep learning, you are doing great!`;
  }
  if (/\bloop\b|for loop|while loop/.test(q)) {
    return `A loop is used to repeat a set of instructions again and again. It helps us avoid writing the same code many times. A for loop is useful when we know how many times to repeat, while a while loop is useful when repetition depends on a condition. Keep learning, you are doing great!`;
  }
  if (/\bvariable\b/.test(q)) {
    return `A variable is a named memory location used to store data in a program. Its value can change while the program runs. For example, in Java, int marks = 95; creates a variable named marks that stores an integer value. Variables make programs flexible and reusable. Keep learning, you are doing great!`;
  }

  const topic = String(question || '').trim().replace(/[?.!]+$/, '');
  if (/photosynthesis/i.test(q)) {
    return 'Photosynthesis is the process by which green plants make their own food using sunlight. The leaves contain chlorophyll, which captures light energy. Plants take in carbon dioxide from the air and water from the soil, then use sunlight to make glucose, which is food for the plant. Oxygen is released as a by-product. In simple words, photosynthesis helps plants prepare food and also gives oxygen to living beings. Keep learning, you are doing great!';
  }

  return `${topic} means the main idea or concept asked in your question. A good answer should explain its definition, purpose, working, and one example. In simple words, first understand what it is, then why it is used, and finally where it is applied in real life or in a program. If you ask the topic with subject name or class level, I can explain it more exactly with examples. Keep learning, you are doing great!`;
}

function hasFastLocalAnswer(question) {
  const q = String(question || '').toLowerCase();
  return /\bpython\b.*\b(add|sum)\b.*\bdigits?\b|\bdigits?\b.*\b(add|sum)\b.*\bpython\b|\brecursion\b|selection\s*sort|bubble\s*sort|\bram\b|random access memory|\brom\b|read only memory|\bcpu\b|processor|\balgorithm\b|\bloop\b|for loop|while loop|\bvariable\b/.test(q);
}

function canUseCache(question, cachedQuestion, cachedAnswer, score) {
  if (!looksRelevant(question, cachedAnswer)) return false;
  const requestedPhrase = exactTopicPhrase(question);
  const cachedPhrase = exactTopicPhrase(cachedQuestion || cachedAnswer);
  if (requestedPhrase || cachedPhrase) return requestedPhrase === cachedPhrase;
  return score >= 0.9;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, sessionId = 'default' } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    cleanupConversationHistory();
    addToConversationHistory(sessionId, 'user', question);
    console.log('voice-stream:start', { length: question.length, sessionId, openai: !!process.env.OPENAI_API_KEY, gemini: !!process.env.GEMINI_API_KEY });
    const openAiAnswer = await withTimeout(completeOpenAIAnswer(question, sessionId), 'OpenAI');
    console.log('voice-stream:openai-response', openAiAnswer.slice(0, 240));
    if (!canShowProviderAnswer(question, openAiAnswer)) throw new Error(`OpenAI weak answer: ${openAiAnswer.length}`);
    addToConversationHistory(sessionId, 'assistant', openAiAnswer);
    await saveAnswer(question, openAiAnswer, 'openai');
    await logConversation(question, openAiAnswer, 'openai', 'openai');
    res.setHeader('X-AI-Source', 'openai');
    res.write(openAiAnswer);
    console.log('voice-stream:openai-complete');
  } catch (openAiError) {
    console.error('voice-stream:openai-failed', openAiError.message);
    try {
      const fallback = await withTimeout(completeGeminiAnswer(question, sessionId), 'Gemini');
      console.log('voice-stream:gemini-response', fallback.text.slice(0, 240));
      const answer = canShowProviderAnswer(question, fallback.text) ? fallback.text : localTeachingAnswer(question);
      const provider = canShowProviderAnswer(question, fallback.text) ? `gemini:${fallback.modelName}` : 'local';
      addToConversationHistory(sessionId, 'assistant', answer);
      await saveAnswer(question, answer, provider);
      await logConversation(question, answer, provider, provider.startsWith('gemini:') ? provider : 'local-fallback');
      res.setHeader('X-AI-Source', provider.startsWith('gemini:') ? provider : 'local-fallback');
      res.write(answer);
      console.log('voice-stream:gemini-complete');
    } catch (geminiError) {
      console.error('voice-stream:gemini-failed', geminiError.message);
      const answer = localTeachingAnswer(question);
      addToConversationHistory(sessionId, 'assistant', answer);
      await saveAnswer(question, answer, 'local');
      await logConversation(question, answer, 'local', 'local-fallback');
      res.setHeader('X-AI-Source', 'local-fallback');
      res.write(answer);
    }
  } finally {
    res.end();
  }
}
