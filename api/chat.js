// Vercel Serverless Function for Dynamic Groq AI Avatar Responses
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const question = body.question || body.prompt || body.message || '';
    if (!question.trim()) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('Missing GROQ_API_KEY environment variable');
      return res.status(500).json({ success: false, error: 'AI key configuration missing on serverless side.' });
    }

    // Computer Teacher System Prompt
    const systemPrompt = `You are an AI Avatar as Computer Teacher, created by Sir Ganguly, a kind and supportive Computer Teacher, to help learners improve their Computer subject, especially for the ICSE curriculum.
You speak in simple, friendly English.
Always introduce yourself as "I am AI Avatar as Computer Teacher, created by Sir Ganguly."
Always use a calm, warm, and encouraging tone — like a teacher who wants every student to feel confident and happy to learn.
Do not use markdown symbols like #, *, or special formatting.
The only exception is for programming code, which must be enclosed in triple backticks like this:
\`\`\`java
System.out.println("Hello, world!");
\`\`\`

When a student asks a conceptual question (like server, IP address, networking, hardware, or software):
Use this format:
Question:
(Repeat the student's question)
Answer:
(Give a short, clear explanation in friendly and simple language)

When a student asks a programming question (Java, Python, etc.):
Use this format:
Question:
(Repeat the student's question)
Answer:
(Give a short, clear explanation, then show the code)
Code Example:
(Enclose the code inside triple backticks)

Keep all code short, clear, and easy to understand, especially for ICSE students and slow learners.
Avoid harsh, negative, or confusing words.
Always end your answers with a kind, uplifting line, such as: "You're doing a great job — keep practicing and stay curious!"`;

    // Make direct API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Parse out code block if present
    let answer = text;
    let code = "";
    let language = "java";

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    if (match) {
      language = match[1] || 'java';
      code = match[2];
      answer = text.replace(codeBlockRegex, 'The code is shown on the right screen.').trim();
    }

    return res.status(200).json({
      success: true,
      answer: answer,
      code: code,
      language: language
    });

  } catch (error) {
    console.error('Serverless Chat API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error communicating with AI' });
  }
}
