"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MockDB, Profile, PlanetState, SustainabilityLog, DailyChallenge, Achievement, LeaderboardEntry, ChatMessage, Group } from "@/lib/mock-db";
import { supabase } from "@/lib/supabase";
import { SupabaseService } from "@/services/supabase-service";

export interface DetectiveFinding {
  category: string;
  totalEmissions: number;
  percentage: number;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

interface GameContextType {
  profile: Profile;
  planet: PlanetState;
  logs: SustainabilityLog[];
  challenges: DailyChallenge[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  chats: ChatMessage[];
  groups: Group[];
  isLoading: boolean;
  userId: string | null;
  logAction: (category: string, description: string, co2Emission: number, carbonOffset: number, xpEarned: number) => Promise<SustainabilityLog>;
  sendChatMessage: (message: string) => Promise<ChatMessage>;
  clearChatHistory: () => void;
  joinOrLeaveGroup: (groupId: string) => void;
  createGroup: (name: string, type: string) => void;
  getDetectiveFindings: () => DetectiveFinding[];
  refreshAll: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  
  // App States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [planet, setPlanet] = useState<PlanetState | null>(null);
  const [logs, setLogs] = useState<SustainabilityLog[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback to localStorage MockDB
  const refreshAll = useCallback(() => {
    setProfile(MockDB.getProfile());
    setPlanet(MockDB.getPlanetState());
    setLogs(MockDB.getLogs());
    setChallenges(MockDB.getChallenges());
    setAchievements(MockDB.getAchievements());
    setLeaderboard(MockDB.getLeaderboard());
    setChats(MockDB.getChats());
    setGroups(MockDB.getGroups());
    setIsLoading(false);
  }, []);

  // Sync state with Supabase
  const loadSupabaseData = useCallback(async (
    uid: string,
    email?: string,
    defaultName?: string,
    defaultAvatar?: string
  ) => {
    setIsLoading(true);
    
    // Fetch profile, planet state, and logs from Supabase
    const dbProfile = await SupabaseService.getProfile(uid, email, defaultName, defaultAvatar);
    const dbPlanet = await SupabaseService.getPlanetState(uid);
    const dbLogs = await SupabaseService.getLogs(uid);
    const dbChats = await SupabaseService.getChats(uid);
    const dbLeaderboard = await SupabaseService.getLeaderboard();

    // Map profiles
    if (dbProfile) setProfile(dbProfile);
    if (dbPlanet) setPlanet(dbPlanet);
    setLogs(dbLogs);
    setChats(dbChats);
    
    // Use live rankings if populated, else mock rankings
    if (dbLeaderboard.length > 0) {
      setLeaderboard(dbLeaderboard);
    } else {
      setLeaderboard(MockDB.getLeaderboard());
    }

    // Static daily challenges and groups are matched client-side for ease
    setChallenges(MockDB.getChallenges());
    setAchievements(MockDB.getAchievements());
    setGroups(MockDB.getGroups());
    
    setIsLoading(false);
  }, []);

  // Listen to Supabase Auth State Changes
  useEffect(() => {
    if (SupabaseService.isEnabled()) {
      // Check current session
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserId(session.user.id);
          const metadata = session.user.user_metadata;
          const googleName = metadata?.username || metadata?.full_name || metadata?.name;
          const googleAvatar = metadata?.avatar_url || metadata?.picture;
          loadSupabaseData(session.user.id, session.user.email, googleName, googleAvatar);
        } else {
          setUserId(null);
          refreshAll();
        }
      });

      // Subscribe to auth state updates
      const { data: { subscription } } = supabase!.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUserId(session.user.id);
            const metadata = session.user.user_metadata;
            const googleName = metadata?.username || metadata?.full_name || metadata?.name;
            const googleAvatar = metadata?.avatar_url || metadata?.picture;
            await loadSupabaseData(session.user.id, session.user.email, googleName, googleAvatar);
          } else {
            setUserId(null);
            setProfile(null);
            setPlanet(null);
            refreshAll();
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Bypassed: Local Mock database
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserId(null);
      refreshAll();
    }
  }, [loadSupabaseData, refreshAll]);

  // Realtime Supabase Database Subscriptions
  useEffect(() => {
    if (userId && SupabaseService.isEnabled()) {
      const logsChannel = supabase!
        .channel(`realtime-logs-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sustainability_logs",
            filter: `profile_id=eq.${userId}`,
          },
          () => {
            SupabaseService.getLogs(userId).then((dbLogs) => {
              setLogs(dbLogs);
            });
          }
        )
        .subscribe();

      const profileChannel = supabase!
        .channel(`realtime-profile-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          () => {
            SupabaseService.getProfile(userId).then((dbProfile) => {
              if (dbProfile) setProfile(dbProfile);
            });
          }
        )
        .subscribe();

      const planetChannel = supabase!
        .channel(`realtime-planet-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "planet_states",
            filter: `profile_id=eq.${userId}`,
          },
          () => {
            SupabaseService.getPlanetState(userId).then((dbPlanet) => {
              if (dbPlanet) setPlanet(dbPlanet);
            });
          }
        )
        .subscribe();

      return () => {
        supabase!.removeChannel(logsChannel);
        supabase!.removeChannel(profileChannel);
        supabase!.removeChannel(planetChannel);
      };
    }
  }, [userId]);

  // Log a sustainability action (hybrid Supabase & Mock sync)
  const logAction = useCallback(async (
    category: string,
    description: string,
    co2Emission: number,
    carbonOffset: number,
    xpEarned: number
  ): Promise<SustainabilityLog> => {
    // 1. If Supabase is active, query database
    if (userId && SupabaseService.isEnabled()) {
      const currentProfile = profile || MockDB.getProfile();
      const currentPlanet = planet || MockDB.getPlanetState();

      // a. Insert Log entry
      const dbLog = await SupabaseService.addLog(userId, {
        category,
        description,
        carbon_offset: carbonOffset,
        co2_emission: co2Emission,
        xp_earned: xpEarned,
      });

      // b. Calculate new XP and Green Score
      const newXP = currentProfile.xp + xpEarned;
      const scoreDelta = carbonOffset > 0 
        ? Math.min(5, Math.ceil(carbonOffset * 2)) 
        : -Math.min(8, Math.ceil(Math.abs(carbonOffset) * 2.5));
      const newGreenScore = Math.max(10, Math.min(100, currentProfile.green_score + scoreDelta));
      const newLevel = Math.max(1, Math.floor(newXP / 1000) + 1);

      await SupabaseService.updateProfile(userId, {
        xp: newXP,
        green_score: newGreenScore,
        level: newLevel,
      });

      // c. Calculate Planet state changes
      const isPositive = carbonOffset > 0;
      const offsetMagnitude = Math.abs(carbonOffset);
      const planetUpdates: Partial<PlanetState> = {};

      if (isPositive) {
        planetUpdates.pollution = currentPlanet.pollution - offsetMagnitude * 0.03;
        planetUpdates.desertification = currentPlanet.desertification - offsetMagnitude * 0.02;
        if (category === "transport") {
          planetUpdates.atmosphere_clarity = currentPlanet.atmosphere_clarity + offsetMagnitude * 0.05;
        } else if (category === "diet") {
          planetUpdates.wildlife = currentPlanet.wildlife + 0.03;
          planetUpdates.vegetation = currentPlanet.vegetation + 0.02;
        } else if (category === "energy") {
          planetUpdates.atmosphere_clarity = currentPlanet.atmosphere_clarity + offsetMagnitude * 0.04;
        } else if (category === "waste") {
          planetUpdates.vegetation = currentPlanet.vegetation + 0.04;
        }
      } else {
        planetUpdates.pollution = currentPlanet.pollution + offsetMagnitude * 0.05;
        planetUpdates.desertification = currentPlanet.desertification + offsetMagnitude * 0.03;
        planetUpdates.atmosphere_clarity = currentPlanet.atmosphere_clarity - offsetMagnitude * 0.04;
        planetUpdates.vegetation = currentPlanet.vegetation - offsetMagnitude * 0.02;
        planetUpdates.wildlife = currentPlanet.wildlife - offsetMagnitude * 0.03;
      }

      await SupabaseService.updatePlanetState(userId, planetUpdates);

      // Increment local challenges trackers as client-side feedback
      MockDB.triggerChallengeProgress(category, 1);

      // Reload database values
      await loadSupabaseData(userId);
      return dbLog as SustainabilityLog;
    }

    // 2. Local Fallback
    const newLog = MockDB.addLog({
      category,
      description,
      carbon_offset: carbonOffset,
      co2_emission: co2Emission,
      xp_earned: xpEarned,
    });
    refreshAll();
    return newLog;
  }, [userId, profile, planet, loadSupabaseData, refreshAll]);

  // Send message in the Twin chatbot (hybrid sync)
  const sendChatMessage = useCallback(async (message: string): Promise<ChatMessage> => {
    // 1. Add user chat
    if (userId && SupabaseService.isEnabled()) {
      await SupabaseService.addChat(userId, "user", message);
    } else {
      MockDB.addChat("user", message);
    }
    
    if (userId && SupabaseService.isEnabled()) {
      await loadSupabaseData(userId);
    } else {
      refreshAll();
    }

    // 2. Fetch AI response (this calls the Gemini API route)
    let reply = "I am processing your query. Try reducing your daily electric consumption or opting for public transit.";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: chats }),
      });
      
      if (response.ok) {
        const data = await response.json();
        reply = data.reply;
      } else {
        const data = await response.json();
        throw new Error(data.error || "API Route returned an error status");
      }
    } catch (error) {
      console.warn("AI Chat API failed:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("connection") || errMsg.includes("Network") || errMsg.includes("fetch")) {
        reply = "I'm sorry, my neural plant pathways are currently disconnected! 🌿 Please check your connection or try again in a few moments.";
      } else {
        reply = "I'm sorry, my neural plant pathways are currently overloaded! 🌿 I am experiencing high demand. Please try again shortly once my leaves have rested.";
      }
    }

    // 3. Store AI response
    let aiMsg: ChatMessage;
    if (userId && SupabaseService.isEnabled()) {
      aiMsg = (await SupabaseService.addChat(userId, "ai", reply))!;
      await loadSupabaseData(userId);
    } else {
      aiMsg = MockDB.addChat("ai", reply);
      refreshAll();
    }

    return aiMsg;
  }, [userId, chats, loadSupabaseData, refreshAll]);

  const clearChatHistory = useCallback(async () => {
    setChats([]);
    if (userId && SupabaseService.isEnabled()) {
      await SupabaseService.clearChat(userId);
      await loadSupabaseData(userId);
    } else {
      MockDB.clearChat();
      refreshAll();
    }
  }, [userId, loadSupabaseData, refreshAll]);

  const joinOrLeaveGroup = useCallback((groupId: string) => {
    MockDB.toggleJoinGroup(groupId);
    refreshAll();
  }, [refreshAll]);

  const createGroup = useCallback((name: string, type: string) => {
    MockDB.createGroup(name, type);
    refreshAll();
  }, [refreshAll]);

  // Carbon Detective computation logic
  const getDetectiveFindings = useCallback((): DetectiveFinding[] => {
    const currentLogs = logs.length > 0 ? logs : MockDB.getLogs();
    
    // Group absolute emissions by category
    const categoryTotals: Record<string, number> = {
      transport: 0,
      diet: 0,
      energy: 0,
      waste: 0,
    };

    currentLogs.forEach((log) => {
      const cat = log.category in categoryTotals ? log.category : "waste";
      categoryTotals[cat] += log.co2_emission;
    });

    const total = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

    const config: Record<string, { desc: string; rec: string }> = {
      transport: {
        desc: "Single-passenger vehicle trips contribute significantly to your atmosphere smog.",
        rec: "Try carpooling, boarding public transit, or cycling. Clicking 'Fix This' will ask your Twin to optimize your commute budget.",
      },
      diet: {
        desc: "Frequent food deliveries and red-meat meals carry heavy logistics packaging and packaging waste.",
        rec: "Cook at home and try plant-based meals at least 3 times a week. Your twin can compile a weekly vegetarian meal plan.",
      },
      energy: {
        desc: "Electricity spikes are caused by leave-on cooling units and power-vampire appliances.",
        rec: "Optimize thermostat schedules, switch to smart strips, and purchase energy-star devices.",
      },
      waste: {
        desc: "Throwing away single-use plastics and failing to compost organic scraps creates methane leakage.",
        rec: "Use canvas bags, carry a metal tumbler, and filter waste. Your twin can guide you on composting setups.",
      },
    };

    return Object.entries(categoryTotals).map(([category, value]) => {
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      let severity: "high" | "medium" | "low" = "low";
      
      if (percentage > 40 || value > 8) {
        severity = "high";
      } else if (percentage > 20 || value > 4) {
        severity = "medium";
      }

      return {
        category,
        totalEmissions: parseFloat(value.toFixed(1)),
        percentage,
        severity,
        description: config[category]?.desc || "Unoptimized utility activity.",
        recommendation: config[category]?.rec || "Unplug idle appliances and log active recycling.",
      };
    }).sort((a, b) => b.totalEmissions - a.totalEmissions);
  }, [logs]);

  const fallbackProfile = profile || MockDB.getProfile();
  const fallbackPlanet = planet || MockDB.getPlanetState();

  return (
    <GameContext.Provider
      value={{
        profile: fallbackProfile,
        planet: fallbackPlanet,
        logs: userId ? logs : (logs.length > 0 ? logs : MockDB.getLogs()),
        challenges,
        achievements,
        leaderboard,
        chats,
        groups,
        isLoading,
        userId,
        logAction,
        sendChatMessage,
        clearChatHistory,
        joinOrLeaveGroup,
        createGroup,
        getDetectiveFindings,
        refreshAll,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};



export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
