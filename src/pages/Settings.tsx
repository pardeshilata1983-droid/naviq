import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Brain,
  Sliders,
  User,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MemoryItem, AgentPermission, UserProfile } from '../types';
import { glass, glass2, glassInput, emeraldBtnSolid, emeraldBtn } from '../lib/styles';

interface SettingsProps {
  user?: UserProfile | null;
  memoryItems: MemoryItem[];
  permissions: AgentPermission[];
  onUpdateMemory: (id: string, value: string) => Promise<void>;
  onResetMemory: () => Promise<void>;
  onUpdatePermission: (id: string, setting: 'on' | 'ask' | 'never') => Promise<void>;
  onSignOut: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  memoryItems,
  permissions,
  onUpdateMemory,
  onResetMemory,
  onUpdatePermission,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'permissions' | 'memory' | 'account'>('permissions');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleStartEditMemory = (item: MemoryItem) => {
    setEditingMemoryId(item.id);
    setEditValue(item.value);
  };

  const handleSaveMemory = async (id: string) => {
    await onUpdateMemory(id, editValue);
    setEditingMemoryId(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-6 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-emerald-400" />
          <span>Naviq Settings & Controls</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage autonomy boundaries, stored memories, and supervisor permissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Agent Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'memory'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>What Naviq Remembers</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'account'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account & Security</span>
        </button>
      </div>

      {/* Tab: Agent Permissions */}
      {activeTab === 'permissions' && (
        <div className="flex flex-col gap-4">
          <div className={`p-4 rounded-2xl ${glass2} border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5`}>
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              The server strictly enforces these permissions regardless of client state. Sensitive transactions are hard-locked from autonomous execution.
            </span>
          </div>

          <div className={`rounded-2xl ${glass} border border-white/5 divide-y divide-white/5 overflow-hidden`}>
            {permissions.map((perm) => (
              <div key={perm.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">{perm.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => onUpdatePermission(perm.id, 'on')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      perm.setting === 'on' ? 'bg-emerald-500 text-black font-semibold shadow-[0_0_10px_#10b981]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => onUpdatePermission(perm.id, 'ask')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      perm.setting === 'ask' ? 'bg-amber-400 text-black font-semibold shadow-[0_0_10px_#fbbf24]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Ask You
                  </button>
                  <button
                    onClick={() => onUpdatePermission(perm.id, 'never')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      perm.setting === 'never' ? 'bg-rose-500 text-white font-semibold shadow-[0_0_10px_#f43f5e]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Never
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: What Naviq Remembers */}
      {activeTab === 'memory' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Naviq stores context about your preferences to solve tasks without asking repetitive questions.
            </p>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to forget all stored agent memory?')) {
                  onResetMemory();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Forget Everything</span>
            </button>
          </div>

          <div className={`rounded-2xl ${glass} border border-white/5 divide-y divide-white/5 overflow-hidden`}>
            {memoryItems.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-xs sm:text-sm font-semibold text-white mt-0.5">{item.label}</h3>
                  <span className="text-[10px] text-gray-500">Last updated: {item.lastUpdated}</span>
                </div>

                <div className="flex items-center gap-2">
                  {editingMemoryId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={`px-3 py-1 rounded-lg text-xs ${glassInput}`}
                      />
                      <button
                        onClick={() => handleSaveMemory(item.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${emeraldBtnSolid}`}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-200 font-medium bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                        {item.value}
                      </span>
                      <button
                        onClick={() => handleStartEditMemory(item)}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Account */}
      {activeTab === 'account' && (
        <div className="flex flex-col gap-4">
          <div className={`p-6 rounded-2xl ${glass} border border-white/5 flex flex-col gap-4 max-w-xl`}>
            <h3 className="text-sm font-bold text-white">Naviq Account</h3>
            <div className="text-xs text-gray-300">
              <span className="text-gray-400 block">Logged in as:</span>
              <span className="font-semibold text-white text-sm">{user?.email || 'user@naviq.ai'}</span>
            </div>

            <div className="text-xs text-gray-300">
              <span className="text-gray-400 block">Supervisor Mode:</span>
              <span className="text-emerald-400 font-medium">Hardware Enclave Active (256-bit AES)</span>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <button
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

