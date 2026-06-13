"use client";

import React from "react";
import { motion } from "framer-motion";
import { useGame } from "@/stores/game-store";
import { CarbonCalculator } from "@/components/carbon-calculator";
import { Activity } from "lucide-react";

import { PremiumAnalyticsWidget } from "@/components/premium-analytics-widget";

export default function CarbonTrackerPage() {
  const { logs } = useGame();

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
          Log your daily activities and monitor your ecological footprint. Small changes in your
          daily routine can make a massive impact on your virtual planet.
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

          <motion.div
            variants={itemVariants}
            className="glass-panel p-6 flex flex-col flex-1 min-h-[300px]"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="font-syne font-bold text-lg text-white">Recent Activity Timeline</h2>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center text-zinc-500 py-10">No activities logged yet.</div>
              ) : (
                logs
                  .slice()
                  .reverse()
                  .map((log, index) => (
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
                            <span className="block text-accent font-mono font-bold">
                              -{log.carbon_offset} kg CO₂
                            </span>
                          ) : (
                            <span className="block text-red-400 font-mono font-bold">
                              +{log.co2_emission} kg CO₂
                            </span>
                          )}
                          <span className="text-[10px] text-yellow-500 font-bold">
                            +{log.xp_earned} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Premium Analytics Dashboard */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <PremiumAnalyticsWidget />
        </div>
      </motion.div>
    </div>
  );
}
