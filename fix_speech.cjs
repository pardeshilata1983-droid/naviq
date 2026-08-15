const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

code = code.replace(
  "console.error('Speech recognition error', event.error);",
  "if (event.error !== 'no-speech') { console.error('Speech recognition error', event.error); }"
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Fixed speech error logging');
