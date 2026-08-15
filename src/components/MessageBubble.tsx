import React, { useState } from 'react';
import { Bot, User, Check, Copy, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { ChatMessage, FixMission } from '../types';
import { glass } from '../lib/styles';

interface MessageBubbleProps {
  message: ChatMessage;
  onViewTask?: (taskId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onViewTask }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`flex w-full gap-3.5 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)] mt-0.5">
          <Bot className="w-4 h-4 text-black" />
        </div>
      )}

      {/* Bubble Content */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header (Sender + Time + Intent Tag) */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-medium text-gray-400">
            {isUser ? 'You' : 'Naviq'}
          </span>
          <span className="text-[10px] text-gray-500">{message.timestamp}</span>

          {!isUser && message.intent && message.intent !== 'conversation' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              {message.intent === 'task_request'
                ? 'Autonomous Mission'
                : message.intent === 'approval_response'
                ? 'Approval Executed'
                : message.intent === 'task_update'
                ? 'Mission Updated'
                : message.intent === 'cancel_task'
                ? 'Mission Stopped'
                : 'Task Info'}
            </span>
          )}
        </div>

        {/* Bubble Box */}
        <div
          className={`relative group rounded-2xl p-4 text-sm leading-relaxed transition-all ${
            isUser
              ? 'bg-emerald-600/20 text-gray-100 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)] rounded-tr-sm'
              : `${glass} text-gray-200 border border-white/10 bg-gray-900/60 rounded-tl-sm`
          }`}
        >
          
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
                  <span className="text-gray-300">{log.replace(/^[✓●]s*/, '')}</span>
                </div>
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap font-normal select-text break-words">
            {message.text}
          </div>


          {/* Embedded Mission Snapshot if task attached to this message */}
          {message.task && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300 truncate max-w-[220px]">
                    {message.task.title}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {message.task.category}
                </span>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2">
                {message.task.summary}
              </p>

              {onViewTask && (
                <button
                  type="button"
                  onClick={() => onViewTask(message.task!.id)}
                  className="mt-1 flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/25 transition-all group-hover:border-emerald-500/40"
                >
                  <span>Inspect autonomous agent workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Copy Button for Assistant Messages */}
          {!isUser && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy message"
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
