const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentWorkspace.tsx', 'utf-8');

const newHandleMessage = `
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

    if (!conversation?.id) {
       await onSendMessage(messageText, { datasetId: datasetContext });
       return;
    }

    const userMsg: ChatMessage = {
       id: \`msg-user-\${Date.now()}\`,
       conversationId: conversation.id,
       sender: 'user',
       text: messageText,
       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    const streamMsgId = \`msg-stream-\${Date.now()}\`;
    const asstMsg: ChatMessage = {
       id: streamMsgId,
       conversationId: conversation.id,
       sender: 'assistant',
       text: '',
       activityLog: [],
       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       intent: 'conversation'
    };
    
    setLocalMessages(prev => [...prev, userMsg, asstMsg]);
    
    try {
      const response = await api.sendConversationMessageStream(
        conversation.id,
        messageText,
        { datasetId: datasetContext },
        (log) => {
           setLocalMessages(prev => prev.map(m => {
             if (m.id === streamMsgId) {
               return { ...m, activityLog: [...(m.activityLog || []), log] };
             }
             return m;
           }));
        },
        (chunk) => {
           setLocalMessages(prev => prev.map(m => {
             if (m.id === streamMsgId) {
               return { ...m, text: m.text + chunk };
             }
             return m;
           }));
        }
      );
      
      if (response && response.response) {
         setLocalMessages(prev => prev.map(m => m.id === streamMsgId ? response.response : m));
      }
    } catch(err) {
       await onSendMessage(messageText, { datasetId: datasetContext });
    }
  };
`;

code = code.replace("  const activeTask = task || conversation?.task;", newHandleMessage + "\n  const activeTask = task || conversation?.task;");

fs.writeFileSync('src/pages/AgentWorkspace.tsx', code);
