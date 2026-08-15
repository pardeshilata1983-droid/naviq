import React, { useRef, useEffect } from 'react';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onViewTask?: (taskId: string) => void;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onViewTask,
  emptyStateTitle = 'Naviq Conversation',
  emptyStateSubtitle = 'Ask questions or assign autonomous tasks to get real problems solved.',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <Bot className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-200 mb-1">{emptyStateTitle}</h3>
        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">{emptyStateSubtitle}</p>
      </div>
    );
  }

  return (
    <div id="conversation-message-stream" className="flex-1 flex flex-col w-full px-2 py-4 overflow-y-auto">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onViewTask={onViewTask} />
      ))}

      {/* Streaming / Loading Indicator */}
      {isLoading && (
        <div className="flex w-full gap-3.5 my-3 justify-start">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <Bot className="w-4 h-4 text-black" />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-medium text-gray-400">Naviq</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 animate-spin" /> Thinking...
              </span>
            </div>
            <div className="rounded-2xl p-4 text-sm bg-gray-900/60 border border-white/10 text-gray-400 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs">Analyzing request & formulating response...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-2 shrink-0" />
    </div>
  );
};
