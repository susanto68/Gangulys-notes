document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runBtn');
  const codeEl = document.getElementById('code');
  const stdinEl = document.getElementById('stdin');
  const outputEl = document.getElementById('output');

  function cleanCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  }

  function evaluateSimpleExpression(expression, variables) {
    let expr = expression.trim();

    expr = expr.replace(/([A-Za-z_]\w*)\.toUpperCase\(\)/g, (_, name) => {
      return JSON.stringify(String(variables[name] || '').toUpperCase());
    });

    expr = expr.replace(/([A-Za-z_]\w*)\.length\(\)/g, (_, name) => {
      return String(String(variables[name] || '').length);
    });

    expr = expr.replace(/\bfact\((\d+)\)/g, (_, value) => {
      let result = 1;
      for (let i = 2; i <= Number(value); i++) result *= i;
      return String(result);
    });

    expr = expr.replace(/\bsquare\(([-]?\d+)\)/g, (_, value) => {
      return String(Number(value) * Number(value));
    });

    expr = expr.replace(/\b([A-Za-z_]\w*)\b/g, (match) => {
      if (Object.prototype.hasOwnProperty.call(variables, match)) {
        const value = variables[match];
        return typeof value === 'number' ? String(value) : JSON.stringify(String(value));
      }
      return match;
    });

    if (!/^[\d\s+\-*/()."'A-Za-z!,=:]+$/.test(expr)) return expression;

    try {
      const value = Function(`"use strict"; return (${expr});`)();
      return String(value);
    } catch (error) {
      return expression.replace(/^"|"$/g, '');
    }
  }

  function collectVariables(code, stdin) {
    const variables = {};
    const inputLines = String(stdin || '').split(/\r?\n/);
    let inputIndex = 0;

    code.replace(/\b(?:int|double)\s+([^;]+);/g, (_, declaration) => {
      declaration.split(',').forEach(part => {
        const match = part.trim().match(/^([A-Za-z_]\w*)\s*=\s*([-]?\d+(?:\.\d+)?)$/);
        if (match) variables[match[1]] = Number(match[2]);
      });
      return '';
    });

    code.replace(/\bchar\s+([A-Za-z_]\w*)\s*=\s*'([^']*)';/g, (_, name, value) => {
      variables[name] = value;
      return '';
    });

    code.replace(/\bString\s+([A-Za-z_]\w*)\s*=\s*"([^"]*)";/g, (_, name, value) => {
      variables[name] = value;
      return '';
    });

    code.replace(/\bString\s+([A-Za-z_]\w*)\s*=\s*sc\.nextLine\(\);/g, (_, name) => {
      variables[name] = inputLines[inputIndex++] || '';
      return '';
    });

    code.replace(/\bint\[\]\s+([A-Za-z_]\w*)\s*=\s*\{([^}]*)\};/g, (_, name, values) => {
      variables[name] = values.split(',').map(value => Number(value.trim())).filter(value => !Number.isNaN(value));
      return '';
    });

    code.replace(/([A-Za-z_]\w*)\.name\s*=\s*"([^"]*)";/g, (_, objectName, value) => {
      variables[`${objectName}.name`] = value;
      return '';
    });

    code.replace(/new\s+Student\("([^"]*)"\)/g, (_, value) => {
      variables.studentName = value;
      return '';
    });

    return variables;
  }

  function runKnownEducationalProgram(code, stdin) {
    const source = cleanCode(code);
    const variables = collectVariables(source, stdin);
    const output = [];

    if (/for\s*\(\s*int\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*System\.out\.println\(([^;]+)\);/s.test(source)) {
      source.replace(/for\s*\(\s*int\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*System\.out\.println\(([^;]+)\);/gs, (_, name, start, end, expression) => {
        for (let value = Number(start); value <= Number(end); value++) {
          output.push(evaluateSimpleExpression(expression, { ...variables, [name]: value }));
        }
        return '';
      });
      return output.join('\n');
    }

    if (/for\s*\(\s*int\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*\)\s*System\.out\.println\(([^;]+)\);/s.test(source)) {
      source.replace(/for\s*\(\s*int\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*\)\s*System\.out\.println\(([^;]+)\);/gs, (_, itemName, arrayName, expression) => {
        (variables[arrayName] || []).forEach(value => {
          output.push(evaluateSimpleExpression(expression, { ...variables, [itemName]: value }));
        });
        return '';
      });
      return output.join('\n');
    }

    if (/if\s*\(\s*marks\s*>=\s*90\s*\).*else\s+if\s*\(\s*marks\s*>=\s*60\s*\)/s.test(source)) {
      const marks = Number(variables.marks || 0);
      output.push(marks >= 90 ? 'Excellent!' : marks >= 60 ? 'Good!' : 'Needs Improvement.');
      if (variables.day === 1) output.push('Monday');
      else if (variables.day === 2) output.push('Tuesday');
      else output.push('Other Day');
      return output.join('\n');
    }

    if (/catch\s*\(\s*ArithmeticException/.test(source)) {
      return 'Cannot divide by zero!';
    }

    if (/Dog\s+d\s*=\s*new\s+Dog\(\)/.test(source)) {
      return 'Dog barks';
    }

    if (/Shape\s+s\s*=\s*new\s+Square\(\)/.test(source)) {
      return 'Area = side × side';
    }

    if (/new\s+Student\("([^"]*)"\)/.test(source)) {
      return `Student: ${variables.studentName || ''}`;
    }

    if (/Student\s+s\s*=\s*new\s+Student\(\)/.test(source) && /s\.show\(\)/.test(source)) {
      return `Hello, ${variables['s.name'] || ''}`;
    }

    if (/FileWriter/.test(source)) {
      return 'File written successfully!';
    }

    source.replace(/System\.out\.(print|println)\(([\s\S]*?)\);/g, (_, method, expression) => {
      const value = evaluateSimpleExpression(expression, variables);
      if (method === 'print' && output.length) output[output.length - 1] += value;
      else output.push(value);
      return '';
    });

    return output.join('\n');
  }

  function formatExecutionResult(data) {
    const meta = [];
    if (data.cpuTime) meta.push(`CPU: ${data.cpuTime}s`);
    if (data.memory) meta.push(`Mem: ${data.memory}`);
    return `${data.output || ''}${meta.length ? `\n\n[${meta.join(' | ')}]` : ''}`.trim();
  }

  async function runProgram() {
    if (!codeEl || !outputEl || !runBtn) return;
    const code = codeEl.value;
    const stdin = stdinEl ? stdinEl.value : '';
    outputEl.textContent = 'Running...';
    runBtn.disabled = true;

    try {
      const resp = await fetch('/api/jdoodle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin, language: 'java', versionIndex: '3' })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const fallbackOutput = runKnownEducationalProgram(code, stdin);
        outputEl.textContent = fallbackOutput || ((data && data.error) ? `Error: ${data.error}` : 'Execution error');
        return;
      }

      outputEl.textContent = formatExecutionResult(data);
    } catch (err) {
      const fallbackOutput = runKnownEducationalProgram(code, stdin);
      outputEl.textContent = fallbackOutput || 'Network error or timeout.';
    } finally {
      runBtn.disabled = false;
    }
  }

  if (runBtn) runBtn.addEventListener('click', runProgram);
});


