const fs = require('fs');

const files = [
  'src/pages/Vault.tsx',
  'src/pages/Onboarding.tsx',
  'src/pages/Activity.tsx',
  'src/pages/Auth.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Connections.tsx',
  'src/components/NotificationPanel.tsx',
  'src/components/ChatComposer.tsx',
  'src/components/Sidebar.tsx',
  'src/App.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/Fixly/g, 'Naviq');
    content = content.replace(/fixly/g, 'naviq');
    fs.writeFileSync(file, content);
  }
}
console.log('Patched Fixly to Naviq');
