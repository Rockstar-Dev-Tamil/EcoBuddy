"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SprigAvatarProps {
  state: "idle" | "thinking" | "happy" | "concerned" | "celebrating";
}

const confettiItems = Array.from({ length: 12 }).map((_, i) => {
  // Use deterministic sin/cos for coordinates to be completely pure
  const r1 = Math.sin(i * 12.34);
  const r2 = Math.cos(i * 56.78);
  const r3 = Math.sin(i * 90.12);
  return {
    id: i,
    x: r1 * 90,
    y: -70 - Math.abs(r2) * 90,
    rotate: r3 * 360,
    type: i % 3 === 0 ? "🌸" : i % 3 === 1 ? "🍃" : "✨",
    delay: i * 0.04,
  };
});

export const SprigAvatar: React.FC<SprigAvatarProps> = ({ state }) => {

  const floatingY = {
    animate: {
      y: state === "thinking" ? [-3, 3, -3] : state === "celebrating" ? [0, -18, 0] : [-8, 8, -8],
    },
    transition: {
      repeat: Infinity,
      duration: state === "thinking" ? 1.4 : state === "celebrating" ? 0.55 : 3.0,
      ease: "easeInOut" as const,
    }
  };

  const earRotationLeft = {
    idle: { rotate: [0, -4, 0] },
    thinking: { rotate: [-12, 8, -12] },
    happy: { rotate: -15 },
    concerned: { rotate: 28 },
    celebrating: { rotate: [0, -25, 0] }
  };

  const earRotationRight = {
    idle: { rotate: [0, 4, 0] },
    thinking: { rotate: [12, -8, 12] },
    happy: { rotate: 15 },
    concerned: { rotate: -28 },
    celebrating: { rotate: [0, 25, 0] }
  };

  const eyeScaleY = {
    idle: { scaleY: [1, 1, 0.1, 1, 1] },
    thinking: { scaleY: 0.85 },
    happy: { scaleY: 1 },
    concerned: { scaleY: 0.65 },
    celebrating: { scaleY: 1 }
  };

  const flowerScale = {
    idle: 0.75,
    thinking: 0.8,
    happy: 1.35,
    concerned: 0.35,
    celebrating: 1.7
  };

  return (
    <div className="relative w-52 h-52 flex items-center justify-center select-none">
      {/* Bioluminescent Aura Glow */}
      <motion.div
        animate={{
          scale: state === "thinking" ? [1, 1.25, 1] : state === "celebrating" ? [1, 1.35, 1] : [1, 1.05, 1],
          opacity: state === "concerned" ? 0.3 : [0.45, 0.75, 0.45],
        }}
        transition={{
          repeat: Infinity,
          duration: state === "thinking" ? 1.1 : 2.5,
          ease: "easeInOut",
        }}
        className={`absolute w-44 h-44 rounded-full blur-[35px] pointer-events-none transition-colors duration-500 ${
          state === "concerned" ? "bg-red-500/10" :
          state === "happy" || state === "celebrating" ? "bg-emerald-400/20" : "bg-[#00E676]/15"
        }`}
      />

      {/* Main Sprig Vector mesh */}
      <motion.div
        animate={floatingY.animate}
        transition={floatingY.transition}
        style={{ transformOrigin: "bottom center" }}
        className="relative w-40 h-40 flex items-center justify-center"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
          <defs>
            {/* Soft organic plant-wood textures */}
            <linearGradient id="sprigBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="60%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
            <linearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>

          {/* Left Leaf Ear */}
          <motion.path
            d="M 68,70 C 48,55 33,55 22,70 C 17,85 32,95 58,85 Z"
            fill="url(#leafGrad)"
            stroke="#114524"
            strokeWidth="2"
            style={{ transformOrigin: "68px 75px" }}
            animate={earRotationLeft[state]}
            transition={{ repeat: state === "idle" || state === "thinking" || state === "celebrating" ? Infinity : 0, duration: 1.5 }}
          />

          {/* Right Leaf Ear */}
          <motion.path
            d="M 132,70 C 152,55 167,55 178,70 C 183,85 168,95 142,85 Z"
            fill="url(#leafGrad)"
            stroke="#114524"
            strokeWidth="2"
            style={{ transformOrigin: "132px 75px" }}
            animate={earRotationRight[state]}
            transition={{ repeat: state === "idle" || state === "thinking" || state === "celebrating" ? Infinity : 0, duration: 1.5 }}
          />

          {/* Plant Body */}
          <ellipse cx="100" cy="132" rx="44" ry="48" fill="url(#sprigBody)" stroke="#114524" strokeWidth="2.5" />
          
          {/* Head */}
          <motion.g
            animate={{
              rotate: state === "thinking" ? -12 : 0,
            }}
            transition={{ type: "spring", stiffness: 90, damping: 10 }}
            style={{ transformOrigin: "100px 105px" }}
          >
            {/* Head sphere */}
            <circle cx="100" cy="80" r="39" fill="url(#sprigBody)" stroke="#114524" strokeWidth="2.5" />

            {/* Glowing Eyes */}
            <motion.ellipse
              cx="86"
              cy="76"
              rx="4"
              ry="6"
              fill={state === "concerned" ? "#a7f3d0" : "#ffffff"}
              style={{ transformOrigin: "86px 76px" }}
              animate={eyeScaleY[state]}
              transition={{ repeat: state === "idle" ? Infinity : 0, duration: 3.5, repeatDelay: 1.2 }}
            />
            <motion.ellipse
              cx="114"
              cy="76"
              rx="4"
              ry="6"
              fill={state === "concerned" ? "#a7f3d0" : "#ffffff"}
              style={{ transformOrigin: "114px 76px" }}
              animate={eyeScaleY[state]}
              transition={{ repeat: state === "idle" ? Infinity : 0, duration: 3.5, repeatDelay: 1.2 }}
            />

            {/* Cheeks */}
            <circle cx="76" cy="84" r="5" fill="#f43f5e" opacity="0.4" />
            <circle cx="124" cy="84" r="5" fill="#f43f5e" opacity="0.4" />

            {/* Mouth Curvature */}
            {state === "happy" || state === "celebrating" ? (
              <path d="M 93,84 Q 100,94 107,84" fill="none" stroke="#114524" strokeWidth="2.5" strokeLinecap="round" />
            ) : state === "concerned" ? (
              <path d="M 94,88 Q 100,83 106,88" fill="none" stroke="#114524" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <path d="M 95,85 L 105,85" fill="none" stroke="#114524" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Top stem */}
            <path d="M 100,42 L 100,34" stroke="#15803d" strokeWidth="3" />

            {/* Top flower buds */}
            <motion.g
              animate={{ scale: flowerScale[state] }}
              transition={{ type: "spring", stiffness: 100 }}
              style={{ transformOrigin: "100px 32px" }}
            >
              <circle cx="93" cy="32" r="6" fill="url(#flowerGrad)" />
              <circle cx="107" cy="32" r="6" fill="url(#flowerGrad)" />
              <circle cx="100" cy="25" r="6" fill="url(#flowerGrad)" />
              <circle cx="100" cy="39" r="6" fill="url(#flowerGrad)" />
              <circle cx="100" cy="32" r="3.5" fill="#fef08a" />
            </motion.g>
          </motion.g>

          {/* Sprout branches hands */}
          <path d="M 56,128 C 48,133 43,128 40,123" fill="none" stroke="#114524" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 144,128 C 152,133 157,128 160,123" fill="none" stroke="#114524" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Orbiting sparkles during thinking */}
        <AnimatePresence>
          {state === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [Math.cos(i) * 54, Math.cos(i + Math.PI) * 54],
                    y: [Math.sin(i) * 54, Math.sin(i + Math.PI) * 54],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    delay: i * 0.25,
                  }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-accent/90 top-[45%] left-[47%] blur-[0.5px]"
                />
              ))}
            </motion.div>
          )}

          {/* Confetti leaf burst when celebrating */}
          {state === "celebrating" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {confettiItems.map((item) => (
                <motion.div
                  key={item.id}
                  animate={{
                    x: [0, item.x],
                    y: [0, item.y],
                    rotate: [0, item.rotate],
                    opacity: [1, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.1,
                    delay: item.delay,
                  }}
                  className="absolute text-xs"
                  style={{ top: "35%", left: "45%" }}
                >
                  {item.type}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
