import React from "react";

export const MiniSprig: React.FC = () => {
  return (
    <div className="w-14 h-14 shrink-0 relative flex items-center justify-center select-none bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-md">
        <defs>
          <linearGradient id="miniBodySim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>
        <path d="M 35,35 C 25,25 20,28 15,35 Z" fill="#22c55e" />
        <path d="M 65,35 C 75,25 80,28 85,35 Z" fill="#22c55e" />
        <ellipse cx="50" cy="65" rx="20" ry="24" fill="url(#miniBodySim)" />
        <circle cx="50" cy="42" r="18" fill="url(#miniBodySim)" />
        <circle cx="43" cy="38" r="2" fill="#ffffff" />
        <circle cx="57" cy="38" r="2" fill="#ffffff" />
        <path d="M 46,45 Q 50,49 54,45" fill="none" stroke="#14532d" strokeWidth="1" />
        <circle cx="50" cy="20" r="3" fill="#f472b6" />
      </svg>
    </div>
  );
};
