fetch('http://localhost:3002/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'What is a cell?', avatarType: 'biology-teacher', sessionId: 'test-123' })
}).then(r => r.json()).then(console.log).catch(console.error);
