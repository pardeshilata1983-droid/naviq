import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#03100B]">
      {/* Top Right Atmospheric Glow */}
      <div 
        className="absolute -top-48 -right-48 w-[650px] h-[650px] rounded-full bg-emerald-900/15 blur-[140px] animate-subtle-glow"
        aria-hidden="true"
      />

      {/* Bottom Left Deep Emerald Glow */}
      <div 
        className="absolute -bottom-48 -left-48 w-[750px] h-[750px] rounded-full bg-emerald-600/12 blur-[160px]"
        aria-hidden="true"
      />

      {/* Center Subtle Luminescence */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[600px] rounded-full bg-emerald-950/20 blur-[180px]"
        aria-hidden="true"
      />

      {/* Subtle Noise / Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />
    </div>
  );
};
