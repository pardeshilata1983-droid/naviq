const fs = require('fs');

let code = fs.readFileSync('src/components/ChatComposer.tsx', 'utf-8');

const hookInsertPos = code.indexOf('  const textareaRef = useRef<HTMLTextAreaElement>(null);') + 58;

const eventListener = `
  useEffect(() => {
    const handleVoiceInput = (e: CustomEvent) => {
      const transcript = e.detail;
      if (transcript) {
        setInput((prev) => prev ? prev + ' ' + transcript : transcript);
      }
    };
    window.addEventListener('naviq-voice-input', handleVoiceInput as EventListener);
    return () => window.removeEventListener('naviq-voice-input', handleVoiceInput as EventListener);
  }, []);
`;

code = code.substring(0, hookInsertPos) + eventListener + code.substring(hookInsertPos);

fs.writeFileSync('src/components/ChatComposer.tsx', code);
console.log('Patched ChatComposer.tsx');
