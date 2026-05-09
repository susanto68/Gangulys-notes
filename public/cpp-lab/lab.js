document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runBtn');
  const codeEl = document.getElementById('code');
  const outputEl = document.getElementById('output');

  function clean(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
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
      if (match) {
        variables[match[1]] = match[2];
        return;
      }

      match = line.match(/^\s*string\s+([A-Za-z_]\w*)\s*=\s*"([^"]*)";/);
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
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
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

  function renderCout(chain, variables) {
    return chain
      .split('<<')
      .map(part => part.trim())
      .filter(part => part && part !== 'cout')
      .map(part => part === 'endl' ? '\n' : String(evalExpr(part, variables)))
      .join('');
  }

  function runProgram(code) {
    const source = clean(code);
    const variables = collectVariables(source);
    const output = [];

    const forRange = /for\s*\(\s*int\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{?\s*cout\s*<<\s*([\s\S]*?);/g;
    let rangeMatch;
    while ((rangeMatch = forRange.exec(source)) !== null) {
      const [, name, start, end, chain] = rangeMatch;
      for (let value = Number(start); value <= Number(end); value++) {
        output.push(renderCout(chain, { ...variables, [name]: value }));
      }
      return output.join('');
    }

    const arrayLoop = /for\s*\(\s*int\s+([A-Za-z_]\w*)\s*=\s*0\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{?\s*cout\s*<<\s*([\s\S]*?);/g;
    let arrayMatch;
    while ((arrayMatch = arrayLoop.exec(source)) !== null) {
      const [, indexName, count, chain] = arrayMatch;
      for (let i = 0; i < Number(count); i++) {
        output.push(renderCout(chain, { ...variables, [indexName]: i }));
      }
      return output.join('');
    }

    const ifBlock = /if\s*\(([^)]*)\)\s*\{?\s*cout\s*<<\s*([\s\S]*?);\s*\}?\s*else\s*\{?\s*cout\s*<<\s*([\s\S]*?);/m.exec(source);
    if (ifBlock) {
      return renderCout(evalExpr(ifBlock[1], variables) ? ifBlock[2] : ifBlock[3], variables);
    }

    source.replace(/cout\s*<<\s*([\s\S]*?);/g, (_, chain) => {
      output.push(renderCout(chain, variables));
      return '';
    });

    return output.join('');
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      outputEl.textContent = 'Running...';
      try {
        outputEl.textContent = runProgram(codeEl.value) || 'No output. Use cout to display output.';
      } catch (error) {
        outputEl.textContent = 'Unable to run this C++ example.';
      }
    });
  }
});
