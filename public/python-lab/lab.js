document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runBtn');
  const codeEl = document.getElementById('code');
  const stdinEl = document.getElementById('stdin');
  const outputEl = document.getElementById('output');

  function parseValue(value, variables) {
    const text = value.trim();

    if (/^input\(/.test(text)) {
      const lines = String(stdinEl ? stdinEl.value : '').split(/\r?\n/);
      return lines.shift() || '';
    }

    if (/^int\(input\(/.test(text)) {
      const lines = String(stdinEl ? stdinEl.value : '').split(/\r?\n/);
      return Number(lines.shift() || 0);
    }

    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      return text.slice(1, -1);
    }

    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (/^\[[^\]]*\]$/.test(text)) {
      return text.slice(1, -1).split(',').map(item => parseValue(item, variables));
    }

    if (/^[A-Za-z_]\w*$/.test(text) && Object.prototype.hasOwnProperty.call(variables, text)) {
      return variables[text];
    }

    return evaluateExpression(text, variables);
  }

  function evaluateExpression(expression, variables) {
    let expr = expression.trim();

    expr = expr.replace(/\b([A-Za-z_]\w*)\b/g, (match) => {
      if (Object.prototype.hasOwnProperty.call(variables, match)) {
        const value = variables[match];
        return typeof value === 'number' ? String(value) : JSON.stringify(String(value));
      }
      return match;
    });

    if (!/^[\d\s+\-*/()."',A-Za-z<>=!]+$/.test(expr)) return expression;

    try {
      return Function(`"use strict"; return (${expr});`)();
    } catch (error) {
      return expression;
    }
  }

  function collectVariables(lines) {
    const variables = {};
    let inputLines = String(stdinEl ? stdinEl.value : '').split(/\r?\n/);

    lines.forEach(line => {
      const match = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
      if (!match || line.includes('==')) return;

      const name = match[1];
      const rawValue = match[2].trim();

      if (/^input\(/.test(rawValue)) {
        variables[name] = inputLines.shift() || '';
      } else if (/^int\(input\(/.test(rawValue)) {
        variables[name] = Number(inputLines.shift() || 0);
      } else {
        variables[name] = parseValue(rawValue, variables);
      }
    });

    return variables;
  }

  function splitPrintArguments(text) {
    const args = [];
    let current = '';
    let quote = '';

    for (const char of text) {
      if ((char === '"' || char === "'") && !quote) {
        quote = char;
      } else if (char === quote) {
        quote = '';
      }

      if (char === ',' && !quote) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) args.push(current.trim());
    return args;
  }

  function evaluatePrintArguments(text, variables) {
    return splitPrintArguments(text)
      .map(argument => String(parseValue(argument, variables)))
      .join(' ');
  }

  function runPythonSubset(code) {
    const lines = code
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    const variables = collectVariables(lines);
    const output = [];

    const functionMatch = code.match(/def\s+([A-Za-z_]\w*)\(([^)]*)\):\s*[\r\n]+\s*return\s+(.+)/);
    if (functionMatch) {
      const functionName = functionMatch[1];
      const parameter = functionMatch[2].trim();
      const returnExpression = functionMatch[3].trim();
      lines.forEach(line => {
        const call = line.match(new RegExp(`print\\(${functionName}\\(([^)]*)\\)\\)`));
        if (call) {
          const argument = parseValue(call[1], variables);
          output.push(String(evaluateExpression(returnExpression, { ...variables, [parameter]: argument })));
        }
      });
      if (output.length) return output.join('\n');
    }

    const ifBlock = code.match(/if\s+(.+):\s*[\r\n]+\s*print\((.+)\)\s*[\r\n]+\s*else:\s*[\r\n]+\s*print\((.+)\)/);
    if (ifBlock) {
      const condition = Boolean(evaluateExpression(ifBlock[1], variables));
      output.push(evaluatePrintArguments(condition ? ifBlock[2] : ifBlock[3], variables));
      return output.join('\n');
    }

    const loopBlock = code.match(/for\s+([A-Za-z_]\w*)\s+in\s+range\((\d+),\s*(\d+)\):\s*[\r\n]+\s*print\((.+)\)/);
    if (loopBlock) {
      const name = loopBlock[1];
      const start = Number(loopBlock[2]);
      const end = Number(loopBlock[3]);
      const expression = loopBlock[4];
      for (let value = start; value < end; value++) {
        output.push(evaluatePrintArguments(expression, { ...variables, [name]: value }));
      }
      return output.join('\n');
    }

    const listLoop = code.match(/for\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*):\s*[\r\n]+\s*print\((.+)\)/);
    if (listLoop) {
      const name = listLoop[1];
      const list = variables[listLoop[2]] || [];
      const expression = listLoop[3];
      list.forEach(value => output.push(evaluatePrintArguments(expression, { ...variables, [name]: value })));
      return output.join('\n');
    }

    lines.forEach(line => {
      const printMatch = line.match(/^print\((.*)\)$/);
      if (printMatch) output.push(evaluatePrintArguments(printMatch[1], variables));
    });

    return output.join('\n');
  }

  function runProgram() {
    if (!codeEl || !outputEl || !runBtn) return;
    outputEl.textContent = 'Running...';
    runBtn.disabled = true;

    try {
      const result = runPythonSubset(codeEl.value);
      outputEl.textContent = result || 'No output. Use print() to display output.';
    } catch (error) {
      outputEl.textContent = 'Unable to run this Python example.';
    } finally {
      runBtn.disabled = false;
    }
  }

  if (runBtn) runBtn.addEventListener('click', runProgram);
});
