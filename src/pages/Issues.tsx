import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { glass } from '../lib/styles';

export const Issues: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getIssues().then(res => {
      setIssues(res);
      setIsLoading(false);
    });
  }, []);

  const filtered = issues.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.account.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'All' && i.status.toLowerCase() !== filter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" /> Issues
          </h1>
          <p className="text-gray-400">Monitor customer problems and resolution status.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search issues or customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Open', 'In Progress', 'Closed'].map(f => (
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
        <div className="text-center text-gray-500 py-12">Loading issues...</div>
      ) : (
        <div className={`rounded-2xl ${glass} border border-white/10 overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider bg-white/[0.02]">
                <th className="p-4 font-medium">Issue ID</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="p-4 text-sm font-mono text-gray-400 group-hover:text-emerald-400 transition-colors">{i.id}</td>
                  <td className="p-4 text-sm text-gray-200 font-medium">{i.title}</td>
                  <td className="p-4 text-sm text-gray-400">{i.account}</td>
                  <td className="p-4 text-sm text-gray-400">{i.category}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      i.status === 'Open' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      i.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">No issues found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
