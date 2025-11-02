document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runBtn');
  const codeEl = document.getElementById('code');
  const stdinEl = document.getElementById('stdin');
  const outputEl = document.getElementById('output');

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
        outputEl.textContent = (data && data.error) ? `Error: ${data.error}` : 'Execution error';
        return;
      }

      const meta = [];
      if (data.cpuTime) meta.push(`CPU: ${data.cpuTime}s`);
      if (data.memory) meta.push(`Mem: ${data.memory}`);

      outputEl.textContent = `${data.output || ''}${meta.length ? `\n\n[${meta.join(' | ')}]` : ''}`.trim();
    } catch (err) {
      outputEl.textContent = 'Network error or timeout.';
    } finally {
      runBtn.disabled = false;
    }
  }

  if (runBtn) runBtn.addEventListener('click', runProgram);
});


