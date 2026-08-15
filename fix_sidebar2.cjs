const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const lines = code.split('\n');
lines[117] = '                      {item.badge}';
fs.writeFileSync('src/components/Sidebar.tsx', lines.join('\n'));
console.log('Fixed Sidebar.tsx again');
