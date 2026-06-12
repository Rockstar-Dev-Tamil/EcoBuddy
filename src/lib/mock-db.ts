

import { Profile, PlanetState, SustainabilityLog, DailyChallenge, Achievement, LeaderboardEntry, ChatMessage, Group } from "@/types";

import {
  DEFAULT_PROFILE,
  DEFAULT_PLANET,
  DEFAULT_LOGS,
  DEFAULT_CHALLENGES,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_CHATS,
  DEFAULT_GROUPS,
  STATIC_LEADERBOARD,
} from "./mock-seed";
import { STORAGE_KEYS, getStorageItem, setStorageItem } from "./storage-utils";

// MOCK DATABASE ACCESSOR IMPLEMENTATION
export const MockDB = {
  getProfile: (): Profile => {
    return getStorageItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  },

  updateProfile: (updates: Partial<Profile>): Profile => {
    const profile = MockDB.getProfile();
    const updated = { ...profile, ...updates };
    
    // Check level progression based on XP (every 1000 XP is a level)
    if (updates.xp !== undefined) {
      const calculatedLevel = Math.max(1, Math.floor(updated.xp / 1000) + 1);
      if (calculatedLevel > updated.level) {
        updated.level = calculatedLevel;
        // Unlock level achievement if level >= 2
        if (calculatedLevel >= 2) {
          MockDB.unlockAchievement("first_level_up");
        }
      }
    }

    setStorageItem(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  getPlanetState: (): PlanetState => {
    return getStorageItem(STORAGE_KEYS.PLANET, DEFAULT_PLANET);
  },

  updatePlanetState: (updates: Partial<PlanetState>): PlanetState => {
    const planet = MockDB.getPlanetState();
    const updated = {
      ...planet,
      ...updates,
      last_updated: new Date().toISOString(),
    };
    
    // Bound values between 0.0 and 1.0
    const keys = ["vegetation", "rivers", "wildlife", "atmosphere_clarity", "pollution", "desertification"] as const;
    keys.forEach((key) => {
      if (updated[key] !== undefined) {
        updated[key] = Math.max(0, Math.min(1, updated[key]));
      }
    });

    setStorageItem(STORAGE_KEYS.PLANET, updated);
    return updated;
  },

  getLogs: (): SustainabilityLog[] => {
    return getStorageItem(STORAGE_KEYS.LOGS, DEFAULT_LOGS).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  addLog: (log: Omit<SustainabilityLog, "id" | "profile_id" | "created_at">): SustainabilityLog => {
    const logs = getStorageItem(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    const profile = MockDB.getProfile();
    const planet = MockDB.getPlanetState();
    
    const newLog: SustainabilityLog = {
      ...log,
      id: "log-" + Math.random().toString(36).substring(2, 9),
      profile_id: profile.id,
      created_at: new Date().toISOString(),
    };

    logs.push(newLog);
    setStorageItem(STORAGE_KEYS.LOGS, logs);

    // 1. Update Profile (XP & Green Score)
    const newXP = profile.xp + log.xp_earned;
    // Calculate new green score based on impact: positive offset increases, negative offsets (emissions) decrease
    // Max step change is 5 points
    const scoreDelta = log.carbon_offset > 0 
      ? Math.min(5, Math.ceil(log.carbon_offset * 2)) 
      : -Math.min(8, Math.ceil(Math.abs(log.carbon_offset) * 2.5));
    const newGreenScore = Math.max(10, Math.min(100, profile.green_score + scoreDelta));

    MockDB.updateProfile({
      xp: newXP,
      green_score: newGreenScore,
    });

    // 2. Adjust Planet State based on Log Category & carbon impact
    const isPositive = log.carbon_offset > 0;
    const offsetMagnitude = Math.abs(log.carbon_offset);
    
    const planetUpdates: Partial<PlanetState> = {};
    if (isPositive) {
      planetUpdates.pollution = planet.pollution - offsetMagnitude * 0.03;
      planetUpdates.desertification = planet.desertification - offsetMagnitude * 0.02;
      
      if (log.category === "transport") {
        planetUpdates.atmosphere_clarity = planet.atmosphere_clarity + offsetMagnitude * 0.05;
      } else if (log.category === "diet") {
        planetUpdates.wildlife = planet.wildlife + 0.03;
        planetUpdates.vegetation = planet.vegetation + 0.02;
      } else if (log.category === "energy") {
        planetUpdates.atmosphere_clarity = planet.atmosphere_clarity + offsetMagnitude * 0.04;
      } else if (log.category === "waste") {
        planetUpdates.vegetation = planet.vegetation + 0.04;
      }
    } else {
      // Negative impact (emissions)
      planetUpdates.pollution = planet.pollution + offsetMagnitude * 0.05;
      planetUpdates.desertification = planet.desertification + offsetMagnitude * 0.03;
      planetUpdates.atmosphere_clarity = planet.atmosphere_clarity - offsetMagnitude * 0.04;
      planetUpdates.vegetation = planet.vegetation - offsetMagnitude * 0.02;
      planetUpdates.wildlife = planet.wildlife - offsetMagnitude * 0.03;
    }
    
    MockDB.updatePlanetState(planetUpdates);

    // 3. Increment challenge if matching category
    MockDB.triggerChallengeProgress(log.category, 1);

    return newLog;
  },

  getChallenges: (): DailyChallenge[] => {
    return getStorageItem(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
  },

  triggerChallengeProgress: (actionCategory: string, increment = 1): void => {
    const challenges = MockDB.getChallenges();
    let updated = false;

    const modified = challenges.map((ch) => {
      // Match by category
      const matches = ch.category === actionCategory || 
                      (ch.action_type === "log_transport" && actionCategory === "transport") ||
                      (ch.action_type === "scan_receipt" && actionCategory === "energy") ||
                      (ch.action_type === "scan_meal" && actionCategory === "diet");

      if (matches && !ch.completed) {
        const newVal = Math.min(ch.target_value, ch.current_value + increment);
        const isDone = newVal >= ch.target_value;
        updated = true;

        if (isDone && !ch.completed) {
          // Award XP
          const profile = MockDB.getProfile();
          MockDB.updateProfile({ xp: profile.xp + ch.xp_reward });
        }

        return {
          ...ch,
          current_value: newVal,
          completed: isDone,
        };
      }
      return ch;
    });

    if (updated) {
      setStorageItem(STORAGE_KEYS.CHALLENGES, modified);
    }
  },

  resetDailyChallenges: (): DailyChallenge[] => {
    const reset = DEFAULT_CHALLENGES.map((c) => ({
      ...c,
      current_value: 0,
      completed: false,
    }));
    setStorageItem(STORAGE_KEYS.CHALLENGES, reset);
    return reset;
  },

  getAchievements: (): Achievement[] => {
    return getStorageItem(STORAGE_KEYS.ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS);
  },

  unlockAchievement: (achievementId: string): Achievement | null => {
    const achievements = MockDB.getAchievements();
    let unlockedObj: Achievement | null = null;
    let updated = false;

    const modified = achievements.map((ach) => {
      if (ach.id === achievementId && !ach.unlocked) {
        unlockedObj = {
          ...ach,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        };
        updated = true;
        
        // Award reward XP
        const profile = MockDB.getProfile();
        MockDB.updateProfile({ xp: profile.xp + ach.xp_reward });

        return unlockedObj;
      }
      return ach;
    });

    if (updated) {
      setStorageItem(STORAGE_KEYS.ACHIEVEMENTS, modified);
    }

    return unlockedObj;
  },

  getLeaderboard: (): LeaderboardEntry[] => {
    const profile = MockDB.getProfile();
    const userEntry: LeaderboardEntry = {
      profile_id: profile.id,
      username: profile.username,
      xp: profile.xp,
      green_score: profile.green_score,
      rank: 5, // Default Rank
      rank_movement: 0,
    };

    const list: LeaderboardEntry[] = STATIC_LEADERBOARD.map((item, idx) => ({
      profile_id: `competitor-${idx + 1}`,
      username: item.username,
      xp: item.xp,
      green_score: item.green_score,
      rank: 0,
      rank_movement: item.rank_movement,
    }));

    // Insert user and sort by XP desc
    list.push(userEntry);
    list.sort((a, b) => b.xp - a.xp);

    // Apply ranks
    return list.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  },

  getChats: (): ChatMessage[] => {
    return getStorageItem(STORAGE_KEYS.CHATS, DEFAULT_CHATS);
  },

  addChat: (sender: "user" | "ai", message: string): ChatMessage => {
    const chats = getStorageItem(STORAGE_KEYS.CHATS, DEFAULT_CHATS);
    const profile = MockDB.getProfile();
    const newChat: ChatMessage = {
      id: "msg-" + Math.random().toString(36).substring(2, 9),
      profile_id: profile.id,
      sender,
      message,
      created_at: new Date().toISOString(),
    };

    chats.push(newChat);
    setStorageItem(STORAGE_KEYS.CHATS, chats);

    // If chat twin challenge is active, increment it
    if (sender === "user") {
      MockDB.triggerChallengeProgress("chat_twin", 1);
    }

    return newChat;
  },

  clearChat: (): void => {
    setStorageItem(STORAGE_KEYS.CHATS, []);
  },

  getGroups: (): Group[] => {
    return getStorageItem(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  },

  createGroup: (name: string, type: string): Group => {
    const groups = MockDB.getGroups();
    const profile = MockDB.getProfile();
    const newGroup: Group = {
      id: "grp-" + Math.random().toString(36).substring(2, 9),
      name,
      type,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      member_count: 1,
      joined: true,
    };

    groups.push(newGroup);
    setStorageItem(STORAGE_KEYS.GROUPS, groups);
    return newGroup;
  },

  toggleJoinGroup: (groupId: string): Group | null => {
    const groups = MockDB.getGroups();
    let updatedGroup: Group | null = null;

    const modified = groups.map((g) => {
      if (g.id === groupId) {
        const joined = !g.joined;
        updatedGroup = {
          ...g,
          joined,
          member_count: joined ? g.member_count + 1 : g.member_count - 1,
        };
        return updatedGroup;
      }
      return g;
    });

    setStorageItem(STORAGE_KEYS.GROUPS, modified);
    return updatedGroup;
  },
};
