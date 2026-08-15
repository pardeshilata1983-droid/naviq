import React, { useState, useEffect } from 'react';
import { Search, Link2 } from 'lucide-react';
import { api } from '../services/api';
import { glass } from '../lib/styles';

export const Meetings: React.FC<{ onAskAgent: (q: string) => void }> = ({ onAskAgent }) => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getMeetings().then(res => {
      setMeetings(res);
      setIsLoading(false);
    });
  }, []);

  const filtered = meetings.filter(m => {
    if (search && !m.topic.toLowerCase().includes(search.toLowerCase()) && !m.account.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Link2 className="w-8 h-8 text-emerald-400" /> Meeting Logs
          </h1>
          <p className="text-gray-400">Review recent discussions and action items.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search meetings or customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Loading meetings...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className={`p-6 rounded-2xl ${glass} border border-white/10 flex flex-col justify-between h-full hover:border-emerald-500/30 transition-colors`}>
              <div>
                <div className="text-xs text-gray-500 mb-2">{m.date}</div>
                <h3 className="text-lg font-bold text-white mb-1">{m.topic}</h3>
                <div className="text-sm text-emerald-400 font-medium mb-4">{m.account}</div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 mb-4">
                  <div className="text-xs text-gray-500 mb-1">Action Items:</div>
                  <div className="text-sm text-gray-300">{m.actionItems}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-3 border-t border-white/5 flex flex-wrap gap-1">
                Attendees: {m.attendees.map((att: string, idx: number) => (
                  <span key={idx} className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{att}</span>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">No meetings found.</div>
          )}
        </div>
      )}
    </div>
  );
};
