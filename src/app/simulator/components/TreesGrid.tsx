import React from "react";

export const TreesGrid: React.FC<{ count: number; color: string }> = ({ count, color }) => {
  return (
    <div className="grid grid-cols-4 gap-2 justify-center py-2 shrink-0">
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="text-lg transition-all duration-500"
          style={{
            opacity: i < count ? 1 : 0.15,
            transform: i < count ? "scale(1.05)" : "scale(0.8)",
            filter: i < count ? `drop-shadow(0 2px 4px ${color}33)` : "none",
          }}
        >
          🌲
        </span>
      ))}
    </div>
  );
};
