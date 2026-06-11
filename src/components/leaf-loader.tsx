"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const LeafLoader: React.FC = () => {
  // Generate stable particle offsets to prevent hydration mismatch
  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 4) + 2,
      startX: (Math.random() - 0.5) * 30,
      startY: (Math.random() - 0.5) * 30,
      endX: (Math.random() - 0.5) * 120,
      endY: -100 - Math.random() * 100,
      duration: 2.5 + Math.random() * 2.5,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0F0A]">
      {/* Container holding loader, leaf & particles */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        
        {/* Glowing Halo Background */}
        <motion.div
          className="absolute w-28 h-28 rounded-full bg-accent-dim/20 filter blur-xl"
          animate={{
            scale: [0.9, 1.15, 0.9],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 40px rgba(0, 230, 118, 0.35), 0 0 80px rgba(29, 233, 182, 0.2)",
          }}
        />

        {/* Twirling dust particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-accent to-secondary opacity-0"
            style={{
              width: p.size,
              height: p.size,
              x: p.startX,
              y: p.startY,
            }}
            animate={{
              x: [p.startX, p.endX],
              y: [p.startY, p.endY],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.2],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Infinitely Rotating & Bouncing Leaf */}
        <motion.div
          className="relative w-20 h-20 flex items-center justify-center cursor-wait"
          animate={{
            rotate: 360,
            scale: [0.93, 1.07, 0.93],
            y: [-3, 3, -3],
          }}
          transition={{
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            },
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
            y: {
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
        >
          {/* Leaf SVG Icon */}
          <svg
            className="w-full h-full drop-shadow-[0_0_12px_rgba(0,230,118,0.6)]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E676" />
                <stop offset="100%" stopColor="#1DE9B6" />
              </linearGradient>
            </defs>
            <path
              d="M21.3 2.7C18.9 1.9 14 3 10.6 6.4C7.2 9.8 6.2 14.6 6.3 18L2.7 21.6C2.3 22 2.3 22.6 2.7 23C2.9 23.2 3.2 23.3 3.5 23.3S4.1 23.2 4.3 23L7.9 19.4C11.3 19.5 16.1 18.5 19.5 15.1C22.9 11.7 24 6.8 21.3 2.7ZM17.4 13.1C15 15.5 11 16.3 8 15.8C9.3 14 11.2 11.8 13.5 9.5C13.9 9.1 13.9 8.5 13.5 8.1C13.1 7.7 12.5 7.7 12.1 8.1C9.8 10.4 7.6 12.3 5.8 13.6C5.3 10.6 6.1 6.6 8.5 4.2C11 1.7 14.7 0.9 16.6 1.3C18.6 7.5 19.9 10.6 17.4 13.1Z"
              fill="url(#leafGrad)"
            />
          </svg>
        </motion.div>
      </div>

      {/* Nature loading text */}
      <motion.div
        className="mt-6 font-syne font-bold text-xs uppercase tracking-[0.25em] text-emerald-300 flex items-center gap-1.5"
        animate={{
          opacity: [0.4, 0.9, 0.4],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span>Synchronizing Ecology</span>
      </motion.div>
    </div>
  );
};
