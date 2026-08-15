const fs = require('fs');

let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const navItemsStart = code.indexOf('const navItems = [');
const navItemsEnd = code.indexOf('];', navItemsStart) + 2;

const newNavItems = `const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'agent', label: 'Naviq Agent', icon: Navigation, isPulse: activeMissionCount > 0 },
    { id: 'customers', label: 'Customers', icon: Map },
    { id: 'issues', label: 'Issues', icon: ShieldCheck },
    { id: 'tasks', label: 'Tasks', icon: Compass },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'meetings', label: 'Meetings', icon: Link2 },
    { id: 'activity', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];`;

code = code.substring(0, navItemsStart) + newNavItems + code.substring(navItemsEnd);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Patched Sidebar.tsx');
