import React from "react";

export const ThermometerFill: React.FC<{ fillPercent: number; colorClass: string }> = ({ fillPercent, colorClass }) => {
  return (
    <div className="w-4 h-28 bg-zinc-800 rounded-full relative overflow-hidden border border-white/5 shrink-0">
      <div 
        className="absolute bottom-0 w-full rounded-full transition-all duration-700 ease-out" 
        style={{ height: `${fillPercent}%`, backgroundColor: colorClass }}
      />
    </div>
  );
};
