const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

const target = `    } catch(err) {
       await onSendMessage(messageText, { datasetId: datasetContext });
    }`;

const replacement = `    } catch(err: any) {
       setLocalMessages(prev => prev.map(m => {
         if (m.id === streamMsgId) {
           return { ...m, text: \`⚠️ System Error: \${err.message}\` };
         }
         return m;
       }));
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
  console.log("Patched AgentWorkspace.tsx");
} else {
  console.log("Could not find target in AgentWorkspace.tsx");
}
