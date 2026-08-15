import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  Share2,
  Lock,
  Eye,
  Check,
  X,
  Play,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
  Bot,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  Map,
  AlertTriangle,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import {
  Conversation,
  FixMission,
  MissionStep,
  ChatMessage,
  NavigationSession,
  NavigationStep,
  NavigationMode,
  UploadedDataset,
} from '../types';
import { glass, glass2, glassEmerald, glassModal, emeraldBtnSolid, emeraldBtn, colors } from '../lib/styles';
import { api } from '../services/api';
import { MessageList } from '../components/MessageList';
import { ChatComposer, UploadProcessingStage } from '../components/ChatComposer';
import { Customer360Panel } from '../components/Customer360Panel';

interface ApiErrorInfo {
  title: string;
  message: string;
  retryAction?: () => Promise<void> | void;
  timestamp?: string;
}

interface AgentWorkspaceProps {
  conversation: Conversation | null;
  task?: FixMission | null;
  navigationSession?: NavigationSession | null;
  authToken?: string | null;
  onSendMessage: (message: string, context?: any) => Promise<void>;
  onApprove: (missionId: string) => Promise<void>;
  onReject: (missionId: string) => Promise<void>;
  onBackToHome: () => void;
  onNewConversation: () => void;
  onStopNavigation?: () => void;
  onNextNavigationStep?: (notes?: string) => void;
  onExecuteNavigationStep?: () => void;
  onSetNavigationMode?: (mode: NavigationMode) => void;
  isSendingMessage: boolean;
  isProcessingAction: boolean;
}

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  conversation,
  task,
  navigationSession,
  authToken,
  onSendMessage,
  onApprove,
  onReject,
  onBackToHome,
  onNewConversation,
  onStopNavigation,
  onNextNavigationStep,
  onExecuteNavigationStep,
  onSetNavigationMode,
  isSendingMessage,
  isProcessingAction,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showResolutionReport, setShowResolutionReport] = useState<boolean>(false);
  const [showInspectorSidebar, setShowInspectorSidebar] = useState<boolean>(true);
  const [activeDataset, setActiveDataset] = useState<UploadedDataset | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadProcessingStage>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [apiError, setApiError] = useState<ApiErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    if (conversation?.messages) setLocalMessages(conversation.messages);
  }, [conversation?.messages]);

  const handleRetry = async () => {
    if (!apiError?.retryAction || isRetrying) return;
    setIsRetrying(true);
    try {
      const action = apiError.retryAction;
      setApiError(null);
      await action();
    } catch (err: any) {
      setApiError({
        title: 'Retry Attempt Failed',
        message: err?.message || 'Communication error persisted on retry attempt',
        retryAction: apiError.retryAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleChatSubmit = async (message: string, file?: File | null) => {
    let messageText = message;
    let datasetContext = activeDataset?.id;
    setApiError(null);

    if (file) {
      setUploadStage('uploading');
      setUploadProgress(0);

      try {
        const uploaded = await api.uploadDataset(file, (stage, progress) => {
          setUploadStage(stage);
          if (progress !== undefined) setUploadProgress(progress);
        });

        setActiveDataset(uploaded.dataset);
        datasetContext = uploaded.dataset.id;
        setUploadStage('ready');

        // Reset stage after brief success confirmation
        setTimeout(() => setUploadStage('idle'), 1200);

        messageText =
          messageText.trim() ||
          `Analyze the uploaded company dataset "${uploaded.dataset.name}". Provide a Customer Success intelligence brief covering key accounts, health metrics, risks, and recommended actions.`;
      } catch (err: any) {
        setUploadStage('idle');
        const errMsg = err?.message || 'Dataset upload failed due to network or format error';
        setApiError({
          title: 'Dataset Ingestion Failed',
          message: errMsg,
          retryAction: () => handleChatSubmit(message, file),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setLocalMessages((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            conversationId: conversation?.id || '',
            sender: 'assistant',
            text: `⚠️ **Upload Failed**: ${errMsg}. Click **Retry** above or verify the file format to try again.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }
    }

    if (!conversation?.id) {
      try {
        await onSendMessage(messageText, { datasetId: datasetContext });
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to start conversation with Naviq agent service';
        setApiError({
          title: 'Agent Connection Error',
          message: errMsg,
          retryAction: () => handleChatSubmit(messageText, file),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      conversationId: conversation.id,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const streamMsgId = `msg-stream-${Date.now()}`;
    const asstMsg: ChatMessage = {
      id: streamMsgId,
      conversationId: conversation.id,
      sender: 'assistant',
      text: '',
      activityLog: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: 'conversation',
    };

    setLocalMessages((prev) => [...prev, userMsg, asstMsg]);

    try {
      const response = await api.sendConversationMessageStream(
        conversation.id,
        messageText,
        { datasetId: datasetContext },
        (log) => {
          setLocalMessages((prev) =>
            prev.map((m) => {
              if (m.id === streamMsgId) {
                return { ...m, activityLog: [...(m.activityLog || []), log] };
              }
              return m;
            })
          );
        },
        (chunk) => {
          setLocalMessages((prev) =>
            prev.map((m) => {
              if (m.id === streamMsgId) {
                return { ...m, text: m.text + chunk };
              }
              return m;
            })
          );
        }
      );

      if ((response as any) && (response as any).response) {
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? (response as any).response : m))
        );
      }
    } catch (err: any) {
      const errMsg = err?.message || 'API communication interrupted or server unreachable';
      setApiError({
        title: 'API Communication Interrupted',
        message: errMsg,
        retryAction: () => handleChatSubmit(messageText),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setLocalMessages((prev) =>
        prev.map((m) => {
          if (m.id === streamMsgId) {
            return {
              ...m,
              text: `⚠️ **System Communication Error**: ${errMsg}\n\n*Click "Retry" in the notification banner above to re-transmit.*`,
            };
          }
          return m;
        })
      );
    }
  };

  const activeTask = task || conversation?.task;

  // If task requires approval, auto open or highlight approval modal
  useEffect(() => {
    if (activeTask && activeTask.status === 'needs_approval') {
      setShowApprovalModal(true);
    }
  }, [activeTask?.status]);

  const toggleStepDetails = (id: string) => {
    setExpandedStepId((prev) => (prev === id ? null : id));
  };

  const getStepIcon = (status: MissionStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500 border border-emerald-300 flex items-center justify-center text-black shadow-[0_0_12px_#10b981] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-black" />
          </div>
        );
      case 'waiting':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Clock className="w-3 h-3" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          </div>
        );
    }
  };

  const messages: ChatMessage[] = localMessages.length > 0 ? localMessages : (conversation ? conversation.messages : []);

  return (
    <div className="agent-workspace-container flex-1 flex flex-col h-full max-w-7xl mx-auto w-full p-3 sm:p-5 gap-4 select-none">
      {/* Top Workspace Header Bar */}
      <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex items-center justify-between gap-4 shadow-xl bg-gray-950/80`}>
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToHome}
            title="Back to Home"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeTask ? 'Mission Workspace' : 'Naviq Live Chat'}
              </span>
              {conversation && (
                <>
                  <span className="text-gray-600 text-xs">•</span>
                  <span className="text-[11px] text-gray-400 truncate">ID: {conversation.id}</span>
                </>
              )}
            </div>

            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {conversation?.title || activeTask?.title || 'Naviq Conversation'}
            </h1>
          </div>
        </div>

        {/* Right: Actions (New Chat, Approval Trigger, Toggle Inspector) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTask && activeTask.status === 'needs_approval' && (
            <button
              id="workspace-approval-trigger-btn"
              onClick={() => setShowApprovalModal(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${emeraldBtnSolid} flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse cursor-pointer`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Review Approval</span>
            </button>
          )}

          {activeTask && activeTask.status === 'resolved' && (
            <button
              onClick={() => setShowResolutionReport(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${emeraldBtn} flex items-center gap-1.5 cursor-pointer`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          {activeTask && (
            <button
              type="button"
              onClick={() => setShowInspectorSidebar(!showInspectorSidebar)}
              title={showInspectorSidebar ? 'Hide Agent Inspector' : 'Show Agent Inspector'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
            >
              {showInspectorSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onNewConversation}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${emeraldBtn} flex items-center gap-1.5 cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Fix</span>
          </button>
        </div>
      </div>

      {/* Non-Intrusive API Communication Error Banner with Retry */}
      {apiError && (
        <div
          id="agent-workspace-error-banner"
          role="alert"
          className="w-full bg-gradient-to-r from-red-950/90 via-red-900/60 to-gray-950/90 border border-red-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-200 truncate">{apiError.title}</span>
                {apiError.timestamp && (
                  <span className="text-[10px] text-red-300/60 font-mono hidden sm:inline">{apiError.timestamp}</span>
                )}
              </div>
              <p className="text-xs text-red-300/90 truncate max-w-xl">
                {apiError.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {apiError.retryAction && (
              <button
                type="button"
                id="agent-workspace-retry-btn"
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-black shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 stroke-[2.5] ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
              </button>
            )}
            <button
              type="button"
              id="agent-workspace-error-dismiss-btn"
              onClick={() => setApiError(null)}
              title="Dismiss error"
              className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        {/* Left / Center: Chronological Chat Stream & Composer */}
        <div
          className={`flex flex-col h-full rounded-2xl ${glass} border border-emerald-500/15 overflow-hidden shadow-2xl bg-gray-950/60 ${
            (activeTask || navigationSession || conversation?.actionResult || (localMessages && localMessages.length > 0 && localMessages[localMessages.length - 1].actionResult)) && showInspectorSidebar ? 'lg:col-span-7' : 'lg:col-span-12 max-w-4xl mx-auto w-full'
          }`}
        >
          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <MessageList
              messages={messages}
              isLoading={isSendingMessage}
              emptyStateTitle="Conversation Started"
              emptyStateSubtitle="Naviq is standing by. Continue typing below or provide additional context."
            />
          </div>

          {/* Persistent Chat Composer at bottom */}
          <div className="p-3 bg-gray-950/90 border-t border-white/10">
            <ChatComposer
              id="workspace-followup-composer"
              activeDataset={activeDataset}
              onClearDataset={() => setActiveDataset(null)}
              uploadStage={uploadStage}
              uploadProgress={uploadProgress}
              placeholder={
                activeTask
                  ? 'Ask a question or provide new parameters for this mission...'
                  : activeDataset
                  ? `Ask Naviq to query ${activeDataset.name}...`
                  : 'Ask Naviq anything, or drag & drop company files...'
              }
              onSubmit={handleChatSubmit}
              isLoading={isSendingMessage}
              autoFocus={true}
              suggestedPrompts={
                activeDataset
                  ? [
                      `Summarize key insights from ${activeDataset.name}`,
                      'Identify accounts with highest churn risk',
                      'What are the most requested features in this data?',
                    ]
                  : activeTask
                  ? [
                      'Approve and proceed',
                      'What is the current status?',
                      'Cancel this task',
                    ]
                  : [
                      'Prepare a Customer 360 brief for Meridian AgriTech',
                      'Which accounts are currently at risk and why?',
                      'List our highest impact feature requests',
                    ]
              }
              showSuggestions={messages.length <= 2}
            />
          </div>
        </div>        {/* Right: Autonomous Agent Inspector Panels (Only shown when activeTask or navigationSession is present and inspector is toggled) */}
        {(activeTask || navigationSession || conversation?.actionResult || (conversation?.messages && conversation.messages.length > 0 && conversation.messages[conversation.messages.length - 1].actionResult)) && showInspectorSidebar && (
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1 pb-4">
            {/* Real Live Browser Controller */}
            <Customer360Panel actionResult={localMessages?.[localMessages.length - 1]?.actionResult || conversation?.actionResult} />

            {/* NAVIGATION WORKSPACE PANELS ("Google Maps for Software") */}
            {navigationSession && (
              <>
                {/* 1. YOU ARE HERE Panel */}
                <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex flex-col gap-3 shadow-lg bg-gray-950/70`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      You Are Here
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {navigationSession.application}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      {navigationSession.location.screen}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">DETECTED CONTROLS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {navigationSession.location.detectedControls.slice(0, 8).map((control, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[9px] text-gray-300">
                          {control}
                        </span>
                      ))}
                      {navigationSession.location.detectedControls.length > 8 && (
                        <span className="text-[9px] text-gray-500 flex items-center">+{navigationSession.location.detectedControls.length - 8} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. DESTINATION Panel */}
                <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex flex-col gap-3 shadow-lg bg-gray-950/70`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-emerald-400" />
                      Destination
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">ETA: {navigationSession.steps.length * 2} min</span>
                  </div>
                  
                  <div className="text-sm font-bold text-white leading-tight">
                    {navigationSession.goal}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] text-gray-500 uppercase">Steps</span>
                      <span className="text-xs font-bold text-emerald-300">{navigationSession.steps.length}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] text-gray-500 uppercase">Mode</span>
                      <span className="text-[9px] font-bold text-emerald-300 uppercase">{navigationSession.mode.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] text-gray-500 uppercase">Saved</span>
                      <span className="text-xs font-bold text-emerald-300">~12m</span>
                    </div>
                  </div>
                </div>

                {/* 3. ROUTE / STEPS Panel */}
                <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex flex-col gap-3 shadow-lg bg-gray-950/70`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Route Steps
                    </span>
                    <div className="flex gap-1">
                      {['show_me', 'guide_me', 'do_it_for_me'].map((m) => (
                        <button
                          key={m}
                          onClick={() => onSetNavigationMode?.(m as NavigationMode)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            navigationSession.mode === m 
                            ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                            : 'bg-white/5 text-gray-500 hover:text-white'
                          }`}
                          title={m.replace(/_/g, ' ')}
                        >
                          {m === 'show_me' && <Eye className="w-3 h-3" />}
                          {m === 'guide_me' && <Map className="w-3 h-3" />}
                          {m === 'do_it_for_me' && <Bot className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-1 py-1">
                    {navigationSession.steps.map((step, idx) => {
                      const isActive = navigationSession.currentStepIndex === idx;
                      const isCompleted = step.status === 'completed';
                      
                      return (
                        <div key={step.id} className={`flex gap-3 relative ${!isActive && !isCompleted ? 'opacity-40' : ''}`}>
                          {/* Vertical Connector Line */}
                          {idx < navigationSession.steps.length - 1 && (
                            <div className={`absolute left-[11px] top-6 w-0.5 h-[calc(100%+12px)] ${isCompleted ? 'bg-emerald-500/40' : 'bg-gray-800'}`} />
                          )}
                          
                          {/* Step Marker */}
                          <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 z-10 transition-all ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : 
                            isActive ? 'bg-black border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)] animate-pulse' : 
                            'bg-gray-900 border-gray-700 text-gray-500'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-emerald-300' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                              {step.instruction}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Target: <code className="text-[9px] bg-white/5 px-1 py-0.5 rounded border border-white/5">{step.target}</code>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {navigationSession.mode === 'do_it_for_me' && navigationSession.status !== 'completed' && (
                    <button
                      onClick={async () => {
                        try {
                          setApiError(null);
                          await onExecuteNavigationStep?.();
                        } catch (err: any) {
                          setApiError({
                            title: 'Navigation Step Execution Failed',
                            message: err?.message || 'Failed to execute autonomous navigation step',
                            retryAction: () => onExecuteNavigationStep?.(),
                          });
                        }
                      }}
                      disabled={isProcessingAction}
                      className={`mt-2 w-full py-2 rounded-xl text-xs font-bold ${emeraldBtnSolid} flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer`}
                    >
                      <Bot className="w-3.5 h-3.5 text-black" />
                      {isProcessingAction ? 'Naviq Executing...' : 'Execute Next Step'}
                    </button>
                  )}

                  {navigationSession.status === 'completed' && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200 flex flex-col items-center gap-1 text-center">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        DESTINATION ACHIEVED
                      </span>
                      <span>You have successfully arrived at your software goal.</span>
                    </div>
                  )}

                  <button
                    onClick={() => onStopNavigation?.()}
                    className="mt-1 w-full py-2 rounded-xl text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-3 h-3" />
                    STOP NAVIGATION
                  </button>
                </div>
              </>
            )}

            {/* Mission Overview & Progress Card (Only shown for real-world tasks, not navigation) */}
            {activeTask && !navigationSession && (
              <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex flex-col gap-3 shadow-lg bg-gray-950/70`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Mission Status
                  </span>
                  <span className="text-xs font-bold text-emerald-400">{activeTask.progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                    style={{ width: `${activeTask.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Target: <strong className="text-gray-200">{activeTask.companyOrTarget}</strong></span>
                  <span>Value: <strong className="text-emerald-300">{activeTask.monetaryValue || 'Digital Fix'}</strong></span>
                </div>
              </div>
            )}

            {/* AI Agent Reasoning & Rationale Card (Only shown for real-world tasks, not navigation) */}
            {activeTask && !navigationSession && (
              <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex flex-col gap-2.5 shadow-lg bg-gray-950/70`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    Naviq Autonomous Rationale
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {activeTask.autonomyLevel}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {activeTask.reasoningRationale || activeTask.summary}
                </p>

                <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Time saved: <strong className="text-emerald-300">{activeTask.estimatedTimeSaved}</strong></span>
                  <span>Category: <strong className="text-gray-200">{activeTask.category}</strong></span>
                </div>
              </div>
            )}

            {/* Execution Steps & Evidence Timeline (Only shown for real-world tasks, not navigation) */}
            {activeTask && !navigationSession && (
              <div className={`p-4 rounded-2xl ${glass} border border-emerald-500/20 flex flex-col gap-3 shadow-lg bg-gray-950/70`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Investigation Timeline ({activeTask.steps.length} steps)
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {activeTask.steps.map((step, index) => {
                    const isExpanded = expandedStepId === step.id;
                    return (
                      <div
                        key={step.id}
                        className={`rounded-xl border transition-all ${
                          step.status === 'in_progress'
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-white/[0.02] border-white/5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleStepDetails(step.id)}
                          className="w-full p-3 flex items-center justify-between gap-3 text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getStepIcon(step.status)}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-gray-200 truncate">
                                {step.title}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate">
                                {step.description}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">{step.timestamp}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && step.details && (
                          <div className="px-3.5 pb-3 pt-1 text-[11px] text-gray-300 border-t border-white/5 leading-relaxed bg-black/20">
                            {step.details}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-lg rounded-2xl ${glassModal} border border-emerald-500/40 p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>Approval Required</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-gray-200 leading-relaxed">
              <p className="font-semibold text-white mb-1">{activeTask.title}</p>
              <p className="text-xs text-gray-300">{activeTask.summary}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col gap-1.5 text-xs text-emerald-200">
              <div className="font-semibold">Next Autonomous Action:</div>
              <div>{activeTask.nextAction}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setApiError(null);
                    setShowApprovalModal(false);
                    await onReject(activeTask.id);
                  } catch (err: any) {
                    setApiError({
                      title: 'Task Cancellation Failed',
                      message: err?.message || 'Failed to reject mission task on server',
                      retryAction: () => onReject(activeTask.id),
                    });
                  }
                }}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors cursor-pointer"
              >
                Reject & Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setApiError(null);
                    setShowApprovalModal(false);
                    await onApprove(activeTask.id);
                  } catch (err: any) {
                    setApiError({
                      title: 'Task Execution Failed',
                      message: err?.message || 'Failed to execute approved mission task on server',
                      retryAction: () => onApprove(activeTask.id),
                    });
                  }
                }}
                disabled={isProcessingAction}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold ${emeraldBtnSolid} shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer`}
              >
                <Check className="w-4 h-4 text-black" />
                <span>Approve & Execute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Report Modal */}
      {showResolutionReport && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-2xl ${glassModal} border border-emerald-500/40 p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Resolution Report</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResolutionReport(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-white">{activeTask.title}</h3>
              <p className="text-xs text-gray-300">{activeTask.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col">
                <span className="text-[10px] text-gray-400">Value Recovered</span>
                <span className="text-base font-bold text-emerald-400">{activeTask.monetaryValue || 'Solved'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col">
                <span className="text-[10px] text-gray-400">Time Saved</span>
                <span className="text-base font-bold text-white">{activeTask.estimatedTimeSaved || '~45 mins'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Status: Successfully completed with verified proof and confirmation receipts.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResolutionReport(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Proof certificate downloaded successfully.');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${emeraldBtn} flex items-center gap-1.5`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Proof</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
