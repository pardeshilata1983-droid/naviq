import React, { useState, useEffect } from 'react';
import { Search, Compass, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { glass } from '../lib/styles';

export const Tasks: React.FC<{ onAskAgent: (q: string) => void }> = ({ onAskAgent }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getTasksData().then(res => {
      setTasks(res);
      setIsLoading(false);
    });
  }, []);

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.account.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'All' && t.priority.toLowerCase() !== filter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Compass className="w-8 h-8 text-emerald-400" /> Tasks
          </h1>
          <p className="text-gray-400">Manage and prioritize customer tasks.</p>
        </div>
        <button 
          onClick={() => onAskAgent("Prioritize my tasks for today and tell me what I should work on first.")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" /> AI Prioritize
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks or customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Urgent', 'High', 'Normal', 'Low'].map(f => (
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
        <div className="text-center text-gray-500 py-12">Loading tasks...</div>
      ) : (
        <div className={`rounded-2xl ${glass} border border-white/10 overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider bg-white/[0.02]">
                <th className="p-4 font-medium">Task ID</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Assignee</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 text-sm font-mono text-gray-400">{t.id}</td>
                  <td className="p-4 text-sm text-gray-200 font-medium">{t.title}</td>
                  <td className="p-4 text-sm text-gray-400">{t.account}</td>
                  <td className="p-4 text-sm text-gray-400">{t.assignee}</td>
                  <td className="p-4 text-sm text-gray-400">{t.due}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      t.priority === 'Urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      t.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
