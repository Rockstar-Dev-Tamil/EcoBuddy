"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useGame } from "@/stores/game-store";
import {
  Users,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Check,
  FolderPlus,
  Flame,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// MiniProgressCircle removed since it's unused

export default function CommunityPage() {
  const { leaderboard, achievements, groups, profile, joinOrLeaveGroup, createGroup } = useGame();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"rankings" | "groups" | "badges">("rankings");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("family");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Compute card rarities based on XP reward
  const getAchievementRarity = (xp: number) => {
    if (xp >= 250) {
      return {
        name: "Legendary",
        glowClass:
          "border-amber-500/30 bg-amber-500/5 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]",
        badgeGlow: "bg-amber-500/20 text-amber-400 border-amber-500/35",
        labelColor: "text-amber-400",
      };
    }
    if (xp >= 200) {
      return {
        name: "Epic",
        glowClass:
          "border-fuchsia-500/30 bg-fuchsia-500/5 hover:shadow-[0_0_25px_rgba(217,70,239,0.2)]",
        badgeGlow: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/35",
        labelColor: "text-fuchsia-400",
      };
    }
    if (xp >= 150) {
      return {
        name: "Rare",
        glowClass: "border-cyan-500/30 bg-cyan-500/5 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)]",
        badgeGlow: "bg-cyan-500/20 text-cyan-400 border-cyan-500/35",
        labelColor: "text-cyan-400",
      };
    }
    return {
      name: "Common",
      glowClass: "border-zinc-800 bg-zinc-950/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]",
      badgeGlow: "bg-zinc-800 text-zinc-400 border-zinc-700/50",
      labelColor: "text-zinc-500",
    };
  };

  // Podium sorting logic
  const topThree = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  // normalRankings could be used in the future if we show the remaining leaderboard items separately

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroup(newGroupName, newGroupType);
    setNewGroupName("");
    setShowCreateGroup(false);
  };

  const getRankMovementIcon = (mov: number) => {
    if (mov > 0) return <ArrowUp className="w-3 h-3 text-accent shrink-0" />;
    if (mov < 0) return <ArrowDown className="w-3 h-3 text-red-400 shrink-0" />;
    return <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0 mx-1" />;
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case "family":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "hostel":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      case "office":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "college":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      default:
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const getGroupArchetype = (type: string) => {
    switch (type) {
      case "family":
        return "Forest Village";
      case "hostel":
        return "Ecosystem Hub";
      case "office":
        return "Industrial Jungle";
      case "college":
        return "Campus Garden";
      default:
        return "Eco Village";
    }
  };

  if (!mounted || !profile) {
    return (
      <div className="flex-grow flex flex-col bg-[#0A0F0A] text-white">
        <div className="flex-grow flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20 lg:pb-0 select-none">
      <section className="flex-grow max-w-7xl w-full mx-auto px-4 py-4 flex flex-col gap-6">
        {/* Title Intro area */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Users className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg text-white">Community Leagues</h1>
              <p className="text-xs text-zinc-400">
                Compete in leagues, grow villages, and build collectible card decks.
              </p>
            </div>
          </div>

          {/* Tab switches */}
          <div className="flex bg-zinc-950/65 p-1 rounded-full border border-zinc-800 shrink-0">
            {(["rankings", "groups", "badges"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                id={`tab-community-${tab}`}
                className={`px-4.5 py-1.5 rounded-full text-[10px] font-bold font-syne uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab ? "bg-accent text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab contents */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {/* 1. Rankings Tab */}
            {activeTab === "rankings" && (
              <motion.div
                key="rankings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-8"
              >
                {/* Podium Cards for Top 3 */}
                <div className="grid grid-cols-3 gap-4 items-end max-w-3xl w-full mx-auto py-4">
                  {/* Rank 2 (Silver) */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest font-mono">
                        Rank 2
                      </span>
                      <div className="w-full h-36 bg-zinc-900/60 border border-zinc-750 p-4 rounded-t-2xl flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-zinc-500 transition-colors">
                        <div className="absolute top-2 right-2 text-xs">🥈</div>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs font-syne text-zinc-300">
                          {topThree[1].username[0].toUpperCase()}
                        </div>
                        <div className="mt-2">
                          <span className="text-xs font-bold text-white block line-clamp-1">
                            {topThree[1].username}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">
                            {topThree[1].xp.toLocaleString()} XP
                          </span>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-zinc-850 text-[10px] font-mono font-bold text-zinc-400 border border-white/5 mt-2">
                          {topThree[1].green_score} Index
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rank 1 (Gold) */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-extrabold text-yellow-400 uppercase tracking-widest font-mono">
                        Winner
                      </span>
                      <div className="w-full h-44 bg-gradient-to-t from-yellow-500/10 via-zinc-900/80 to-zinc-900 border border-yellow-500/35 p-5 rounded-t-3xl flex flex-col justify-between items-center text-center relative overflow-hidden shadow-[0_-4px_30px_rgba(234,179,8,0.1)] group hover:border-yellow-400 transition-colors">
                        <div className="absolute top-2 right-2 text-xs animate-bounce">👑</div>
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/35 flex items-center justify-center font-bold text-sm font-syne text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                          {topThree[0].username[0].toUpperCase()}
                        </div>
                        <div className="mt-2">
                          <span className="text-xs font-extrabold text-white block line-clamp-1">
                            {topThree[0].username}
                          </span>
                          <span className="text-[9px] text-yellow-400 font-bold font-mono block mt-0.5">
                            {topThree[0].xp.toLocaleString()} XP
                          </span>
                        </div>
                        <div className="px-2.5 py-0.5 rounded bg-yellow-500/20 text-[10px] font-mono font-extrabold text-yellow-400 border border-yellow-500/30 mt-2">
                          {topThree[0].green_score} Index
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rank 3 (Bronze) */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest font-mono">
                        Rank 3
                      </span>
                      <div className="w-full h-32 bg-zinc-900/60 border border-zinc-800 p-4 rounded-t-2xl flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-amber-700/60 transition-colors">
                        <div className="absolute top-2 right-2 text-xs">🥉</div>
                        <div className="w-10 h-10 rounded-full bg-zinc-855 border border-zinc-750 flex items-center justify-center font-bold text-xs font-syne text-amber-600">
                          {topThree[2].username[0].toUpperCase()}
                        </div>
                        <div className="mt-2">
                          <span className="text-xs font-bold text-white block line-clamp-1">
                            {topThree[2].username}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">
                            {topThree[2].xp.toLocaleString()} XP
                          </span>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-zinc-850/60 text-[10px] font-mono font-bold text-zinc-400 border border-white/5 mt-2">
                          {topThree[2].green_score} Index
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rankings player cards Grid (Rank 4+) */}
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest block mb-4">
                    League Rankings
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leaderboard.map((entry) => {
                      const isSelf = entry.profile_id === profile.id;

                      // Deterministic calculations for player preview values
                      const level = Math.max(1, Math.floor(entry.xp / 1000) + 1);
                      const streak = Math.max(1, ((entry.rank * 2) % 15) + 2);
                      const vegetationValue = Math.max(30, Math.min(95, 100 - entry.rank * 6));
                      const waterValue = Math.max(35, Math.min(90, 95 - entry.rank * 5));
                      const favoriteHabit =
                        entry.rank % 3 === 0
                          ? "🚲 Cycle Commute"
                          : entry.rank % 3 === 1
                            ? "🥗 Plant Diet"
                            : "⚡ Unplug Standby";

                      return (
                        <div
                          key={entry.profile_id}
                          className={`glass-panel p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-5 relative group ${
                            isSelf
                              ? "border-accent/40 bg-accent-dim/10 shadow-[0_0_20px_rgba(0,230,118,0.08)]"
                              : "border-white/5 bg-zinc-950/20 hover:border-white/15 hover:bg-white/[0.05]"
                          }`}
                        >
                          {/* RankMovement badge absolute */}
                          <div className="absolute top-4 right-4 flex items-center gap-1">
                            <span className="text-[10px] font-bold font-mono text-zinc-500">
                              #{entry.rank}
                            </span>
                            {getRankMovementIcon(entry.rank_movement)}
                          </div>

                          {/* Profile Avatar Username */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs font-syne ${
                                isSelf ? "bg-accent text-black" : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {entry.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white line-clamp-1">
                                  {entry.username}
                                </span>
                                {isSelf && (
                                  <span className="text-[8px] font-extrabold px-1 py-0.5 bg-accent/20 border border-accent/30 text-accent rounded uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                                Level {level} • {entry.xp.toLocaleString()} XP
                              </span>
                            </div>
                          </div>

                          <hr className="border-white/5" />

                          {/* Planet progress mini previews */}
                          <div className="space-y-2">
                            <span className="text-[8px] text-zinc-500 uppercase font-extrabold tracking-widest block">
                              Planet Status
                            </span>

                            <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono">
                              <span className="flex items-center gap-1">🌲 Vegetation</span>
                              <span className="text-accent font-bold">{vegetationValue}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-accent"
                                style={{ width: `${vegetationValue}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono mt-1.5">
                              <span className="flex items-center gap-1">💧 Water Ecosystem</span>
                              <span className="text-secondary font-bold">{waterValue}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-secondary"
                                style={{ width: `${waterValue}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer details (Favorite Habit, Streak, Score) */}
                          <div className="flex items-center justify-between bg-zinc-950/45 p-2 rounded-xl border border-white/5 text-[9px] font-medium text-zinc-400 font-mono mt-1">
                            <div className="flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
                              <span>{streak} Days</span>
                            </div>
                            <span>{favoriteHabit}</span>
                            <div className="text-accent font-extrabold">{entry.green_score} Gx</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Groups Tab */}
            {activeTab === "groups" && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {/* Header title */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h2 className="font-syne font-bold text-base text-white">
                      Active Eco-Villages
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Cooperate in villages to aggregate carbon offset goals together.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateGroup(!showCreateGroup)}
                    id="btn-trigger-create-group"
                    className="flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-bold bg-accent hover:bg-accent-bright text-black font-syne transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Establish Village</span>
                  </button>
                </div>

                {/* Create village sliding form */}
                {showCreateGroup && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleCreateGroupSubmit}
                    className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-4 items-end overflow-hidden bg-zinc-950/20"
                  >
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label
                        htmlFor="community-village-name"
                        className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest"
                      >
                        Village Name
                      </label>
                      <input
                        id="community-village-name"
                        type="text"
                        required
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g. Campus Jungle 101"
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/45 border border-zinc-800 text-xs text-white placeholder-zinc-650 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-44 flex flex-col gap-1.5">
                      <label
                        htmlFor="community-archetype-biome"
                        className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest"
                      >
                        Archetype Biome
                      </label>
                      <select
                        id="community-archetype-biome"
                        value={newGroupType}
                        onChange={(e) => setNewGroupType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/45 border border-zinc-800 text-xs text-white focus:outline-none"
                      >
                        <option value="family">Family Forest</option>
                        <option value="hostel">Hostel Ecosystem</option>
                        <option value="office">Office Jungle</option>
                        <option value="college">Campus Garden</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      id="btn-confirm-create-group"
                      className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-accent text-black font-syne font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-accent-bright transition-colors"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>Establish</span>
                    </button>
                  </motion.form>
                )}

                {/* Village grids visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="groups-list-grid">
                  {groups.map((group) => {
                    const progress = group.joined ? 84 : 45;
                    const villageType = getGroupArchetype(group.type);

                    return (
                      <div
                        key={group.id}
                        className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between gap-5 bg-zinc-950/20 group hover:border-accent/20 transition-all duration-300"
                      >
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border ${getGroupTypeColor(group.type)}`}
                          >
                            {villageType}
                          </span>
                          <h3 className="font-syne font-bold text-sm md:text-base text-zinc-100 mt-2.5">
                            {group.name}
                          </h3>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 leading-snug">
                            {group.member_count} active villagers contributing logs
                          </span>
                        </div>

                        {/* Village offset goal progress */}
                        <div>
                          <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                            <span>Village Canopy Growth</span>
                            <span className="text-accent font-mono">{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => joinOrLeaveGroup(group.id)}
                          className={`w-full py-2.5 rounded-xl text-xs font-syne font-bold border transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                            group.joined
                              ? "bg-emerald-500/10 border-emerald-500/20 text-accent hover:scale-[1.01]"
                              : "bg-white text-black hover:bg-zinc-200 border-white hover:scale-[1.01]"
                          }`}
                        >
                          {group.joined ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Joined • Active Villager</span>
                            </>
                          ) : (
                            <>
                              <span>Enter Eco Village</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 3. Achievements Badges Tab */}
            {activeTab === "badges" && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="border-b border-white/5 pb-3">
                  <h2 className="font-syne font-bold text-base text-white">
                    Ecology Collectible Achievements
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Collect milestones as glowing collectible cards. Higher rewards yield rare
                    tiers.
                  </p>
                </div>

                {/* Collectible Badge Grid */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 animate-show"
                  id="badges-shelf-grid"
                >
                  {achievements.map((ach) => {
                    const rarity = getAchievementRarity(ach.xp_reward);

                    return (
                      <motion.div
                        key={ach.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className={`glass-panel p-5 rounded-2xl border transition-all duration-500 flex flex-col items-center text-center justify-between gap-5 relative overflow-hidden cursor-pointer ${rarity.glowClass} ${
                          !ach.unlocked && "opacity-50"
                        }`}
                      >
                        {/* Glowing sparkles inside unlocked card background */}
                        {ach.unlocked && (
                          <div className="absolute top-0 right-0 w-10 h-10 bg-white/5 rounded-full blur-[10px] pointer-events-none" />
                        )}

                        <span
                          className={`text-[8px] font-extrabold uppercase tracking-widest font-mono block self-end ${rarity.labelColor}`}
                        >
                          {rarity.name}
                        </span>

                        {/* Large Emoji Badge */}
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl select-none transition-all ${
                            ach.unlocked
                              ? "bg-zinc-900 border-2 border-white/10 shadow-lg scale-105"
                              : "bg-zinc-950 border border-zinc-800 opacity-40 text-zinc-650"
                          }`}
                        >
                          {ach.badge_url}
                        </div>

                        {/* Card Details */}
                        <div>
                          <h4 className="font-syne font-extrabold text-sm text-zinc-200">
                            {ach.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed px-1 min-h-[30px] line-clamp-2">
                            {ach.description}
                          </p>
                        </div>

                        {/* Card Footer Rarity Badge */}
                        <span
                          className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono border ${rarity.badgeGlow}`}
                        >
                          {ach.unlocked ? "Unlocked" : `+${ach.xp_reward} XP`}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
