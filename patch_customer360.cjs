const fs = require('fs');

let code = fs.readFileSync('src/components/Customer360Panel.tsx', 'utf-8');

const insertionIdx = code.indexOf("return (\n    <div className=\"w-full h-full p-6 text-gray-400\">\n      <pre className=\"text-xs font-mono overflow-auto h-full\">{JSON.stringify(actionResult, null, 2)}</pre>");

if (insertionIdx !== -1) {
    const featureBlock = `
  if (actionResult.type === 'feature_opportunities') {
      return (
          <div className="h-full p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" /> Feature Opportunities</h2>
              {actionResult.data.map((fr: any, i: number) => (
                  <div key={i} className="p-4 bg-purple-950/20 border border-purple-900/50 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                          <h3 className="text-md font-bold text-purple-100">{fr.title}</h3>
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                            \${fr.estimatedRevenueImpact.toLocaleString()}
                          </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                        <span className="bg-white/5 px-2 py-1 rounded">Mentions: {fr.mentions}</span>
                        <span className="bg-white/5 px-2 py-1 rounded">Area: {fr.productArea}</span>
                        <span className="bg-white/5 px-2 py-1 rounded">Status: {fr.status}</span>
                      </div>
                      {fr.accountsRequesting && fr.accountsRequesting.length > 0 && (
                        <div className="mt-3 text-xs text-gray-500">
                           <span className="font-semibold text-gray-400">Requested by:</span> {fr.accountsRequesting.join(', ')}
                        </div>
                      )}
                  </div>
              ))}
          </div>
      )
  }

  `;
  code = code.substring(0, insertionIdx) + featureBlock + code.substring(insertionIdx);
  fs.writeFileSync('src/components/Customer360Panel.tsx', code);
  console.log('Patched Customer360Panel.tsx');
}
