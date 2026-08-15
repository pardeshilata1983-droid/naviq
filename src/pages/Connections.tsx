import React from 'react';
import {
  Mail,
  Calendar,
  Globe,
  HardDrive,
  ShoppingBag,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Power,
} from 'lucide-react';
import { Connection } from '../types';
import { glass, glass2, emeraldBtnSolid, emeraldBtn } from '../lib/styles';

interface ConnectionsProps {
  connections: Connection[];
  onToggleConnection: (id: string) => Promise<void>;
}

export const Connections: React.FC<ConnectionsProps> = ({
  connections,
  onToggleConnection,
}) => {
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'gmail':
        return <Mail className="w-5 h-5 text-red-400" />;
      case 'google calendar':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'browser agent':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'google drive / storage':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'amazon india':
        return <ShoppingBag className="w-5 h-5 text-orange-400" />;
      case 'whatsapp alerts':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'upi & banking statements':
        return <CreditCard className="w-5 h-5 text-teal-400" />;
      default:
        return <Globe className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        );
      case 'needs_attention':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Needs Attention
          </span>
        );
      default:
        return (
          <span className="text-[11px] text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">
            Not Connected
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Connect the places Naviq works for you.
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Naviq operates securely across your authorized accounts to locate order proofs and resolve claims.
        </p>
      </div>

      {/* Security Banner */}
      <div className={`p-4 rounded-2xl ${glass2} border border-emerald-500/20 flex items-center justify-between gap-3 text-xs text-emerald-300`}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Credentials remain protected in hardware enclave storage. Naviq only searches receipts and documents relevant to active tasks.
          </span>
        </div>
      </div>

      {/* Grid of Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={`p-5 rounded-2xl ${glass} border border-white/5 hover:border-emerald-500/20 transition-all flex flex-col justify-between gap-4`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    {getIcon(conn.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{conn.name}</h3>
                    <span className="text-[11px] text-gray-400">{conn.category}</span>
                  </div>
                </div>

                {getStatusBadge(conn.status)}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mt-2">{conn.description}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-500">
                {conn.lastSynced ? `Synced: ${conn.lastSynced}` : 'Inactive'}
              </span>

              <button
                onClick={() => onToggleConnection(conn.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  conn.status === 'connected'
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20'
                    : emeraldBtnSolid
                }`}
              >
                {conn.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
