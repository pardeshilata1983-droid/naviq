const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add globalError state
if (!code.includes('globalError')) {
  code = code.replace(
    "const [isCreatingMission, setIsCreatingMission] = useState(false);",
    "const [isCreatingMission, setIsCreatingMission] = useState(false);\n  const [globalError, setGlobalError] = useState<string | null>(null);"
  );
}

// 2. Set global error in handleStartConversation
code = code.replace(
  "} catch (err) {\n      console.error('Failed to start conversation:', err);",
  "} catch (err: any) {\n      console.error('Failed to start conversation:', err);\n      setGlobalError(err.message);"
);

// 3. Set global error in handleSendMessageInActiveConversation
code = code.replace(
  "} catch (err) {\n      console.error('Failed to send message:', err);",
  "} catch (err: any) {\n      console.error('Failed to send message:', err);\n      setGlobalError(err.message);"
);

// 4. Render globalError banner
const banner = `
      {globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 max-w-lg w-full">
          <span className="flex-1 text-sm font-medium">{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="text-white/80 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}
`;

if (!code.includes('globalError && (')) {
  code = code.replace(
    '<div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-emerald-500/30 flex overflow-hidden">',
    `<div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-emerald-500/30 flex overflow-hidden">\n${banner}`
  );
}

fs.writeFileSync('src/App.tsx', code);
