const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const AI_TIMEOUT_MS = 30000
const MAX_HISTORY_ITEMS = 6
const MAX_OUTPUT_TOKENS = 4096

const sessionHistory = new Map()

const TEACHER_PROMPT = `You are Sir Ganguly AI, a friendly computer teacher for school students.

Answer the student's exact question directly. Do not answer a different topic.
If the student asks about selection sort, answer selection sort only. If the student asks about bubble sort, answer bubble sort only.
Keep normal answers short to medium and complete. Give a detailed answer only when the student asks for details.
For programming questions, give a clear explanation first, then one clean working program in a fenced code block.
Use the programming language requested by the student. If no language is requested, use Java.
For board exam program questions, always provide the full required class exactly as asked, including constructor, all specified methods, and main().
When a method is specified as recursive, implement it recursively exactly. For binary-number digit questions stored as an integer, count digits using k % 10 and recurse with k / 10.
Do not stop in the middle of a program. If code is needed, the fenced code block must be complete and closed.
Keep code comments very few. Do not add generic filler or meta instructions.
Never return a placeholder answer.`

function isProgrammingQuestion(question) {
  return /\b(program|class|java|python|constructor|void|int\s+\w+|main\(\)|recursive|recursion|method|function|algorithm|code)\b/i.test(question)
}

function prepareQuestionForModel(question) {
  if (!isProgrammingQuestion(question)) {
    return question
  }

  return `Student question:\n${question}\n\nProgramming answer instructions:\nReturn one short sentence, then one complete fenced code block.\nDo not greet the student.\nDo not give a long explanation before the code.\nThe code must include every class, data member, constructor, method, and main() requested in the question.\nIf the question asks for recursion, use actual recursion in that method.\nClose the fenced code block.`
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY
}

function withTimeout(ms = AI_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { controller, timeout }
}

async function readError(response) {
  try {
    const data = await response.json()
    return data?.error?.message || data?.message || response.statusText
  } catch {
    return response.statusText
  }
}

function normalizeQuestion(input) {
  return String(input || '').replace(/\s+/g, ' ').trim()
}

function getHistory(sessionId) {
  if (!sessionId) return []
  return sessionHistory.get(sessionId) || []
}

function saveHistory(sessionId, question, answer) {
  if (!sessionId) return
  const existing = getHistory(sessionId)
  const next = [...existing, { role: 'user', text: question }, { role: 'assistant', text: answer }]
    .slice(-MAX_HISTORY_ITEMS)
  sessionHistory.set(sessionId, next)
}

function buildGeminiContents(question, history) {
  const contents = history.map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.text }]
  }))

  contents.push({
    role: 'user',
    parts: [{ text: question }]
  })

  return contents
}

function buildOpenAiMessages(question, history) {
  return [
    { role: 'system', content: TEACHER_PROMPT },
    ...history.map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.text
    })),
    { role: 'user', content: question }
  ]
}

async function askGemini(question, history) {
  const key = getGeminiKey()
  if (!key) {
    throw new Error('Gemini API key is not configured')
  }

  const { controller, timeout } = withTimeout()

  try {
    const response = await fetch(`${GEMINI_API_URL}/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: TEACHER_PROMPT }]
        },
        contents: buildGeminiContents(prepareQuestionForModel(question), history),
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: MAX_OUTPUT_TOKENS
        }
      })
    })

    if (!response.ok) {
      throw new Error(await readError(response))
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim()

    if (!text) {
      throw new Error('Gemini returned an empty answer')
    }

    return { answer: text, provider: `gemini:${GEMINI_MODEL}` }
  } finally {
    clearTimeout(timeout)
  }
}

async function askOpenAI(question, history) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OpenAI API key is not configured')
  }

  const { controller, timeout } = withTimeout()

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: buildOpenAiMessages(prepareQuestionForModel(question), history),
        temperature: 0.35,
        max_tokens: MAX_OUTPUT_TOKENS
      })
    })

    if (!response.ok) {
      throw new Error(await readError(response))
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content?.trim()

    if (!text) {
      throw new Error('OpenAI returned an empty answer')
    }

    return { answer: text, provider: `openai:${OPENAI_MODEL}` }
  } finally {
    clearTimeout(timeout)
  }
}

export async function askAI({ question, sessionId }) {
  const cleanQuestion = normalizeQuestion(question)
  if (!cleanQuestion) {
    const error = new Error('Please type or say a question first.')
    error.statusCode = 400
    throw error
  }

  const history = getHistory(sessionId)
  const errors = []

  try {
    const result = await askGemini(cleanQuestion, history)
    saveHistory(sessionId, cleanQuestion, result.answer)
    return result
  } catch (error) {
    errors.push(`Gemini: ${error.message}`)
  }

  try {
    const result = await askOpenAI(cleanQuestion, history)
    saveHistory(sessionId, cleanQuestion, result.answer)
    return result
  } catch (error) {
    errors.push(`OpenAI: ${error.message}`)
  }

  const serviceError = new Error('AI service is temporarily unavailable. Please try again.')
  serviceError.statusCode = 503
  serviceError.details = errors
  throw serviceError
}
