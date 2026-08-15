const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

if (!code.includes('Mic')) {
    code = code.replace(
        "import { Logo } from './Logo';",
        "import { Mic } from 'lucide-react';\nimport { Logo } from './Logo';"
    );
}

const hookStart = code.indexOf('const navItems: {id: string, label: string, icon: any, isPulse?: boolean, badge?: number}[] = [');

const newHook = `
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Send transcript to agent or populate input - we can emit an event or call a prop
          const customEvent = new CustomEvent('naviq-voice-input', { detail: transcript });
          window.dispatchEvent(customEvent);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  };

`;

code = code.substring(0, hookStart) + newHook + code.substring(hookStart);

const buttonToInsert = `
          {/* Floating Microphone Button */}
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-50">
            <button
              onClick={toggleListening}
              className={\`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all \${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              }\`}
              title={isListening ? 'Listening...' : 'Tap to speak'}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
`;

const navInsertionPoint = code.indexOf('</nav>');

code = code.substring(0, navInsertionPoint + 6) + buttonToInsert + code.substring(navInsertionPoint + 6);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Patched Sidebar.tsx with microphone toggle');
