// Local Development Server for Classic Notes and Dynamic Groq AI Avatar
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Simple custom .env parser to keep server.js zero-dependency
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '_modern_ai_project_archive', '.env'),
    path.join(__dirname, '_modern_ai_project_archive', '.env.local')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const index = trimmed.indexOf('=');
          if (index !== -1) {
            const key = trimmed.substring(0, index).trim();
            let val = trimmed.substring(index + 1).trim();
            // Remove surrounding quotes
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      } catch (e) {
        console.error(`Error loading env file: ${envPath}`, e);
      }
    }
  }
}

loadEnv();

// Helper to determine Content-Type
function getContentType(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg'
  };
  return mimeTypes[extname] || 'application/octet-stream';
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Route: POST /api/chat
  if (req.method === 'POST' && (req.url === '/api/chat' || req.url === '/api/chat/')) {
    let bodyText = '';
    req.on('data', chunk => {
      bodyText += chunk.toString();
    });

    req.on('end', async () => {
      try {
        let body = {};
        if (bodyText) {
          body = JSON.parse(bodyText);
        }

        const question = body.question || body.prompt || body.message || '';
        if (!question.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Question is required' }));
          return;
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'GROQ_API_KEY environment variable is missing. Please add it to your local environment or .env file.' }));
          return;
        }

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

        // Direct fetch to Groq endpoint
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

        if (!groqResponse.ok) {
          const errorText = await groqResponse.text();
          throw new Error(`Groq API error ${groqResponse.status}: ${errorText}`);
        }

        const data = await groqResponse.json();
        const text = data.choices?.[0]?.message?.content || '';

        // Parse out code block
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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          answer: answer,
          code: code,
          language: language
        }));

      } catch (err) {
        console.error('Local Server AI Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Error communicating with AI' }));
      }
    });
    return;
  }

  // 2. Serve Static Files
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  // Decode URL parameters (like %20 for spaces in PDFs)
  reqPath = decodeURIComponent(reqPath);
  
  // Clean query strings
  reqPath = reqPath.split('?')[0];

  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 page fallback
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const contentType = getContentType(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Classic Notes Portal running at: http://localhost:${PORT}`);
  console.log(`🤖 AI Avatar API endpoint active at: http://localhost:${PORT}/api/chat`);
  console.log(`Press Ctrl+C to stop the server\n`);
});
