"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useGame } from "@/stores/game-store";
import { aggregateCategoryTotals, getLevelName } from "@/lib/carbon-utils";
import { AnimatedCounter } from "@/components/animated-counter";
import { 
  Leaf, 
  TrendingDown, 
  Zap, 
  Car, 
  TreePine, 
  Sparkles,
  Droplets,
  ShoppingBag,
  Trash2,
  Utensils
} from "lucide-react";

const DynamicRadialBarChart = dynamic(() => import("recharts").then((mod) => mod.RadialBarChart), { ssr: false });
const DynamicRadialBar = dynamic(() => import("recharts").then((m) => m.RadialBar), { ssr: false });
const DynamicResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const CATEGORY_STYLES: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  food: { color: "#22C55E", icon: <Utensils className="w-3 h-3" />, label: "Food" },
  transportation: { color: "#06B6D4", icon: <Car className="w-3 h-3" />, label: "Transport" },
  electricity: { color: "#EAB308", icon: <Zap className="w-3 h-3" />, label: "Energy" },
  shopping: { color: "#EC4899", icon: <ShoppingBag className="w-3 h-3" />, label: "Shopping" },
  water: { color: "#3B82F6", icon: <Droplets className="w-3 h-3" />, label: "Water" },
  waste: { color: "#A855F7", icon: <Trash2 className="w-3 h-3" />, label: "Waste" },
};

export function PremiumAnalyticsWidget() {
  const { logs, profile, getDetectiveFindings } = useGame();

  const categoryTotals = useMemo(() => aggregateCategoryTotals(logs), [logs]);
  const findings = useMemo(() => getDetectiveFindings(), [getDetectiveFindings]);
  
  const totalEmissions = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  }, [categoryTotals]);

  // Data for RadialBarChart
  const radialData = useMemo(() => {
    return Object.entries(categoryTotals)
      .filter(([, value]) => value > 0)
      // Sort by value so largest is on outside, or keep fixed order
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_STYLES[name]?.color || "#ffffff",
      }));
  }, [categoryTotals]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 15 } },
  };

  // Equivalents Math
  const treesEquivalent = Math.max(0, Math.round(totalEmissions / 20.5));
  const kmDrivenEquivalent = Math.max(0, Math.round(totalEmissions * 4.07));
  const daysPoweringEquivalent = Math.max(0, Math.round(totalEmissions / 16));

  // Determine Impact String
  const impactLabel = totalEmissions > 300 ? "High Impact" : totalEmissions > 150 ? "Moderate Impact" : "Low Impact";

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Top Glass Panel - Main Analytics */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden p-6 sm:p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "32px",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)"
        }}
      >
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
            Monthly Carbon Footprint
          </span>
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <AnimatedCounter 
              value={totalEmissions} 
              className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#F8FAFC] to-[#94A3B8]" 
            />
            <span className="text-xl font-semibold text-[#A1A1AA]">kg CO₂</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
            <TrendingDown className="w-3 h-3" />
            <span>12% lower than last month</span>
          </div>
        </div>

        {/* Radial Chart Area */}
        <div className="relative w-full h-[320px] mt-8 mb-4">
          {radialData.length > 0 ? (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="flex flex-col items-center text-center z-10"
                >
                  <span className="text-3xl font-extrabold text-white drop-shadow-lg">{totalEmissions.toFixed(1)}</span>
                  <span className="text-xs text-zinc-400 font-semibold mb-1">kg CO₂</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-accent">{impactLabel}</span>
                </motion.div>
              </div>
              <DynamicResponsiveContainer width="100%" height="100%">
                <DynamicRadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="40%" 
                  outerRadius="100%" 
                  barSize={12} 
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <DynamicRadialBar
                    minPointSize={15}
                    background={{ fill: 'rgba(255,255,255,0.02)' }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                </DynamicRadialBarChart>
              </DynamicResponsiveContainer>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-full">
              <Leaf className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs">No footprint data yet</span>
            </div>
          )}
        </div>

        {/* Category Breakdown Micro-Cards */}
        {radialData.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {radialData.map((item) => {
              const style = CATEGORY_STYLES[item.name] || CATEGORY_STYLES.food;
              const percentage = Math.round((item.value / totalEmissions) * 100) || 0;
              
              return (
                <motion.div 
                  key={item.name}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="flex flex-col p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5" style={{ color: style.color }}>
                      {style.icon}
                      <span className="text-xs font-bold">{style.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{percentage}%</span>
                  </div>
                  <div className="text-lg font-bold text-white mb-2">{item.value.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">kg</span></div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: style.color, boxShadow: `0 0 10px ${style.color}` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Comparison Section */}
      <motion.div 
        variants={itemVariants}
        className="p-6 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Footprint Comparison</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white font-semibold">Current Month</span>
              <span className="text-accent">{totalEmissions.toFixed(1)} kg</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-accent h-full rounded-full" style={{ width: `${Math.min(100, (totalEmissions / 310) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Previous Month</span>
              <span className="text-zinc-400">258.3 kg</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-zinc-600 h-full rounded-full" style={{ width: `${Math.min(100, (258.3 / 310) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Global Average</span>
              <span className="text-zinc-400">310.0 kg</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-zinc-700 h-full rounded-full" style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Equivalents Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl flex flex-col items-center text-center border border-white/5 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
            <TreePine className="w-4 h-4 text-green-500" />
          </div>
          <span className="text-lg font-bold text-white">{treesEquivalent}</span>
          <span className="text-[10px] text-zinc-500 font-semibold leading-tight mt-1">Trees absorbing<br/>for 1 year</span>
        </div>
        <div className="p-4 rounded-3xl flex flex-col items-center text-center border border-white/5 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
            <Car className="w-4 h-4 text-cyan-500" />
          </div>
          <span className="text-lg font-bold text-white">{kmDrivenEquivalent}</span>
          <span className="text-[10px] text-zinc-500 font-semibold leading-tight mt-1">Kilometers<br/>driven</span>
        </div>
        <div className="p-4 rounded-3xl flex flex-col items-center text-center border border-white/5 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="text-lg font-bold text-white">{daysPoweringEquivalent}</span>
          <span className="text-[10px] text-zinc-500 font-semibold leading-tight mt-1">Days powering<br/>a home</span>
        </div>
      </motion.div>

      {/* Gamification Ring */}
      <motion.div 
        variants={itemVariants}
        className="p-5 rounded-3xl flex items-center gap-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <motion.circle 
              cx="32" cy="32" r="28" fill="none" stroke="#22C55E" strokeWidth="6"
              strokeDasharray="175.9"
              initial={{ strokeDashoffset: 175.9 }}
              animate={{ strokeDashoffset: 175.9 - (175.9 * (profile.green_score / 100)) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-lg font-extrabold text-white leading-none">{profile.green_score}</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Green Score</span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            Level {profile.level} — {getLevelName(profile.level)} 
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">{profile.xp} XP total</div>
        </div>
      </motion.div>

      {/* Sprig Insight */}
      {findings.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="relative p-5 rounded-3xl overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(6,182,212,0.05) 100%)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-16 h-16 text-green-400" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Leaf className="w-3 h-3 text-green-400" />
            </div>
            <h3 className="font-syne font-bold text-sm text-green-400">Sprig Insight</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed relative z-10 mb-3">
            {findings[0].recommendation || "Your transportation contributes the most to your footprint this month. Switching to public transport could reduce emissions significantly."}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold">
            Potential Saving: -34 kg CO₂/month
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
