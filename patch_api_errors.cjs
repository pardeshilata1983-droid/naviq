const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

function replaceErrorThrow(funcName, errorMsg) {
  const target = `if (!res.ok) throw new Error('${errorMsg}');`;
  const replacement = `if (!res.ok) {
      let errMsg = '${errorMsg}';
      try { const errObj = await res.json(); errMsg = errObj.error || errMsg; } catch(e) {}
      throw new Error(errMsg);
    }`;
  code = code.replace(target, replacement);
}

replaceErrorThrow('createConversation', 'Failed to create conversation');
replaceErrorThrow('sendConversationMessage', 'Failed to send message');

fs.writeFileSync('src/services/api.ts', code);
