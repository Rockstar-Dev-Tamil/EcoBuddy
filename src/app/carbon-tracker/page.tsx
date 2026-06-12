"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useGame } from "@/stores/game-store";
import { CarbonCalculator } from "@/components/carbon-calculator";
import { AnimatedCounter } from "@/components/animated-counter";
import { aggregateCategoryTotals } from "@/lib/carbon-utils";
import { 
  Activity,
  ArrowRight,
  Target,
  Sparkles,
  Leaf
} from "lucide-react";

const DynamicPieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const DynamicPie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const DynamicCell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const DynamicTooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const DynamicResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const CATEGORY_COLORS: Record<string, string> = {
  transportation: "#00BCD4",
  food: "#4CAF50",
  electricity: "#FFC107",
  shopping: "#E91E63",
  water: "#2196F3",
  waste: "#9C27B0",
};

export default function CarbonTrackerPage() {
  const { logs, getDetectiveFindings } = useGame();

  const categoryTotals = useMemo(() => aggregateCategoryTotals(logs), [logs]);
  const findings = useMemo(() => getDetectiveFindings(), [getDetectiveFindings]);
  
  const pieData = Object.entries(categoryTotals)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const totalEmissions = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 py-8 select-none">
      <div className="mb-8">
        <h1 className="font-cabinet font-extrabold text-3xl text-white tracking-tight flex items-center gap-2">
          Carbon <span className="text-secondary">Tracker</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Log your daily activities and monitor your ecological footprint. Small changes in your daily routine can make a massive impact on your virtual planet.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left Column - Input & Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <motion.div variants={itemVariants}>
            <CarbonCalculator />
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col flex-1 min-h-[300px]">
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="font-syne font-bold text-lg text-white">Recent Activity Timeline</h2>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center text-zinc-500 py-10">No activities logged yet.</div>
              ) : (
                logs.slice().reverse().map((log, index) => (
                  <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                    {/* Timeline Line */}
                    {index !== logs.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-zinc-800" />
                    )}
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-zinc-900 border-2 border-accent" />
                    
                    <div className="glass-panel p-4 flex justify-between items-start group hover:border-accent/30 transition-colors">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                          {log.category}
                        </span>
                        <p className="text-sm font-semibold text-white mb-1">{log.description}</p>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        {log.carbon_offset > 0 ? (
                          <span className="block text-accent font-mono font-bold">-{log.carbon_offset} kg CO₂</span>
                        ) : (
                          <span className="block text-red-400 font-mono font-bold">+{log.co2_emission} kg CO₂</span>
                        )}
                        <span className="text-[10px] text-yellow-500 font-bold">+{log.xp_earned} XP</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Analytics & Insights */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between items-center text-center">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Carbon Footprint</h3>
            <div className="flex items-end justify-center gap-1">
              <AnimatedCounter value={totalEmissions} className="text-5xl font-outfit font-extrabold text-white" />
              <span className="text-zinc-500 font-semibold mb-2">kg CO₂</span>
            </div>
            
            <div className="w-full h-[250px] mt-6">
              {pieData.length > 0 ? (
                <DynamicResponsiveContainer width="100%" height="100%">
                  <DynamicPieChart>
                    <DynamicTooltip 
                      contentStyle={{ backgroundColor: "#0a0f0a", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "12px", color: "#fff" }}
                      itemStyle={{ color: "#fff", fontWeight: "bold" }}
                    />
                    <DynamicPie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <DynamicCell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#00E676"} />
                      ))}
                    </DynamicPie>
                  </DynamicPieChart>
                </DynamicResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-full">
                  <Target className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">No data to display</span>
                </div>
              )}
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {pieData.map(entry => (
                <div key={entry.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 capitalize">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || "#00E676" }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-syne font-bold text-sm text-white">Sprig Insights</h3>
            </div>
            
            {findings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {findings.slice(0, 2).map((finding, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <Leaf className={`w-4 h-4 ${finding.severity === "high" ? "text-red-400" : "text-yellow-400"} opacity-50`} />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-accent block mb-1">
                      Observation: {finding.category}
                    </span>
                    <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{finding.description}</p>
                    <div className="bg-accent/10 border border-accent/20 p-2.5 rounded-lg">
                      <span className="text-[10px] font-bold text-accent block mb-0.5">Recommendation</span>
                      <p className="text-[11px] text-zinc-400">{finding.recommendation}</p>
                    </div>
                  </div>
                ))}
                
                <button className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
                  <span>Chat with AI Twin for more insights</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">Log more activities to receive personalized AI insights.</p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
