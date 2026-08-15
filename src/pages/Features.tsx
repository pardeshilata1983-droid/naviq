import React, { useState, useEffect } from 'react';
import { Search, Box, Sparkles, TrendingUp, Users } from 'lucide-react';
import { api } from '../services/api';
import { glass } from '../lib/styles';

export const Features: React.FC<{ onAskAgent: (q: string) => void }> = ({ onAskAgent }) => {
  const [features, setFeatures] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getFeatures().then(res => {
      setFeatures(res);
      setIsLoading(false);
    });
  }, []);

  const filtered = features.filter(f => {
    if (search && !f.title.toLowerCase().includes(search.toLowerCase()) && !f.productArea.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRequests = features.length;
  const openRequests = features.filter(f => f.status !== 'Released' && f.status !== 'Closed').length;
  const totalRevenueImpact = features.reduce((sum, f) => sum + f.estimatedRevenueImpact, 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Box className="w-8 h-8 text-emerald-400" /> Feature Requests
          </h1>
          <p className="text-gray-400">Track feature gaps and revenue impact.</p>
        </div>
        <button 
          onClick={() => onAskAgent("Which feature has the highest revenue impact and which customers are requesting it?")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" /> AI Feature Insights
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-6 rounded-2xl ${glass} border border-white/10`}>
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Box className="w-4 h-4" /> Total Requests
          </div>
          <div className="text-3xl font-bold text-white">{totalRequests} <span className="text-lg font-normal text-gray-500">/ {openRequests} Open</span></div>
        </div>
        <div className={`p-6 rounded-2xl ${glass} border border-white/10`}>
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Potential Revenue Impact
          </div>
          <div className="text-3xl font-bold text-emerald-400">${totalRevenueImpact.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search features or product areas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Loading feature requests...</div>
      ) : (
        <div className={`rounded-2xl ${glass} border border-white/10 overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider bg-white/[0.02]">
                <th className="p-4 font-medium">Feature</th>
                <th className="p-4 font-medium">Product Area</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Mentions</th>
                <th className="p-4 font-medium">Revenue Impact</th>
                <th className="p-4 font-medium">Accounts Requesting</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm text-gray-200 font-medium">{f.title}</td>
                  <td className="p-4 text-sm text-gray-400">{f.productArea}</td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded-md font-medium bg-white/5 text-gray-400 border border-white/10">
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{f.mentions}</td>
                  <td className="p-4 text-sm text-emerald-400 font-medium">+${f.estimatedRevenueImpact.toLocaleString()}</td>
                  <td className="p-4 text-sm text-gray-400 flex flex-wrap gap-1">
                    {f.accountsRequesting.map((acc: string, idx: number) => (
                      <span key={idx} className="bg-black/30 px-2 py-0.5 rounded text-xs border border-white/5">{acc}</span>
                    ))}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No feature requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
