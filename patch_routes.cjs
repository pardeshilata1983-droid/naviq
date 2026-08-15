const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const insertionIdx = code.indexOf('// GET /api/tasks');

const routes = `
// ==========================================
// Modern Conversation APIs (ChatGPT-style)
// ==========================================

// POST /api/conversations
app.post('/api/conversations', requireAuth, async (req, res) => {
  const store = req.userStore;
  const { initialMessage, context } = req.body;
  
  const conversation = {
    id: \`conv-\${Date.now()}\`,
    title: initialMessage ? initialMessage.substring(0, 30) + (initialMessage.length > 30 ? '...' : '') : 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  
  store.conversations.unshift(conversation);
  
  if (initialMessage) {
    try {
      const response = await processConversationTurn(store, conversation, initialMessage, context);
      res.json({ conversation, response });
      return;
    } catch (err) {
      console.error('Error processing turn:', err);
      res.status(500).json({ error: 'Failed to process message' });
      return;
    }
  }
  
  res.json({ conversation });
});

// GET /api/conversations
app.get('/api/conversations', requireAuth, (req, res) => {
  const store = req.userStore;
  res.json({ conversations: store.conversations });
});

// GET /api/conversations/:id
app.get('/api/conversations/:id', requireAuth, (req, res) => {
  const store = req.userStore;
  const conversation = store.conversations.find(c => c.id === req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json({ conversation });
});

// POST /api/conversations/:id/messages
app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  const store = req.userStore;
  const conversation = store.conversations.find(c => c.id === req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  
  const { message, context } = req.body;
  
  try {
    const response = await processConversationTurn(store, conversation, message, context);
    res.json({ response });
  } catch (err) {
    console.error('Error processing turn:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// DELETE /api/conversations/:id
app.delete('/api/conversations/:id', requireAuth, (req, res) => {
  const store = req.userStore;
  store.conversations = store.conversations.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});

// ==========================================
// Digital Navigation & Software Maps APIs
// ==========================================
// Since we removed these, we can just return dummy or simple 404 for them, or just ignore since UI doesn't use them if we replaced it.
// Actually, UI might still call navigation. Let's add dummy routes for navigation to prevent crashes.

app.get('/api/navigation/:id', requireAuth, (req, res) => {
  res.json({ session: null });
});

app.post('/api/navigation/:id/mode', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/advance', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/observe', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/execute', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/navigation/:id/stop', requireAuth, (req, res) => {
  res.json({ success: true });
});


// Legacy Chat APIs
app.post('/api/chat', requireAuth, (req, res) => {
  res.json({ error: 'Deprecated' });
});

app.get('/api/chat/history', requireAuth, (req, res) => {
  const store = req.userStore;
  const allMessages = store.conversations.flatMap(c => c.messages);
  res.json({ messages: allMessages });
});

app.post('/api/chat/clear', requireAuth, (req, res) => {
  const store = req.userStore;
  store.conversations = [];
  res.json({ success: true });
});

`;

code = code.substring(0, insertionIdx) + routes + code.substring(insertionIdx);
fs.writeFileSync('server.ts', code);
console.log('Patched routes into server.ts');
