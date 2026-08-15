const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const target = "if (!res.ok) throw new Error('Failed to start stream');";
const replacement = `if (!res.ok) {
      let errMsg = 'Failed to start stream';
      try { const errObj = await res.json(); errMsg = errObj.error || errMsg; } catch(e) {}
      throw new Error(errMsg);
    }`;
code = code.replace(target, replacement);

fs.writeFileSync('src/services/api.ts', code);
