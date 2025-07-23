// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Ensure Gemini key is set
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing!');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai'
});

// Load system prompt from external file for easier editing and avoid quoting issues
const PROMPT_PATH = path.join(__dirname, 'system_prompt.txt');
let SYSTEM_PROMPT;
try {
  SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, 'utf8').trim();
} catch (err) {
  console.error(`❌ Failed to load system prompt at ${PROMPT_PATH}:`, err);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.send('✅ Gemini (Sir Ganguly) backend is live'));

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message.trim() }
      ],
      temperature: 0.6,
      max_tokens: 500  // Increased token limit for longer snippets
    });

    const reply = response.choices[0].message.content.trim();
    res.json({ reply });

  } catch (err) {
    console.error('Gemini API error', err);
    res.status(500).json({ error: 'AI service error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));

// Note: Create a 'system_prompt.txt' in the same directory with your system prompt text.
