const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

code = code.replace(
  "setLocalMessages(prev => prev.map(m => m.id === streamMsgId ? response.response : m));",
  "setLocalMessages(prev => prev.map(m => m.id === streamMsgId ? (response as any).response : m));"
);

fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
