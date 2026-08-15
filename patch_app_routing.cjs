const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// import new pages
code = code.replace(
  "import { Vault } from './pages/Vault';",
  "import { Vault } from './pages/Vault';\nimport { Customers } from './pages/Customers';\nimport { Customer360 } from './pages/Customer360';\nimport { Issues } from './pages/Issues';\nimport { Features } from './pages/Features';\nimport { Meetings } from './pages/Meetings';"
);

// Add state for selected customer
code = code.replace(
  "const [activeMissionId, setActiveMissionId] = useState<string | null>(null);",
  "const [activeMissionId, setActiveMissionId] = useState<string | null>(null);\n  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);"
);

// Replace the placeholder routing block
const searchBlock = `
            {['customers', 'issues', 'features', 'meetings'].includes(currentTab) && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <span className="text-2xl text-emerald-400">❖</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 capitalize">{currentTab} Workspace</h2>
                <p className="text-sm text-center max-w-md">
                  This workspace is connected to your {currentTab} dataset. Use the Naviq Agent to query and analyze this data.
                </p>
                <button onClick={() => setCurrentTab('agent')} className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                  Open Naviq Agent
                </button>
              </div>
            )}`;

const newRouting = `
            {currentTab === 'customers' && (
              <Customers 
                onSelectCustomer={(name) => {
                  setSelectedCustomer(name);
                  setCurrentTab('customer360');
                }} 
              />
            )}
            {currentTab === 'customer360' && selectedCustomer && (
              <Customer360 
                customerName={selectedCustomer} 
                onBack={() => setCurrentTab('customers')} 
                onAskAgent={(q) => handleStartConversation(q)} 
              />
            )}
            {currentTab === 'issues' && (
              <Issues />
            )}
            {currentTab === 'features' && (
              <Features 
                onAskAgent={(q) => handleStartConversation(q)} 
              />
            )}
            {currentTab === 'meetings' && (
              <Meetings 
                onAskAgent={(q) => handleStartConversation(q)} 
              />
            )}
`;

code = code.replace(searchBlock, newRouting);

// Also need to pass onAskAgent to Tasks
code = code.replace(
  "<Tasks\n                tasks={tasks}\n                onOpenMission={handleOpenMission}\n                onNewFix={() => handleSelectTab('home')}\n              />",
  "<Tasks onAskAgent={(q) => handleStartConversation(q)} />"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx');
