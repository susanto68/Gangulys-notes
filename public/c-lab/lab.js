document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runBtn');
  const codeEl = document.getElementById('code');
  const outputEl = document.getElementById('output');

  function clean(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  function splitArgs(text) {
    const args = [];
    let current = '';
    let quote = '';
    for (const char of text) {
      if ((char === '"' || char === "'") && !quote) quote = char;
      else if (char === quote) quote = '';
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

  function collectVariables(code) {
    const variables = {};
    code.split(/\r?\n/).forEach(line => {
      let match = line.match(/^\s*int\s+([A-Za-z_]\w*)\[\]\s*=\s*\{([^}]*)\};/);
      if (match) {
        variables[match[1]] = match[2].split(',').map(value => Number(value.trim())).filter(value => !Number.isNaN(value));
        return;
      }

      match = line.match(/^\s*(?:int|float|double)\s+([^();]+);/);
      if (match) {
        match[1].split(',').forEach(part => {
          const valueMatch = part.trim().match(/^([A-Za-z_]\w*)\s*=\s*([-]?\d+(?:\.\d+)?)$/);
          if (valueMatch) variables[valueMatch[1]] = Number(valueMatch[2]);
        });
        return;
      }

      match = line.match(/^\s*char\s+([A-Za-z_]\w*)\s*=\s*'([^']*)';/);
      if (match) variables[match[1]] = match[2];
    });
    return variables;
  }

  function evalExpr(expression, variables) {
    let expr = expression.trim();
    const arrayMatch = expr.match(/^([A-Za-z_]\w*)\s*\[\s*([A-Za-z_]\w*)\s*\]$/);
    if (arrayMatch) {
      const list = variables[arrayMatch[1]] || [];
      return list[variables[arrayMatch[2]] || 0];
    }
    const binaryMatch = expr.match(/^([A-Za-z_]\w*)\s*([+\-*/])\s*([A-Za-z_]\w*)$/);
    if (binaryMatch && Object.prototype.hasOwnProperty.call(variables, binaryMatch[1]) && Object.prototype.hasOwnProperty.call(variables, binaryMatch[3])) {
      const left = Number(variables[binaryMatch[1]]);
      const right = Number(variables[binaryMatch[3]]);
      if (binaryMatch[2] === '+') return left + right;
      if (binaryMatch[2] === '-') return left - right;
      if (binaryMatch[2] === '*') return left * right;
      if (binaryMatch[2] === '/') return Math.trunc(left / right);
    }
    expr = expr.replace(/\b([A-Za-z_]\w*)\b/g, match => {
      if (Object.prototype.hasOwnProperty.call(variables, match)) {
        const value = variables[match];
        return typeof value === 'number' ? String(value) : JSON.stringify(String(value));
      }
      return match;
    });
    if (!/^[\d\s+\-*/().<>=!&|"']+$/.test(expr)) return expression;
    try {
      return Function(`"use strict"; return (${expr});`)();
    } catch (error) {
      return expression;
    }
  }

  function formatPrintf(format, args, variables) {
    let result = format.replace(/\\n/g, '\n');
    let index = 0;
    result = result.replace(/%[dfc]/g, token => {
      const arg = args[index++] || '';
      const value = evalExpr(arg, variables);
      return token === '%c' ? String(value) : String(value);
    });
    return result;
  }

  function runProgram(code) {
    const source = clean(code);
    const variables = collectVariables(source);
    const output = [];

    const forRange = /for\s*\(\s*int\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{?\s*printf\(([\s\S]*?)\);/g;
    let rangeMatch;
    while ((rangeMatch = forRange.exec(source)) !== null) {
      const [, name, start, end, printfArgs] = rangeMatch;
      const args = splitArgs(printfArgs);
      const format = args.shift().replace(/^"|"$/g, '');
      for (let value = Number(start); value <= Number(end); value++) {
        output.push(formatPrintf(format, args, { ...variables, [name]: value }));
      }
      return output.join('');
    }

    const arrayLoop = /for\s*\(\s*int\s+([A-Za-z_]\w*)\s*=\s*0\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{?\s*printf\(([\s\S]*?)\);/g;
    let arrayMatch;
    while ((arrayMatch = arrayLoop.exec(source)) !== null) {
      const [, indexName, count, printfArgs] = arrayMatch;
      const args = splitArgs(printfArgs);
      const format = args.shift().replace(/^"|"$/g, '');
      for (let i = 0; i < Number(count); i++) {
        const scoped = { ...variables, [indexName]: i };
        source.replace(/([A-Za-z_]\w*)\s*\[\s*([A-Za-z_]\w*)\s*\]/g, (_, arrayName, idxName) => {
          scoped[`${arrayName}[${idxName}]`] = (variables[arrayName] || [])[scoped[idxName]];
          return '';
        });
        output.push(formatPrintf(format, args, scoped));
      }
      return output.join('');
    }

    const ifBlock = /if\s*\(([^)]*)\)\s*\{?\s*printf\(([\s\S]*?)\);\s*\}?\s*else\s*\{?\s*printf\(([\s\S]*?)\);/m.exec(source);
    if (ifBlock) {
      const args = splitArgs(evalExpr(ifBlock[1], variables) ? ifBlock[2] : ifBlock[3]);
      const format = args.shift().replace(/^"|"$/g, '');
      return formatPrintf(format, args, variables);
    }

    source.replace(/printf\(([\s\S]*?)\);/g, (_, printfArgs) => {
      const args = splitArgs(printfArgs);
      const format = args.shift().replace(/^"|"$/g, '');
      output.push(formatPrintf(format, args, variables));
      return '';
    });

    return output.join('');
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      outputEl.textContent = 'Running...';
      try {
        outputEl.textContent = runProgram(codeEl.value) || 'No output. Use printf() to display output.';
      } catch (error) {
        outputEl.textContent = 'Unable to run this C example.';
      }
    });
  }
});
