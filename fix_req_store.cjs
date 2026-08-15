const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/req\.userStore/g, "(req as any).userStore");
fs.writeFileSync('server.ts', code);
console.log('Fixed req.userStore');
