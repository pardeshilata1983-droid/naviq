const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

code = code.replace(
  "conversation?.messages?.[conversation.messages.length - 1]?.actionResult || conversation?.actionResult",
  "localMessages?.[localMessages.length - 1]?.actionResult || conversation?.actionResult"
);

// Also need to fix the condition for showing the sidebar
code = code.replace(
  "conversation?.messages && conversation.messages.length > 0 && conversation.messages[conversation.messages.length - 1].actionResult",
  "localMessages && localMessages.length > 0 && localMessages[localMessages.length - 1].actionResult"
);

fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
