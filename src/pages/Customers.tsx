import React, { useState, useEffect } from 'react';
import { Search, Building2, AlertTriangle, CheckCircle, Activity, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { glass } from '../lib/styles';

export const Customers: React.FC<{ onSelectCustomer: (name: string) => void }> = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAccounts(), api.getIssues(), api.getTasksData()]).then(([accs, isss, tsks]) => {
      setCustomers(accs);
      setIssues(isss);
      setTasks(tsks);
      setIsLoading(false);
    });
  }, []);

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.owner.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'Healthy' && c.health.toLowerCase() !== 'good') return false;
    if (filter === 'At Risk' && (c.health.toLowerCase() === 'poor' || c.health.toLowerCase() === 'critical')) return false;
    if (filter === 'Enterprise' && c.tier.toLowerCase() !== 'enterprise') return false;
    if (filter === 'SMB' && c.tier.toLowerCase() !== 'smb') return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
          <p className="text-gray-400">Understand every customer from one place.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Healthy', 'At Risk', 'Enterprise', 'SMB'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-emerald-500 text-black' : 'bg-white/[0.05] text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Loading customers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const customerIssues = issues.filter(i => i.account === c.name && i.status !== 'Closed');
            const customerTasks = tasks.filter(t => t.account === c.name && t.status !== 'Completed');
            return (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.name)}
                className={`p-5 rounded-2xl ${glass} border border-white/10 hover:border-emerald-500/30 cursor-pointer transition-all hover:bg-white/[0.04]`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{c.tier}</span>
                      <span className="text-xs text-gray-400">${c.arr.toLocaleString()} ARR</span>
                    </div>
                  </div>
                  {c.health.toLowerCase() === 'good' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : c.health.toLowerCase() === 'poor' ? (
                    <Activity className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Open Issues</div>
                    <div className="text-lg font-semibold text-white">{customerIssues.length}</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Active Tasks</div>
                    <div className="text-lg font-semibold text-white">{customerTasks.length}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      {c.owner.charAt(0)}
                    </div>
                    {c.owner}
                  </div>
                  <div className="flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                    View <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
