"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { useGame } from "@/stores/game-store";

/**
 * Interface representing a user's carbon goals.
 */
export interface GoalState {
  /** Weekly carbon emission limit budget in kg CO₂ */
  emissionBudget: number;
  /** Current emissions recorded for this week in kg CO₂ */
  currentEmissions: number;
  /** Weekly goal for completed green actions */
  actionTargetCount: number;
  /** Current completed green actions logged this week */
  currentActionCount: number;
}

/**
 * GoalsWidget component rendering the user's weekly carbon emission budgets
 * and green action offset targets. Includes responsive layout, progress rings,
 * accessibility labels, and alert states when exceeding budget boundaries.
 */
export function GoalsWidget() {
  const { logs } = useGame();
  const [sevenDaysAgo, setSevenDaysAgo] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSevenDaysAgo(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Compute stats for the current week (mocking base bounds)
  const stats = useMemo<GoalState>(() => {
    // Carbon emissions logged in the last 7 days
    const weeklyLogs =
      sevenDaysAgo > 0 ? logs.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo) : [];

    const emissions = weeklyLogs.reduce((sum, l) => sum + l.co2_emission, 0);
    const offsetsCount = weeklyLogs.filter((l) => l.carbon_offset > 0).length;

    return {
      emissionBudget: 25.0, // Default 25kg CO2 limit budget
      currentEmissions: parseFloat(emissions.toFixed(1)),
      actionTargetCount: 5, // Default 5 green actions target
      currentActionCount: offsetsCount,
    };
  }, [logs, sevenDaysAgo]);

  const emissionProgress =
    Math.min(100, Math.round((stats.currentEmissions / stats.emissionBudget) * 100)) || 0;
  const actionProgress =
    Math.min(100, Math.round((stats.currentActionCount / stats.actionTargetCount) * 100)) || 0;

  // Determine warning levels for emissions budget
  const budgetExceeded = stats.currentEmissions > stats.emissionBudget;
  const budgetWarning = stats.currentEmissions >= stats.emissionBudget * 0.8;

  const budgetColor = budgetExceeded
    ? "text-red-400 border-red-500/20 bg-red-500/10"
    : budgetWarning
      ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10"
      : "text-green-400 border-green-500/20 bg-green-500/10";

  const budgetBarColor = budgetExceeded
    ? "bg-red-500"
    : budgetWarning
      ? "bg-yellow-500"
      : "bg-accent";

  return (
    <div
      className="p-5 rounded-3xl flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      role="region"
      aria-label="Weekly Goals Dashboard"
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
        <h2 className="font-syne font-bold text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Target className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>Weekly Targets</span>
        </h2>
        <span className="text-[9px] text-zinc-500 font-bold font-mono">Sync: 7 Days</span>
      </div>

      <div className="space-y-4">
        {/* Goal 1: Carbon Emission Budget */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white font-semibold">CO₂ Emissions Budget</span>
            <span className="text-zinc-400 font-mono">
              {stats.currentEmissions} / {stats.emissionBudget} kg
            </span>
          </div>

          <div
            className="w-full bg-zinc-900/80 h-2 rounded-full overflow-hidden border border-white/5"
            role="progressbar"
            aria-valuenow={emissionProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Carbon budget progress: ${stats.currentEmissions} kilograms emitted of ${stats.emissionBudget} kilograms limit`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${emissionProgress}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${budgetBarColor}`}
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <div
              className={`px-2 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-1 ${budgetColor}`}
              role="status"
            >
              {budgetExceeded ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Budget Exceeded</span>
                </>
              ) : budgetWarning ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Approaching Limit</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Within Budget</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold">
              {budgetExceeded
                ? `${(stats.currentEmissions - stats.emissionBudget).toFixed(1)} kg over`
                : `${(stats.emissionBudget - stats.currentEmissions).toFixed(1)} kg left`}
            </span>
          </div>
        </div>

        {/* Goal 2: Green Action Frequency */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white font-semibold">Green Actions logged</span>
            <span className="text-yellow-500 font-bold font-mono">
              {stats.currentActionCount} / {stats.actionTargetCount}
            </span>
          </div>

          <div
            className="w-full bg-zinc-900/80 h-2 rounded-full overflow-hidden border border-white/5"
            role="progressbar"
            aria-valuenow={actionProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Green actions completed: ${stats.currentActionCount} out of ${stats.actionTargetCount} goal`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${actionProgress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-[9px] text-zinc-500 font-semibold">
            <div className="flex items-center gap-1 text-emerald-400">
              <Leaf className="w-3.5 h-3.5" />
              <span>+{stats.currentActionCount * 50} XP generated</span>
            </div>
            <span>{actionProgress}% completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
