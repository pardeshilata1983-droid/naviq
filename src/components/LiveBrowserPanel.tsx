import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Lock,
  RotateCcw,
  ExternalLink,
  Square,
  Sparkles,
  Search,
  MousePointer,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Terminal,
  Activity,
  ShieldCheck,
  Eye,
  Navigation,
  Crosshair,
} from 'lucide-react';
import {
  BrowserSessionState,
  BrowserCursorState,
  BrowserActionLog,
  BrowserInteractiveElement,
  FixMission,
  NavigationStep,
  NavigationMode,
} from '../types';
import { glass, glassModal, emeraldBtn, emeraldBtnSolid } from '../lib/styles';

interface LiveBrowserPanelProps {
  taskId: string;
  task?: FixMission | null;
  authToken?: string | null;
  navigationStep?: NavigationStep | null;
  navigationMode?: NavigationMode;
  onStopAutomation?: () => void;
  onRefresh?: () => void;
  onStepTargetClick?: () => void;
}

export const LiveBrowserPanel: React.FC<LiveBrowserPanelProps> = ({
  taskId,
  task,
  authToken,
  navigationStep,
  navigationMode = 'guide_me',
  onStopAutomation,
  onRefresh,
  onStepTargetClick,
}) => {
  const [sessionState, setSessionState] = useState<BrowserSessionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showElementsOverlay, setShowElementsOverlay] = useState<boolean>(false);
  const [showLogsOverlay, setShowLogsOverlay] = useState<boolean>(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Poll / SSE setup
  useEffect(() => {
    let isMounted = true;

    const fetchState = async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch(`/api/browser/state/${taskId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.session) {
            setSessionState(data.session);
            setIsLoading(false);
          }
        }
      } catch (err) {
        // Continue
      }
    };

    // Initial fetch
    fetchState();

    // Setup Polling / SSE
    const interval = setInterval(fetchState, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [taskId, authToken]);

  // Click ripple effect trigger
  useEffect(() => {
    if (sessionState?.cursor?.action === 'click') {
      const { normalizedX, normalizedY } = sessionState.cursor;
      setClickRipple({
        x: normalizedX * 100,
        y: normalizedY * 100,
        id: Date.now(),
      });
      const timer = setTimeout(() => setClickRipple(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [sessionState?.cursor?.timestamp, sessionState?.cursor?.action]);

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      await fetch(`/api/tasks/${taskId}/stop`, {
        method: 'POST',
        headers,
      });

      if (onStopAutomation) onStopAutomation();
    } catch (err) {
      console.warn('Stop failed:', err);
    } finally {
      setIsStopping(false);
    }
  };

  const handleManualAction = async (actionType: 'click' | 'type' | 'inspect' | 'screenshot', params?: any) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/tasks/${taskId}/browser-action`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ actionType, params }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSessionState(data.session);
        }
      }
    } catch (err) {
      console.warn('Manual action failed:', err);
    }
  };

  const currentUrl = sessionState?.url || task?.browserSimulation?.targetUrl || 'https://www.google.com';
  const pageTitle = sessionState?.title || task?.companyOrTarget ? `${task.companyOrTarget} Portal` : 'Active Browser Session';
  const cursor = sessionState?.cursor;

  // Normalized cursor coordinates for absolute positioning
  const cursorLeftPercent = cursor ? cursor.normalizedX * 100 : 50;
  const cursorTopPercent = cursor ? cursor.normalizedY * 100 : 50;

  return (
    <div
      id="live-browser-panel"
      ref={containerRef}
      className={`rounded-2xl ${glass} border border-emerald-500/25 flex flex-col overflow-hidden shadow-2xl bg-gray-950/90 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'w-full h-full min-h-[440px]'
      }`}
    >
      {/* Top Browser Window Navigation Bar */}
      <div className="p-3 bg-gray-900/95 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Left: Window Controls + Branding */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 border border-red-400/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-400/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-400/30" />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 pl-1 border-l border-white/10">
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[200px] text-white">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* Center: Real Omnibox URL Bar */}
        <div className="flex-1 min-w-[220px] max-w-xl mx-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-gray-300 truncate flex-1 select-all">{currentUrl}</span>
          {sessionState?.httpStatus && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-sans font-bold">
              {sessionState.httpStatus} OK
            </span>
          )}
        </div>

        {/* Right: Actions (Stop button, Refresh, Fullscreen, Inspector) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Stop Automation Button */}
          <button
            type="button"
            id="browser-stop-button"
            onClick={handleStop}
            disabled={isStopping || sessionState?.isStopped}
            title="Stop autonomous browser execution immediately"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sessionState?.isStopped
                ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 hover:border-red-400 active:scale-95 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
            }`}
          >
            <Square className="w-3 h-3 fill-current" />
            <span>{sessionState?.isStopped ? 'Stopped' : 'Stop'}</span>
          </button>

          {/* Refresh Snapshot */}
          <button
            type="button"
            onClick={() => handleManualAction('screenshot')}
            title="Refresh current page snapshot"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Inspect Elements Toggle */}
          <button
            type="button"
            onClick={() => setShowElementsOverlay(!showElementsOverlay)}
            title="Toggle interactive elements overlay"
            className={`p-1.5 rounded-xl transition-colors border ${
              showElementsOverlay
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Terminal / Logs Toggle */}
          <button
            type="button"
            onClick={() => setShowLogsOverlay(!showLogsOverlay)}
            title="Toggle live execution logs"
            className={`p-1.5 rounded-xl transition-colors border ${
              showLogsOverlay
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Browser Viewport Stage */}
      <div className="relative flex-1 bg-gray-950 overflow-hidden flex items-center justify-center min-h-[320px]">
        {/* Real Playwright Screenshot Canvas */}
        {sessionState?.screenshot ? (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <div className="relative inline-block max-w-full max-h-full rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-black">
              <img
                src={sessionState.screenshot}
                alt="Real browser automation view"
                className="w-full h-auto max-h-[70vh] object-contain block pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />

              {/* REAL VISIBLE CURSOR OVERLAY */}
              <div
                id="real-browser-cursor"
                style={{
                  left: `${cursorLeftPercent}%`,
                  top: `${cursorTopPercent}%`,
                  transform: 'translate(-2px, -2px)',
                  transition: 'left 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                className="absolute z-30 pointer-events-none flex flex-col items-start"
              >
                {/* Click Ripple Animation */}
                {clickRipple && (
                  <div className="absolute -left-3 -top-3 w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-400/20 animate-ping" />
                )}

                {/* SVG Pointer Arrow */}
                <div className="relative flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transform -rotate-12 transition-transform duration-150"
                  >
                    <path
                      d="M5.5 3.5L18.5 13.5L12 14.5L9.5 20.5L6.5 19.5L9 13.5L5.5 3.5Z"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Action Chip Label */}
                {cursor?.label && (
                  <div className="mt-1 px-2.5 py-1 rounded-lg bg-gray-950/95 border border-emerald-400 text-[10px] font-semibold text-emerald-200 shadow-xl whitespace-nowrap flex items-center gap-1 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{cursor.label}</span>
                  </div>
                )}
              </div>

              {/* NAVIGATION STEP VISUAL SPOTLIGHT ("Google Maps for Software") */}
              {navigationStep && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {(() => {
                    const bbox = navigationStep.targetBoundingBox || {
                      x: 600,
                      y: 200,
                      width: 140,
                      height: 48,
                    };
                    const vpWidth = sessionState.viewport?.width || 1280;
                    const vpHeight = sessionState.viewport?.height || 800;

                    const leftPct = (bbox.x / vpWidth) * 100;
                    const topPct = (bbox.y / vpHeight) * 100;
                    const widthPct = (bbox.width / vpWidth) * 100;
                    const heightPct = (bbox.height / vpHeight) * 100;

                    return (
                      <div
                        id={`navigation-spotlight-step-${navigationStep.id}`}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                        }}
                        className="absolute pointer-events-auto cursor-pointer group"
                        onClick={() => onStepTargetClick?.()}
                        title={`Step ${navigationStep.id}: ${navigationStep.instruction}`}
                      >
                        {/* Outer pulsing ring beacon */}
                        <div className="absolute -inset-4 rounded-xl border-2 border-emerald-400/50 bg-emerald-500/5 animate-pulse shadow-[0_0_35px_rgba(16,185,129,0.5)]" />

                        {/* Inner crisp highlight box */}
                        <div className="absolute inset-0 rounded-lg border-2 border-emerald-400 bg-emerald-400/10 group-hover:bg-emerald-400/30 transition-all flex items-center justify-center shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]">
                          <Crosshair className="w-4 h-4 text-emerald-300 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        </div>

                        {/* Floating Callout Pointer Badge */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-40">
                          <div className="px-4 py-1.5 rounded-full bg-black/90 border border-emerald-400 text-[11px] font-bold text-emerald-300 shadow-[0_10px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xl">
                            <Navigation className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                            <span className="tracking-tight uppercase">TURN {navigationStep.id}: {navigationStep.target}</span>
                          </div>
                          <div className="w-2.5 h-2.5 rotate-45 bg-emerald-400 -mt-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Interactive Elements Overlay (when toggled) */}
              {showElementsOverlay && sessionState.interactiveElements && (
                <div className="absolute inset-0 pointer-events-none">
                  {sessionState.interactiveElements.map((el) => (
                    <div
                      key={el.id}
                      style={{
                        left: `${(el.x / sessionState.viewport.width) * 100}%`,
                        top: `${(el.y / sessionState.viewport.height) * 100}%`,
                        width: `${(el.width / sessionState.viewport.width) * 100}%`,
                        height: `${(el.height / sessionState.viewport.height) * 100}%`,
                      }}
                      className="absolute border border-emerald-400/60 bg-emerald-500/10 rounded pointer-events-auto cursor-pointer hover:bg-emerald-500/30 transition-colors group"
                      onClick={() => handleManualAction('click', { selector: el.selector, text: el.text })}
                      title={`Click: ${el.text || el.selector}`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-black/90 text-[9px] text-emerald-300 border border-emerald-500/30 whitespace-nowrap z-40">
                        {el.text || el.tagName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Connecting / Loading State */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Globe className="w-7 h-7 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Naviq Navigation Engine
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Establishing route to {currentUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Initializing secure container browser session...</span>
            </div>
          </div>
        )}

        {/* Live Execution Logs Overlay */}
        {showLogsOverlay && sessionState?.logs && (
          <div className="absolute bottom-2 left-2 right-2 max-h-48 overflow-y-auto rounded-xl bg-black/90 border border-emerald-500/30 p-3 shadow-2xl font-mono text-[11px] flex flex-col gap-1.5 z-40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1 border-b border-white/10 text-emerald-400 font-bold text-xs">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Playwright Tool Activity Stream</span>
              </div>
              <span className="text-[10px] text-gray-400">{sessionState.logs.length} events</span>
            </div>

            <div className="flex flex-col gap-1">
              {sessionState.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-gray-300">
                  <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                  <span className="text-emerald-400 font-semibold shrink-0">{log.action}:</span>
                  <span className="text-gray-300 truncate">{log.details}</span>
                  {log.executionTimeMs && (
                    <span className="text-gray-500 text-[10px] ml-auto shrink-0">
                      +{log.executionTimeMs}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3.5 py-2 bg-gray-900/95 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-300 font-medium">
            {sessionState?.statusMessage || 'Live Browser Controller Active'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-gray-500">
            Engine: <strong className="text-emerald-400">Playwright Chromium (Headless)</strong>
          </span>
          <span className="hidden sm:inline text-gray-500">
            Viewport: <strong className="text-gray-300">1280 × 800</strong>
          </span>
          {sessionState?.interactiveElements && (
            <span className="text-gray-400">
              DOM Controls: <strong className="text-emerald-300">{sessionState.interactiveElements.length}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
