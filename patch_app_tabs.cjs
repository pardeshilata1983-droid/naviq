const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const placeholder = `
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
            )}
`;

const settingsIdx = code.indexOf("{currentTab === 'settings' && (");
if (settingsIdx !== -1) {
  code = code.substring(0, settingsIdx) + placeholder + code.substring(settingsIdx);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx tabs');
}
