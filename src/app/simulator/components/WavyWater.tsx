import React from "react";

export const WavyWater: React.FC<{ heightPercent: number; colorClass: string }> = ({ heightPercent, colorClass }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-xl" style={{ height: `${heightPercent}%` }}>
      <svg viewBox="0 0 100 20" className="w-full h-8 absolute top-0 -mt-3.5 fill-current fill-zinc-200" style={{ color: colorClass }}>
        <path d="M 0 10 Q 25 15, 50 10 T 100 10 L 100 20 L 0 20 Z">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values="
              M 0 10 Q 25 15, 50 10 T 100 10 L 100 20 L 0 20 Z;
              M 0 10 Q 25 5, 50 10 T 100 10 L 100 20 L 0 20 Z;
              M 0 10 Q 25 15, 50 10 T 100 10 L 100 20 L 0 20 Z
            "
          />
        </path>
      </svg>
      <div className="w-full h-full" style={{ backgroundColor: colorClass }} />
    </div>
  );
};
