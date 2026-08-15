const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

// 1. Add activeDataset state
if (!code.includes('activeDataset')) {
  code = code.replace("const [isSidebarOpen, setIsSidebarOpen] = useState(true);", "const [isSidebarOpen, setIsSidebarOpen] = useState(true);\n  const [activeDataset, setActiveDataset] = useState<any>(null);");
}

// 2. Modify handleSendMessage to accept file
if (code.includes('const handleSendMessage = async (message: string) => {') || code.includes('const handleSendMessage = async (text: string) => {')) {
  // Let's just do a regex replace
  code = code.replace(/const handleSendMessage = async \((message|text): string\) => \{/, "const handleSendMessage = async (text: string, file?: File | null) => {\n    let messageText = text;\n    if (file) {\n      setIsTyping(true);\n      try {\n         const tempMsg: ChatMessage = {\n           id: `msg-temp-${Date.now()}`,\n           conversationId: conversation?.id || '',\n           sender: 'user',\n           text: `Analyze company data: ${file.name}`,\n           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),\n         };\n         setLocalMessages(prev => [...prev, tempMsg]);\n         const uploaded = await api.uploadDataset(file);\n         setActiveDataset(uploaded.dataset);\n         messageText = messageText || `Analyze company data: ${file.name}`;\n      } catch (err) {\n         console.error('Upload failed', err);\n         setLocalMessages(prev => [...prev, {\n           id: `msg-err-${Date.now()}`,\n           conversationId: conversation?.id || '',\n           sender: 'assistant',\n           text: 'Failed to upload dataset: ' + (err as any).message,\n           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),\n           intent: 'conversation'\n         }]);\n         setIsTyping(false);\n         return;\n      }\n    }\n");
}

// 3. Pass activeDataset.id to api.sendMessage
// wait, the signature of api.sendMessage is (message: string, context?: any)
if (code.includes('const response = await api.sendMessage(messageText, {')) {
   code = code.replace("const response = await api.sendMessage(messageText, {", "const response = await api.sendMessage(messageText, {\n        datasetId: activeDataset?.id,");
} else if (code.includes('const response = await api.sendMessage(text, {')) {
   code = code.replace("const response = await api.sendMessage(text, {", "const response = await api.sendMessage(messageText, {\n        datasetId: activeDataset?.id,");
}

// 4. Update ChatComposer usage
if (code.includes('<ChatComposer')) {
   code = code.replace("<ChatComposer", "<ChatComposer activeDataset={activeDataset}");
}

fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
