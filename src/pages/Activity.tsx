import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileSearch,
  Zap,
  ChevronRight,
  Bot,
  Activity as ActivityIcon,
} from 'lucide-react';
import { ActivityItem } from '../types';
import { glass, glass2 } from '../lib/styles';

interface ActivityProps {
  activityLog: ActivityItem[];
  onOpenMission: (missionId: string) => void;
}

export const Activity: React.FC<ActivityProps> = ({ activityLog, onOpenMission }) => {
  const grouped: { [group: string]: ActivityItem[] } = {
    Today: [],
    Yesterday: [],
    'Earlier this week': [],
  };

  activityLog.forEach((item) => {
    if (grouped[item.dayGroup]) {
      grouped[item.dayGroup].push(item);
    } else {
      grouped['Earlier this week'].push(item);
    }
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'approval':
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      case 'resolution':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'evidence':
        return <FileSearch className="w-4 h-4 text-emerald-400" />;
      case 'action':
        return <Zap className="w-4 h-4 text-emerald-300" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Bot className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <ActivityIcon className="w-6 h-6 text-emerald-400" />
          <span>Activity Log</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Real-time record of investigations, evidence discoveries, and actions executed by Naviq.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {Object.entries(grouped).map(([groupTitle, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={groupTitle} className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest px-1">
                {groupTitle}
              </span>

              <div className={`rounded-2xl ${glass} border border-white/5 divide-y divide-white/5 overflow-hidden`}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.missionId && onOpenMission(item.missionId)}
                    className={`p-4 flex items-start gap-4 transition-colors ${
                      item.missionId ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <div className="w-14 text-[11px] font-mono text-gray-400 pt-0.5 shrink-0">
                      {item.time}
                    </div>

                    {/* Icon */}
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 shrink-0">
                      {getActivityIcon(item.type)}
                    </div>

                    {/* Description */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-200">{item.title}</span>
                        {item.missionTitle && (
                          <span className="text-[10px] text-emerald-400/90 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 truncate">
                            {item.missionTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>

                    {item.missionId && (
                      <ChevronRight className="w-4 h-4 text-gray-500 shrink-0 self-center" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
