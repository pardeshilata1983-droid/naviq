const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

code = code.replace(
  "const messages: ChatMessage[] = conversation ? conversation.messages : [];",
  "const messages: ChatMessage[] = localMessages.length > 0 ? localMessages : (conversation ? conversation.messages : []);"
);

fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
