const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const streamMethod = `
  async sendConversationMessageStream(conversationId: string, message: string, context?: any, onLog?: (log: string) => void, onChunk?: (chunk: string) => void): Promise<ChatResponse> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('naviq_auth_token') : null;
    const res = await fetch(\`\${API_BASE}/conversations/\${conversationId}/stream\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': \`Bearer \${token}\` } : {}),
      },
      body: JSON.stringify({ message, context }),
    });

    if (!res.ok) throw new Error('Failed to start stream');
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream');

    const decoder = new TextDecoder();
    let done = false;
    let finalMessage: any = null;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) {
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\\n\\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'log' && onLog) onLog(data.log);
              if (data.type === 'chunk' && onChunk) onChunk(data.text);
              if (data.type === 'error') throw new Error(data.error);
              if (data.type === 'done') {
                finalMessage = { response: data.message };
              }
            } catch (e) {
              // ignore parse error for partial chunks
            }
          }
        }
      }
      done = readerDone;
    }
    return finalMessage || { response: { message: 'Stream ended without done event' } };
  },
`;

if (!code.includes('sendConversationMessageStream')) {
  code = code.replace("async sendConversationMessage(conversationId: string", streamMethod + "\n  async sendConversationMessage(conversationId: string");
}

fs.writeFileSync('src/services/api.ts', code);
