const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The simplest way to fix this is to either add navigationSession?: any; to types, or remove the usages from App.tsx.
// Since we don't need navigationSession, let's just remove the block syncing it.
code = code.replace(/if \(activeConv\?.navigationSession\) \{[\s\S]*?\}/g, '');
code = code.replace(/if \(result\.response\?.navigationSession\) \{[\s\S]*?\}/g, '');
code = code.replace(/if \(response\.navigationSession\) \{[\s\S]*?\} else if \(detail\?\.navigationSession\) \{[\s\S]*?\}/g, '');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx');
