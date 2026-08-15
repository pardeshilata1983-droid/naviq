const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "const handleSendMessageInActiveConversation = async (message: string) => {",
  "const handleSendMessageInActiveConversation = async (message: string, context?: any) => {"
);

code = code.replace(
  "const response = await api.sendConversationMessage(activeConversationId, message);",
  "const response = await api.sendConversationMessage(activeConversationId, message, context);"
);

// We need to also change handleStartConversation
code = code.replace(
  "const handleStartConversation = async (message: string) => {",
  "const handleStartConversation = async (message: string, context?: any) => {"
);

code = code.replace(
  "const response = await api.sendConversationMessage(conv.conversation.id, message);",
  "const response = await api.sendConversationMessage(conv.conversation.id, message, context);"
);

fs.writeFileSync('src/App.tsx', code);
