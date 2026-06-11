"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/stores/game-store";
import { 
  Flame, 
  Leaf, 
  Award, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  Globe, 
  Trophy, 
  Sparkles, 
  ChevronRight, 
  Compass,
  ArrowUp,
  Activity,
  FlameKindling
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    logs,
    challenges,
    planet,
    leaderboard,
    getDetectiveFindings,
    userId,
    logAction,
  } = useGame();

  const [mounted, setMounted] = useState(false);
  const [isLoggingAction, setIsLoggingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chart" | "activity">("chart");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Quick logging button triggers (minimizes manual logging friction)
  const quickLogs = [
    { name: "Walk/Cycle Commute", category: "transport", desc: "Rode bicycle instead of car drive", co2: 0.0, offset: 2.1, xp: 60, icon: Compass },
    { name: "Vegetarian Meal", category: "diet", desc: "Had plant-based organic meal", co2: 0.3, offset: 1.5, xp: 50, icon: Leaf },
    { name: "Unplugged Idle Setup", category: "energy", desc: "Turned off standby appliances", co2: 0.1, offset: 0.8, xp: 40, icon: Zap },
    { name: "Recycled Plastic/Can", category: "waste", desc: "Sorted and recycled metals & polymers", co2: 0.0, offset: 0.6, xp: 30, icon: Activity },
  ];

  const handleQuickLog = async (ql: typeof quickLogs[0]) => {
    setIsLoggingAction(ql.name);
    // Simulate minor transition delay for game feel
    await new Promise((resolve) => setTimeout(resolve, 800));
    logAction(ql.category, ql.desc, ql.co2, ql.offset, ql.xp);
    setIsLoggingAction(null);
  };

  // Compile logs data for Recharts Bar Chart
  const chartData = React.useMemo(() => {
    const categories = ["transport", "diet", "energy", "waste"];
    return categories.map((cat) => {
      // Calculate total emissions in logs
      const total = logs
        .filter((l) => l.category === cat)
        .reduce((sum, l) => sum + l.co2_emission, 0);

      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        CO2: parseFloat(total.toFixed(1)),
      };
    });
  }, [logs]);

  // Aggregate emissions & offsets
  const totalEmissions = logs.reduce((sum, l) => sum + l.co2_emission, 0).toFixed(1);
  const totalOffsets = logs.reduce((sum, l) => sum + l.carbon_offset, 0).toFixed(1);

  // Carbon Detective Findings
  const findings = getDetectiveFindings();

  // Find user rank and details
  const userRank = React.useMemo(() => {
    if (!profile || !leaderboard) return { rank: 1, rank_movement: 0 };
    const entry = leaderboard.find(
      (e) => e.profile_id === profile.id || e.username.toLowerCase() === profile.username.toLowerCase()
    );
    return entry ? { rank: entry.rank, rank_movement: entry.rank_movement } : { rank: 3, rank_movement: 1 };
  }, [profile, leaderboard]);

  // Redirect to AI Twin with prefilled query
  const handleFixFinding = (category: string, amount: number) => {
    const prompt = encodeURIComponent(
      `My Carbon Detective dashboard reported that my '${category}' footprint contributed ${amount} kg of CO2 this week. What are three customized, convenient steps I can take to reduce this?`
    );
    router.push(`/twin?autoquery=${prompt}`);
  };

  if (!mounted || !profile) {
    return (
      <div className="flex-1 flex flex-col bg-[#0A0F0A] text-white">
        <div className="flex-grow flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // Radial progress stroke math
  const radius = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profile.green_score / 100) * circumference;

  // Level name lookup
  const getLevelName = (lvl: number) => {
    if (lvl >= 15) return "Forest Guardian";
    if (lvl >= 10) return "Tree";
    if (lvl >= 5) return "Plant";
    if (lvl >= 2) return "Sprout";
    return "Seed";
  };

  const xpProgress = (profile.xp % 1000) / 10;
  const xpRemaining = 1000 - (profile.xp % 1000);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    },
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-1 py-2 lg:py-4 select-none">
      
      {/* Introduction Banner */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-cabinet font-extrabold text-2xl lg:text-3xl text-white tracking-tight flex items-center gap-2">
            Welcome back, <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">{profile.username}</span>
            <motion.span 
              animate={{ rotate: [0, 15, -10, 15, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
              className="inline-block origin-bottom-right"
            >
              🌱
            </motion.span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor your ecological metrics, complete daily challenges, and coordinate with your AI twin.
          </p>
        </div>
        
        {/* Synchronized indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 font-mono">
          <span className={`w-1.5 h-1.5 rounded-full animate-ping ${userId ? "bg-[#00E676]" : "bg-[#ffc107]"}`} />
          <span>{userId ? "Realtime Database Connected" : "Preview Ledger (Mock Fallback)"}</span>
        </div>
      </div>

      {/* Dynamic Bento Grid Layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[minmax(190px,auto)]"
      >
        
        {/* CARD 1: Green Score Hero (Spans 1 col, 2 rows) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-1 md:row-span-2 glass-panel p-6 flex flex-col justify-between relative overflow-hidden group hover:border-accent/30 hover:shadow-[0_0_30px_rgba(0,230,118,0.12)] transition-all duration-300"
        >
          {/* Subtle nature plant overlay */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-accent/10 transition-colors duration-500" />
          <div className="absolute top-4 left-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Planetary Rating</div>
          
          {/* Circular Graph */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-zinc-800/60 fill-transparent"
                  strokeWidth={strokeWidth}
                />
                {/* Progress Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-accent fill-transparent transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 10px rgba(0, 230, 118, 0.45))" }}
                />
              </svg>
              {/* Inner score detail */}
              <div className="absolute flex flex-col items-center">
                <span className="font-outfit font-extrabold text-4xl text-white tracking-tighter text-glow">
                  {profile.green_score}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Green Index</span>
              </div>
            </div>
            
            <div className="text-center mt-4 px-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-accent font-bold font-syne uppercase tracking-wider">
                Ecosystem Healthy
              </span>
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed max-w-[240px]">
                Your carbon offset logs are outpacing your emissions by <span className="text-white font-semibold">{totalOffsets} kg</span>. Excellent progress!
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 text-center">
            <span className="text-[10px] font-semibold text-zinc-500">
              Next level projection: Level {profile.level + 1} ({getLevelName(profile.level + 1)})
            </span>
          </div>
        </motion.div>


        {/* CARD 2: Weekly Emissions Chart (Spans 2 cols, 2 rows) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-2 md:row-span-2 glass-panel p-6 flex flex-col justify-between group hover:border-accent/20 transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
            <div>
              <h2 className="font-syne font-bold text-sm lg:text-base text-white tracking-wide">
                Weekly Emissions Ledger
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Aggregated footprint loads measured in kg of CO₂ equivalents.
              </p>
            </div>

            {/* Toggle view controllers */}
            <div className="flex bg-zinc-950/60 p-1 rounded-lg border border-zinc-800 self-start sm:self-center shrink-0">
              <button
                onClick={() => setActiveTab("chart")}
                className={`px-3 py-1 rounded-md text-[10px] font-bold font-syne uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "chart" ? "bg-accent text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-3 py-1 rounded-md text-[10px] font-bold font-syne uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "activity" ? "bg-accent text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Recent Activity
              </button>
            </div>
          </div>

          {/* Toggle Contents */}
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === "chart" ? (
                <motion.div 
                  key="chart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col justify-between"
                >
                  <div className="w-full h-52 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00E676" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#1DE9B6" stopOpacity={0.25} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="name" stroke="#666" style={{ fontSize: 10, fontWeight: 600 }} />
                        <YAxis stroke="#666" style={{ fontSize: 10, fontWeight: 600 }} />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.02)", radius: 4 }}
                          contentStyle={{ 
                            backgroundColor: "#0a0f0a", 
                            borderColor: "rgba(255, 255, 255, 0.08)", 
                            color: "#fff", 
                            borderRadius: 12,
                            fontSize: 11,
                            fontFamily: "var(--font-sans)",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                          }}
                          labelClassName="font-syne font-bold text-accent mb-1"
                        />
                        <Bar dataKey="CO2" fill="url(#barGlow)" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, idx) => (
                            <Cell 
                              key={`cell-${idx}`} 
                              className="hover:opacity-100 transition-opacity duration-300"
                              style={{ filter: "drop-shadow(0 0 4px rgba(0, 230, 118, 0.2))" }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-around items-center bg-white/[0.02] border border-white/5 rounded-xl p-3 mt-4 text-center">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Carbon Emitted</span>
                      <span className="block text-sm font-outfit font-bold text-zinc-200 mt-0.5">{totalEmissions} kg CO₂</span>
                    </div>
                    <div className="w-[1px] h-6 bg-zinc-800" />
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Carbon Offsetted</span>
                      <span className="block text-sm font-outfit font-bold text-accent mt-0.5">-{totalOffsets} kg CO₂</span>
                    </div>
                    <div className="w-[1px] h-6 bg-zinc-800" />
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Net Carbon Status</span>
                      <span className={`block text-sm font-outfit font-bold mt-0.5 ${Number(totalEmissions) > Number(totalOffsets) ? "text-amber-400" : "text-secondary"}`}>
                        {(Number(totalEmissions) - Number(totalOffsets)).toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="activity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar"
                >
                  {logs.length === 0 ? (
                    <div className="text-zinc-500 text-xs text-center py-10">No recent activity logs found. Try a quick logging shortcut below!</div>
                  ) : (
                    logs.slice().reverse().slice(0, 4).map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            log.category === "transport" ? "bg-cyan-400" :
                            log.category === "diet" ? "bg-emerald-400" :
                            log.category === "energy" ? "bg-amber-400" : "bg-purple-400"
                          }`} />
                          <div>
                            <span className="text-xs font-semibold text-zinc-200 block">{log.description}</span>
                            <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block capitalize">
                              {log.category} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {log.carbon_offset > 0 ? (
                            <span className="text-xs font-bold text-accent font-mono">-{log.carbon_offset} kg Offset</span>
                          ) : (
                            <span className="text-xs font-bold text-zinc-400 font-mono">+{log.co2_emission} kg CO₂</span>
                          )}
                          <span className="block text-[8px] font-bold text-yellow-500">+{log.xp_earned} XP</span>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>


        {/* CARD 3: XP Progress Card (Spans 1 col, 1 row) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-1 glass-panel p-5 flex flex-col justify-between group hover:border-accent/20 transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Growth Progress</span>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-outfit font-extrabold text-white">Level {profile.level}</span>
              <span className="text-[10px] text-zinc-400 font-semibold font-syne uppercase">({getLevelName(profile.level)})</span>
            </div>
            <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all duration-500" 
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-zinc-500 font-semibold mt-1.5 font-mono">
              <span>{profile.xp % 1000} / 1000 XP</span>
              <span className="text-accent">{xpRemaining} XP to Lvl {profile.level + 1}</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-500 shrink-0" />
              <span className="font-semibold">Achievements Unlocked:</span>
            </div>
            <span className="font-bold text-white">Level Up for Badge rewards</span>
          </div>
        </motion.div>


        {/* CARD 4: Streak Card (Spans 1 col, 1 row) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-1 glass-panel p-5 flex flex-col justify-between group hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)] transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <span className="text-2xl font-outfit font-extrabold text-white block mt-2">
              {profile.streak_count} Days Active
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Logs submitted daily. Keep it up!
            </span>
          </div>
          <div className="text-[9px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FlameKindling className="w-3.5 h-3.5 fill-amber-500/20 animate-pulse" />
              <span>Streak Multiplier Active:</span>
            </div>
            <span>+15% XP</span>
          </div>
        </motion.div>


        {/* CARD 5: Community Rank Card (Spans 1 col, 1 row) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-1 glass-panel p-5 flex flex-col justify-between group hover:border-secondary/30 transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Community standing</span>
            <Trophy className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-2xl font-outfit font-extrabold text-white">Global Rank #{userRank.rank}</span>
              {userRank.rank_movement > 0 ? (
                <span className="p-0.5 rounded bg-accent/20 border border-accent/20 flex items-center text-accent text-[9px] font-extrabold shrink-0">
                  <ArrowUp className="w-2.5 h-2.5" />
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0 mx-1" />
              )}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Competing against global EcoBuddies
            </span>
          </div>
          <button 
            onClick={() => router.push("/community")}
            className="w-full py-2 bg-zinc-950/60 border border-white/5 hover:border-secondary/30 text-zinc-300 hover:text-white rounded-xl text-[10px] font-syne font-bold flex items-center justify-center gap-1 cursor-pointer transition-all duration-300"
          >
            <span>Open Leaderboard</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>


        {/* CARD 6: Planet Preview Card (Spans 1 col, 2 rows) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-1 md:row-span-2 glass-panel p-6 flex flex-col justify-between group hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(29,233,182,0.12)] transition-all duration-300"
        >
          <div className="absolute top-4 left-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">3D Planet Preview</div>
          
          <div className="flex-1 flex flex-col justify-center items-center py-6">
            {/* Visual representation of 3D globe */}
            <div className="relative w-28 h-28 flex items-center justify-center my-2">
              {/* Outer atmosphere halo */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/20 animate-spin" style={{ animationDuration: "20s" }} />
              {/* Core sphere */}
              <div 
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-950 via-teal-900 to-cyan-950 border border-secondary/30 shadow-[0_0_30px_rgba(29,233,182,0.4)] flex items-center justify-center animate-pulse"
                style={{ animationDuration: "4s" }}
              >
                <Globe className="w-12 h-12 text-secondary/70 animate-bounce" style={{ animationDuration: "8s" }} />
              </div>
            </div>

            <div className="w-full space-y-2.5 mt-4">
              {/* Planet Metric 1: Vegetation */}
              <div>
                <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  <span>Vegetation Cover</span>
                  <span className="text-accent font-mono">{(planet?.vegetation * 100 || 60).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${planet?.vegetation * 100 || 60}%` }} />
                </div>
              </div>

              {/* Planet Metric 2: Rivers / Water */}
              <div>
                <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  <span>Water Resources</span>
                  <span className="text-secondary font-mono">{(planet?.rivers * 100 || 55).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${planet?.rivers * 100 || 55}%` }} />
                </div>
              </div>

              {/* Planet Metric 3: Wildlife */}
              <div>
                <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  <span>Atmosphere Clarity</span>
                  <span className="text-cyan-400 font-mono">{(planet?.atmosphere_clarity * 100 || 65).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${planet?.atmosphere_clarity * 100 || 65}%` }} />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => router.push("/planet")}
            className="w-full py-2.5 bg-secondary hover:bg-secondary-bright text-black font-syne font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-secondary/25 transition-all duration-300"
          >
            <Globe className="w-4 h-4" />
            <span>Customize 3D Planet</span>
          </button>
        </motion.div>


        {/* CARD 7: Daily Challenges (Spans 2 cols, 2 rows) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-2 md:row-span-2 glass-panel p-6 flex flex-col justify-between group hover:border-accent/20 transition-all duration-300"
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div>
                <h2 className="font-syne font-bold text-sm lg:text-base text-white tracking-wide flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Active Daily Challenges</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete target goals to earn level experience and score multipliers.
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono font-bold">Resets daily</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {challenges.map((ch) => (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition-all duration-300 ${
                    ch.completed
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300/80"
                      : "bg-white/[0.01] border-white/5 text-zinc-300 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle className={`w-4 h-4 ${ch.completed ? "text-accent fill-emerald-950/20" : "text-zinc-700"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <span className={`text-xs font-bold block ${ch.completed ? "line-through text-zinc-500 font-normal" : "text-zinc-200"}`}>
                        {ch.title}
                      </span>
                      <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full shrink-0">
                        +{ch.xp_reward} XP
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{ch.description}</p>
                    
                    {/* Progress Slider */}
                    <div className="flex items-center gap-2.5 mt-2.5">
                      <div className="flex-1 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-accent rounded-full transition-all duration-500" 
                          style={{ width: `${(ch.current_value / ch.target_value) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 font-bold">
                        {ch.current_value}/{ch.target_value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-semibold">
            <span>Challenges logged: {challenges.filter(c => c.completed).length} / {challenges.length} completed</span>
            <span className="text-accent">{"Keep tracking activities to clear today's targets"}</span>
          </div>
        </motion.div>


        {/* CARD 8: AI Twin Quick Actions / Passive Eco-Logging (Spans 2 cols, 1 row) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-2 glass-panel p-6 flex flex-col justify-between group hover:border-accent/20 transition-all duration-300"
        >
          <div>
            <h2 className="font-syne font-bold text-sm lg:text-base text-white tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent" />
              <span>One-Click Passive Eco-Logging</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 mb-4">
              Submit quick actions to carbon ledger instantly. Minimizes logging friction.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickLogs.map((ql, idx) => {
              const QlIcon = ql.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickLog(ql)}
                  disabled={isLoggingAction !== null}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/30 hover:bg-accent-dim/10 text-left transition-all duration-300 flex flex-col justify-between items-start gap-4 group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-white/5 text-zinc-400 group-hover:text-accent group-hover:border-accent/20 transition-colors">
                      <QlIcon className="w-3.5 h-3.5" />
                    </div>
                    {isLoggingAction === ql.name ? (
                      <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent animate-spin rounded-full shrink-0 mt-1" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-zinc-600 group-hover:text-accent group-hover:scale-110 transition-all" />
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-zinc-200 block group-hover:text-white transition-colors">
                      {ql.name}
                    </span>
                    <span className="text-[8px] text-zinc-500 mt-0.5 block line-clamp-1">{ql.desc}</span>
                    <span className="inline-block mt-2 text-[9px] font-bold font-mono text-accent">
                      +{ql.xp} XP • {ql.offset}kg offset
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>


        {/* CARD 9: Carbon Detective Warnings (Spans 1 col, 1 row) */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-1 glass-panel p-5 flex flex-col justify-between group hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(244,67,54,0.06)] transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Detective Report</span>
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          </div>

          <div className="my-2">
            {findings.length > 0 ? (
              <div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">
                    Spike: {findings[0].category}
                  </span>
                  <span className="text-xs font-outfit font-extrabold text-red-400">
                    {findings[0].totalEmissions} kg
                  </span>
                </div>
                <h4 className="font-syne font-bold text-xs text-zinc-200 mt-1 line-clamp-1">{findings[0].description}</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">
                  {findings[0].recommendation}
                </p>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs text-center py-4">No critical carbon spikes detected. You are fully optimized!</div>
            )}
          </div>

          {findings.length > 0 ? (
            <button
              onClick={() => handleFixFinding(findings[0].category, findings[0].totalEmissions)}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-syne font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300"
            >
              <span>Consult Twin to Resolve</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/twin")}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 rounded-xl text-[10px] font-syne font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300"
            >
              <span>Ask AI Twin Anything</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
