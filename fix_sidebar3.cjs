const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const lines = code.split('\n');
lines[115] = '                  {item.badge !== undefined && (';
lines[116] = '                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">';
lines[117] = '                      {item.badge}';
lines[118] = '                    </span>';
lines[119] = '                  )}';
fs.writeFileSync('src/components/Sidebar.tsx', lines.join('\n'));
console.log('Fixed Sidebar.tsx perfectly');
