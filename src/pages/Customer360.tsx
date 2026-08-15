import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, AlertTriangle, CheckCircle, Activity, Box, Compass, Link2 } from 'lucide-react';
import { api } from '../services/api';
import { glass } from '../lib/styles';

export const Customer360: React.FC<{ customerName: string; onBack: () => void; onAskAgent: (q: string) => void }> = ({ customerName, onBack, onAskAgent }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getAccount360(customerName).then(res => {
      setData(res);
      setIsLoading(false);
    });
  }, [customerName]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading {customerName}...</div>;
  }

  if (!data || !data.account) {
    return <div className="p-8 text-center text-red-400">Customer not found.</div>;
  }

  const { account, issues, tasks, featureRequests, meetings } = data;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{account.name}</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className={`px-2 py-0.5 rounded font-medium ${
              account.health.toLowerCase() === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
              account.health.toLowerCase() === 'poor' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {account.health} Health
            </span>
            <span className="text-gray-400">{account.tier}</span>
            <span className="text-gray-400 font-mono">${account.arr.toLocaleString()} ARR</span>
            <span className="text-gray-400">{account.industry}</span>
            <span className="text-gray-400">{account.region}</span>
          </div>
        </div>
        <button 
          onClick={() => onAskAgent(`Tell me about the current status of ${account.name}`)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Ask Naviq about this customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues */}
        <div className={`p-6 rounded-2xl ${glass} border border-white/10`}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-400" /> Open Issues ({issues.length})
          </h3>
          <div className="flex flex-col gap-3">
            {issues.length === 0 ? <p className="text-sm text-gray-500">No open issues.</p> : issues.map((i: any) => (
              <div key={i.id} className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-200">{i.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/40 text-gray-400">{i.status}</span>
                </div>
                <div className="text-xs text-gray-500">{i.id} • {i.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className={`p-6 rounded-2xl ${glass} border border-white/10`}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" /> Active Tasks ({tasks.length})
          </h3>
          <div className="flex flex-col gap-3">
            {tasks.length === 0 ? <p className="text-sm text-gray-500">No active tasks.</p> : tasks.map((t: any) => (
              <div key={t.id} className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-200">{t.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${t.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-black/40 text-gray-400'}`}>{t.priority}</span>
                </div>
                <div className="text-xs text-gray-500">Assigned to {t.assignee} • Due {t.due}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className={`p-6 rounded-2xl ${glass} border border-white/10`}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" /> Feature Requests ({featureRequests.length})
          </h3>
          <div className="flex flex-col gap-3">
            {featureRequests.length === 0 ? <p className="text-sm text-gray-500">No feature requests.</p> : featureRequests.map((f: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-200">{f.title}</span>
                  <span className="text-xs text-emerald-400">+${f.estimatedRevenueImpact.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">{f.productArea} • {f.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meetings */}
        <div className={`p-6 rounded-2xl ${glass} border border-white/10`}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" /> Meetings ({meetings.length})
          </h3>
          <div className="flex flex-col gap-3">
            {meetings.length === 0 ? <p className="text-sm text-gray-500">No recent meetings.</p> : meetings.map((m: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="font-medium text-sm text-gray-200 mb-1">{m.topic}</div>
                <div className="text-xs text-gray-500 mb-2">{m.date}</div>
                <div className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                  <span className="font-medium text-gray-300 block mb-1">Action Items:</span>
                  {m.actionItems}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
