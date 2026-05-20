const CODE_BLOCK_PATTERN = /```([a-zA-Z0-9+#.-]*)\s*\n?([\s\S]*?)```/
const OPEN_CODE_BLOCK_PATTERN = /```([a-zA-Z0-9+#.-]*)\s*\n?([\s\S]*)$/

function removeCodeCommentNoise(code, language) {
  const lang = String(language || '').toLowerCase()
  let withoutBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '')
  if (lang === 'python') {
    withoutBlockComments = withoutBlockComments
      .replace(/^\s*"""[\s\S]*?"""\s*/gm, '')
      .replace(/^\s*'''[\s\S]*?'''\s*/gm, '')
  }

  return withoutBlockComments
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('//') || trimmed.startsWith('#')) return ''
      if (lang === 'python') return line.replace(/\s+#.*$/, '')
      return line.replace(/\s+\/\/.*$/, '')
    })
    .filter((line, index, lines) => line.trim() || (index > 0 && lines[index - 1].trim()))
    .join('\n')
    .trim()
}

export function splitAnswerAndCode(rawAnswer) {
  const answer = String(rawAnswer || '').trim()
  const match = answer.match(CODE_BLOCK_PATTERN)

  if (!match) {
    const openMatch = answer.match(OPEN_CODE_BLOCK_PATTERN)
    if (openMatch) {
      const language = (openMatch[1] || '').trim().toLowerCase()
      const code = removeCodeCommentNoise((openMatch[2] || '').trim(), language)
      const explanation = answer
        .replace(openMatch[0], '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      return {
        answer: explanation || 'Here is the complete program:',
        code,
        language
      }
    }

    return {
      answer,
      code: '',
      language: ''
    }
  }

  const language = (match[1] || '').trim().toLowerCase()
  const code = removeCodeCommentNoise((match[2] || '').trim(), language)
  const explanation = answer
    .replace(match[0], '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return {
    answer: explanation || 'Here is the program:',
    code,
    language
  }
}
