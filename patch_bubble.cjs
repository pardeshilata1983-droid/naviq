const fs = require('fs');
let code = fs.readFileSync('src/components/MessageBubble.tsx', 'utf-8');

const replacement = `
          {/* Main Message Text */}
          {message.activityLog && message.activityLog.length > 0 && (
            <div className="mb-3 space-y-1 bg-black/40 p-3 rounded-xl border border-gray-800">
              {message.activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {log.startsWith('✓') ? (
                    <span className="text-emerald-400 font-bold">✓</span>
                  ) : log.startsWith('●') ? (
                    <span className="text-blue-400 font-bold animate-pulse">●</span>
                  ) : (
                    <span className="text-gray-400">•</span>
                  )}
                  <span className="text-gray-300">{log.replace(/^[✓●]\s*/, '')}</span>
                </div>
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap font-normal select-text break-words">
            {message.text}
          </div>
`;

code = code.replace(
  `{/* Main Message Text */}
          <div className="whitespace-pre-wrap font-normal select-text break-words">
            {message.text}
          </div>`,
  replacement
);

fs.writeFileSync('src/components/MessageBubble.tsx', code);
console.log('Patched MessageBubble.tsx');
