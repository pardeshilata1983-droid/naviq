const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

serverCode = serverCode.replace(
  "activityLog: agentResponse.activityLog",
  "activityLog: agentResponse.activityLog,\n    actionResult: agentResponse.actionResult"
);

fs.writeFileSync('server.ts', serverCode);
console.log('Patched server.ts successfully');
