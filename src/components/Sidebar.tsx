import React from 'react';
import {
  Home as HomeIcon,
  Map,
  Compass,
  History,
  Link2,
  FolderLock,
  Settings as SettingsIcon,
  Bell,
  Sparkles,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { Mic } from 'lucide-react';
import { Logo } from './Logo';
import { glass } from '../lib/styles';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user?: UserProfile | null;
  activeMissionCount?: number;
  unreadNotificationCount?: number;
  onToggleNotifications: () => void;
  isNotificationOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  activeMissionCount = 0,
  unreadNotificationCount = 0,
  onToggleNotifications,
  isNotificationOpen,
}) => {
  
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Send transcript to agent or populate input - we can emit an event or call a prop
          const customEvent = new CustomEvent('naviq-voice-input', { detail: transcript });
          window.dispatchEvent(customEvent);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech') { console.error('Speech recognition error', event.error); }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  };

const navItems: {id: string, label: string, icon: any, isPulse?: boolean, badge?: number}[] = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'agent', label: 'Naviq Agent', icon: Navigation, isPulse: activeMissionCount > 0 },
    { id: 'customers', label: 'Customers', icon: Map },
    { id: 'issues', label: 'Issues', icon: ShieldCheck },
    { id: 'tasks', label: 'Tasks', icon: Compass },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'meetings', label: 'Meetings', icon: Link2 },
    { id: 'activity', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Naviq User';
  const userInitials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'FL';

  return (
    <>
      {/* Desktop Floating Navigation Rail */}
      <aside
        id="naviq-sidebar-desktop"
        className={`hidden md:flex flex-col justify-between w-64 h-[calc(100vh-2rem)] my-4 ml-4 rounded-2xl ${glass} p-4 z-40 relative select-none`}
      >
        {/* Top Header & Logo */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2 pt-1">
            <Logo size="md" onClick={() => onSelectTab('home')} />
            <button
              id="sidebar-notifications-btn"
              onClick={onToggleNotifications}
              className={`relative p-2 rounded-xl border transition-all ${
                isNotificationOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/5'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center shadow-[0_0_8px_#10b981]">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-gray-400'}`} />
                      {item.isPulse && !isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      )}
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'agent' && activeMissionCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {/* Floating Microphone Button */}
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-50">
            <button
              onClick={toggleListening}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              }`}
              title={isListening ? 'Listening...' : 'Tap to speak'}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Bottom User Profile & Autonomy Trust Status */}
        <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/15 text-xs text-emerald-300/80">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Route Privacy</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/15 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <div
            id="sidebar-user-profile"
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black font-semibold text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              {userInitials}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-medium text-gray-200 truncate">{userDisplayName}</span>
              <span className="text-[11px] text-emerald-400/80 truncate flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Autonomous Engine
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Bottom Bar */}
      <nav
        id="naviq-mobile-navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 py-2 ${glass} border-t border-white/10 flex items-center justify-around`}
        aria-label="Mobile Navigation"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'text-emerald-300' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                {item.id === 'agent' && activeMissionCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
