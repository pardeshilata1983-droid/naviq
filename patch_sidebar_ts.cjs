const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

code = code.replace(
  "const navItems = [",
  "const navItems: {id: string, label: string, icon: any, isPulse?: boolean, badge?: number}[] = ["
);

// also revert my sed command
code = code.replace(
  /{("badge" in item && item.badge !== undefined) && \(/g,
  "{item.badge !== undefined && ("
);

code = code.replace(
  /{("badge" in item \? item.badge : "")}/g,
  "{item.badge}"
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Patched Sidebar.tsx types');
