const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const search = `    conversation.messages.push(assistantMsg);`;
const replace = `    conversation.messages.push(assistantMsg);
    
    // Log Activity
    if (agentResponse.actionResult) {
      if (agentResponse.actionResult.type === 'customer_360') {
        store.activityLog.unshift({
          id: \`act-\${Date.now()}\`,
          time: nowStr,
          dayGroup: 'Today',
          title: 'Account Retrieved',
          description: \`Naviq analyzed the 360 profile for \${agentResponse.actionResult.data.account.name}.\`,
          type: 'investigation'
        });
      } else if (agentResponse.actionResult.type === 'search_results') {
        store.activityLog.unshift({
          id: \`act-\${Date.now()}\`,
          time: nowStr,
          dayGroup: 'Today',
          title: 'Data Search',
          description: \`Naviq searched the dataset for relevant context.\`,
          type: 'evidence'
        });
      }
    }
`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
console.log('Patched server.ts activity logging');
