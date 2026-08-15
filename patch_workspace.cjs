const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

if (!code.includes('import { api } from')) {
  code = code.replace("import { glass, glass2, glassEmerald, glassModal, emeraldBtnSolid, emeraldBtn, colors } from '../lib/styles';", "import { glass, glass2, glassEmerald, glassModal, emeraldBtnSolid, emeraldBtn, colors } from '../lib/styles';\nimport { api } from '../services/api';");
}

code = code.replace(
  "onSendMessage: (message: string) => Promise<void>;",
  "onSendMessage: (message: string, context?: any) => Promise<void>;"
);

code = code.replace(
  "const [showInspectorSidebar, setShowInspectorSidebar] = useState<boolean>(true);",
  "const [showInspectorSidebar, setShowInspectorSidebar] = useState<boolean>(true);\n  const [activeDataset, setActiveDataset] = useState<any>(null);\n  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);\n  useEffect(() => {\n    if (conversation?.messages) setLocalMessages(conversation.messages);\n  }, [conversation?.messages]);\n"
);

code = code.replace(
  "<MessageList\n              messages={conversation?.messages || []}",
  "<MessageList\n              messages={localMessages.length > 0 ? localMessages : (conversation?.messages || [])}"
);

const handleMessage = `
  const handleChatSubmit = async (message: string, file?: File | null) => {
    let messageText = message;
    let datasetContext = activeDataset?.id;
    if (file) {
      const tempMsg: ChatMessage = {
        id: \`msg-user-\${Date.now()}\`,
        conversationId: conversation?.id || '',
        sender: 'user',
        text: \`[Uploading \${file.name}...]\`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLocalMessages(prev => [...prev, tempMsg]);
      
      try {
        const uploaded = await api.uploadDataset(file);
        setActiveDataset(uploaded.dataset);
        datasetContext = uploaded.dataset.id;
        messageText = messageText || \`Analyze this company data.\`;
      } catch (err: any) {
        setLocalMessages(prev => [...prev, {
          id: \`msg-err-\${Date.now()}\`,
          conversationId: conversation?.id || '',
          sender: 'assistant',
          text: \`Failed to upload \${file.name}: \${err.message}\`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        return;
      }
    }
    
    await onSendMessage(messageText, { datasetId: datasetContext });
  };
`;

code = code.replace(
  "<ChatComposer\n              id=\"workspace-followup-composer\"",
  handleMessage + "\n            <ChatComposer\n              id=\"workspace-followup-composer\"\n              activeDataset={activeDataset}"
);

code = code.replace(
  "onSubmit={onSendMessage}",
  "onSubmit={handleChatSubmit}"
);

fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
