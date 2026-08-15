import React from 'react';
import { Building, AlertCircle, CheckCircle2, TrendingUp, Activity, Search, ShieldCheck, Compass, Link2, Box } from 'lucide-react';
import { glass } from '../lib/styles';

export const Customer360Panel: React.FC<{ actionResult: any }> = ({ actionResult }) => {
  if (!actionResult) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
        <Activity className="w-12 h-12 text-gray-700 mb-4 opacity-50" />
        <p className="text-sm">Naviq AI is standing by to investigate customer accounts.</p>
        <p className="text-xs text-gray-600 mt-2">Ask Naviq to prepare you for a meeting or analyze a customer.</p>
      </div>
    );
  }

  if (actionResult.type === 'customer_360') {
    const { account, issues, tasks, featureRequests, meetings } = actionResult.data;
    
    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className={`p-5 rounded-2xl ${glass} border border-emerald-500/20`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building className="w-5 h-5 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">{account.name}</h2>
              </div>
              <p className="text-sm text-gray-400">{account.industry} • {account.region} • {account.tier}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${account.health === 'At Risk' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {account.health}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-black/30 p-3 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ARR</p>
              <p className="text-xl font-bold text-emerald-100">${account.arr.toLocaleString()}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Owner</p>
              <p className="text-xl font-bold text-emerald-100">{account.owner}</p>
            </div>
          </div>
        </div>

        {issues && issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-400" /> Attention Required (Issues)
            </h3>
            <div className="space-y-2">
              {issues.map((issue: any) => (
                <div key={issue.id} className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-200">{issue.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{issue.category} • {issue.id}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${issue.status === 'Open' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : issue.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" /> Open Work (Tasks)
            </h3>
            <div className="space-y-2">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-200">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {task.due} • {task.assignee}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${task.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {meetings && meetings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" /> Meeting Context
            </h3>
            <div className="space-y-2">
              {meetings.map((mtg: any, i: number) => (
                <div key={i} className="p-3 bg-black/40 rounded-xl border border-gray-800 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-200">{mtg.topic}</p>
                    <span className="text-xs text-gray-500">{mtg.date}</span>
                  </div>
                  <div className="text-xs text-gray-400 bg-white/5 p-2 rounded">
                    <span className="font-semibold">Actions:</span> {mtg.actionItems}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {featureRequests && featureRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Customer Requests
            </h3>
            <div className="space-y-2">
              {featureRequests.map((fr: any, i: number) => (
                <div key={i} className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-200">{fr.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{fr.productArea} • {fr.mentions} mentions</p>
                  </div>
                  <span className="text-xs font-semibold text-purple-300">${fr.estimatedRevenueImpact.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (actionResult.type === 'at_risk_accounts') {
    return (
        <div className="h-full p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-white mb-4">Accounts At Risk</h2>
            {actionResult.data.map((acc: any) => (
                <div key={acc.id} className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-red-100">{acc.name}</h3>
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">At Risk</span>
                    </div>
                    <p className="text-sm text-gray-400">Owner: {acc.owner} • ARR: ${acc.arr.toLocaleString()}</p>
                </div>
            ))}
        </div>
    )
  }
  
  if (actionResult.type === 'feature_opportunities') {
    return (
        <div className="h-full p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" /> Feature Opportunities</h2>
            {actionResult.data.map((fr: any, i: number) => (
                <div key={i} className="p-4 bg-purple-950/20 border border-purple-900/50 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-md font-bold text-purple-100">{fr.title}</h3>
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                          ${fr.estimatedRevenueImpact.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <span className="bg-white/5 px-2 py-1 rounded">Mentions: {fr.mentions}</span>
                      <span className="bg-white/5 px-2 py-1 rounded">Area: {fr.productArea}</span>
                      <span className="bg-white/5 px-2 py-1 rounded">Status: {fr.status}</span>
                    </div>
                    {fr.accountsRequesting && fr.accountsRequesting.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                         <span className="font-semibold text-gray-400">Requested by:</span> {fr.accountsRequesting.join(', ')}
                      </div>
                    )}
                </div>
            ))}
        </div>
    )
  }

  if (actionResult.type === 'search_results') {
    const { accounts, issues, tasks, featureRequests, meetings } = actionResult.data;
    
    return (
      <div className="h-full p-6 space-y-6 overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Search className="w-5 h-5 text-emerald-400" /> Data Search Results</h2>
        
        {accounts && accounts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2"><Building className="w-4 h-4 text-emerald-400"/> Accounts</h3>
            {accounts.map((a: any) => (
              <div key={a.id} className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex justify-between">
                <div><div className="text-sm font-bold text-white">{a.name}</div><div className="text-xs text-gray-400">{a.industry}</div></div>
                <div className="text-sm text-emerald-400 font-bold">${a.arr.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {issues && issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-400"/> Issues</h3>
            {issues.map((i: any) => (
              <div key={i.id} className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <div className="text-sm font-bold text-white">{i.title}</div>
                <div className="text-xs text-gray-400">{i.account} • {i.status}</div>
              </div>
            ))}
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2"><Compass className="w-4 h-4 text-blue-400"/> Tasks</h3>
            {tasks.map((t: any) => (
              <div key={t.id} className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <div className="text-sm font-bold text-white">{t.title}</div>
                <div className="text-xs text-gray-400">{t.account} • {t.priority}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 text-gray-400">
      <pre className="text-xs font-mono overflow-auto h-full">{JSON.stringify(actionResult, null, 2)}</pre>
    </div>
  );
};
