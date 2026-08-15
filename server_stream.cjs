const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const streamEndpoint = `
// POST /api/conversations/:id/stream
app.post('/api/conversations/:id/stream', requireAuth, async (req, res) => {
  const store = (req as any).userStore;
  const conversation = store.conversations.find((c: any) => c.id === req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  
  const { message, context } = req.body;
  const trimmed = message.trim();
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const userMsg = {
    id: \`msg-user-\${Date.now()}\`,
    conversationId: conversation.id,
    sender: 'user',
    text: trimmed,
    timestamp: nowStr,
  };
  conversation.messages.push(userMsg);
  conversation.updatedAt = new Date().toISOString();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const onLog = (log: string) => {
      res.write(\`data: \${JSON.stringify({ type: 'log', log })}\n\n\`);
    };
    const onChunk = (chunk: string) => {
      res.write(\`data: \${JSON.stringify({ type: 'chunk', text: chunk })}\n\n\`);
    };

    const agentResponse = await processCustomerQuery(trimmed, conversation.messages, context, onLog, onChunk);
    
    const assistantMsg = {
      id: \`msg-asst-\${Date.now()}\`,
      conversationId: conversation.id,
      sender: 'assistant',
      text: agentResponse.reply,
      timestamp: nowStr,
      intent: 'conversation',
      activityLog: agentResponse.activityLog,
      actionResult: agentResponse.actionResult
    };
    conversation.messages.push(assistantMsg);

    res.write(\`data: \${JSON.stringify({ type: 'done', message: assistantMsg })}\n\n\`);
    res.end();
  } catch (err: any) {
    console.error('Error processing turn:', err);
    res.write(\`data: \${JSON.stringify({ type: 'error', error: err.message })}\n\n\`);
    res.end();
  }
});
`;

if (!code.includes('/api/conversations/:id/stream')) {
  code = code.replace("// DELETE /api/conversations/:id", streamEndpoint + "\n// DELETE /api/conversations/:id");
}

fs.writeFileSync('server.ts', code);
