const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{("badge" in item')) {
    lines[i] = '                  {item.badge !== undefined && (';
  } else if (lines[i].includes('? item.badge : "")}')) {
    lines[i] = '                      {item.badge}';
  }
}

fs.writeFileSync('src/components/Sidebar.tsx', lines.join('\n'));
console.log('Fixed Sidebar.tsx');
