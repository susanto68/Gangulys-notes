import { askAI } from '../services/aiService.js';
import { splitAnswerAndCode } from '../utils/answerParser.js';

const FRIENDLY_ERROR = 'AI service is temporarily unavailable. Please try again.';

function getQuestion(body) {
  return String(body?.question || body?.prompt || body?.message || '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const question = getQuestion(req.body || {});

  if (!question) {
    return res.status(400).json({
      success: false,
      error: 'Please type or say a question first.'
    });
  }

  try {
    const result = await askAI({
      question,
      avatarType: req.body?.avatarType || 'computer-teacher',
      sessionId: req.body?.sessionId || ''
    });

    const parsed = splitAnswerAndCode(result.answer);
    const answer = parsed.code && parsed.answer.length < 60
      ? `Here is the complete ${parsed.language ? parsed.language.toUpperCase() : ''} program. The full code is shown in the Code Snippet box.`
      : parsed.answer;

    return res.status(200).json({
      success: true,
      answer,
      code: parsed.code,
      language: parsed.language,
      provider: result.provider,
      part1: answer,
      part2: parsed.code,
      reply: answer
    });
  } catch (error) {
    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 503;

    return res.status(status).json({
      success: false,
      error: status === 503 ? FRIENDLY_ERROR : error.message
    });
  }
}
