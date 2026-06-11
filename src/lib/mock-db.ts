import { supabase, isSupabaseConfigured } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  streak_count: number;
  green_score: number;
  created_at: string;
}

export interface PlanetState {
  id: string;
  profile_id: string;
  vegetation: number; // 0 to 1
  rivers: number; // 0 to 1
  wildlife: number; // 0 to 1
  atmosphere_clarity: number; // 0 to 1
  pollution: number; // 0 to 1
  desertification: number; // 0 to 1
  last_updated: string;
}

export interface SustainabilityLog {
  id: string;
  profile_id: string;
  category: "transport" | "diet" | "energy" | "waste" | string;
  description: string;
  carbon_offset: number; // positive for offsets/reductions (kg)
  co2_emission: number;  // absolute emission (kg)
  xp_earned: number;
  created_at: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  category: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  action_type: "log_transport" | "scan_receipt" | "chat_twin" | "scan_meal" | string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_url: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface LeaderboardEntry {
  profile_id: string;
  username: string;
  xp: number;
  green_score: number;
  rank: number;
  rank_movement: number; // -1, 0, 1
}

export interface ChatMessage {
  id: string;
  profile_id: string;
  sender: "user" | "ai";
  message: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: "family" | "hostel" | "office" | "college" | string;
  created_by: string;
  created_at: string;
  member_count: number;
  joined: boolean;
}

// Keys for localStorage
const STORAGE_KEYS = {
  PROFILE: "ecobuddy_profile",
  PLANET: "ecobuddy_planet",
  LOGS: "ecobuddy_logs",
  CHALLENGES: "ecobuddy_challenges",
  ACHIEVEMENTS: "ecobuddy_achievements",
  CHATS: "ecobuddy_chats",
  GROUPS: "ecobuddy_groups",
};

// Standard Seed Data
const DEFAULT_PROFILE: Profile = {
  id: "mock-user-id",
  username: "EcoAdventurer",
  avatar_url: "/avatars/avatar_default.png",
  xp: 150,
  level: 1,
  streak_count: 3,
  green_score: 64,
  created_at: new Date().toISOString(),
};

const DEFAULT_PLANET: PlanetState = {
  id: "mock-planet-id",
  profile_id: "mock-user-id",
  vegetation: 0.45,
  rivers: 0.5,
  wildlife: 0.35,
  atmosphere_clarity: 0.6,
  pollution: 0.3,
  desertification: 0.4,
  last_updated: new Date().toISOString(),
};

const DEFAULT_LOGS: SustainabilityLog[] = [
  {
    id: "log-1",
    profile_id: "mock-user-id",
    category: "transport",
    description: "Rode a bicycle to the local market",
    carbon_offset: 1.2,
    co2_emission: 0,
    xp_earned: 50,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "log-2",
    profile_id: "mock-user-id",
    category: "diet",
    description: "Prepared an organic plant-based vegetarian lunch",
    carbon_offset: 0.8,
    co2_emission: 0.2,
    xp_earned: 40,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: "log-3",
    profile_id: "mock-user-id",
    category: "energy",
    description: "Left AC running for 4 hours while away",
    carbon_offset: -2.5,
    co2_emission: 3.2,
    xp_earned: 0,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
];

const DEFAULT_CHALLENGES: DailyChallenge[] = [
  {
    id: "ch-1",
    title: "Eco Transportation",
    description: "Use public transport, bike, or walk to work/school today.",
    xp_reward: 120,
    category: "transport",
    target_value: 1,
    current_value: 0,
    completed: false,
    action_type: "log_transport",
  },
  {
    id: "ch-2",
    title: "Green Meal",
    description: "Log a meal that is fully plant-based (vegan or vegetarian).",
    xp_reward: 100,
    category: "diet",
    target_value: 1,
    current_value: 1,
    completed: true,
    action_type: "scan_meal",
  },
  {
    id: "ch-3",
    title: "Eco Companion Advice",
    description: "Consult your AI Sustainability Twin about a greener alternative.",
    xp_reward: 80,
    category: "chat_twin",
    target_value: 1,
    current_value: 0,
    completed: false,
    action_type: "chat_twin",
  },
  {
    id: "ch-4",
    title: "EcoSnap Action",
    description: "Scan a utility bill or grocery receipt to analyze impact.",
    xp_reward: 150,
    category: "energy",
    target_value: 1,
    current_value: 0,
    completed: false,
    action_type: "scan_receipt",
  },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_scan",
    name: "First EcoSnap",
    description: "Scanned your first receipt or item using computer vision.",
    badge_url: "📷",
    xp_reward: 150,
    unlocked: true,
    unlocked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "first_level_up",
    name: "Sprouting Up",
    description: "Reached Level 2 and started your sustainability journey.",
    badge_url: "🌱",
    xp_reward: 200,
    unlocked: false,
  },
  {
    id: "streak_7",
    name: "Eco Devotee",
    description: "Maintained a 7-day sustainable action logging streak.",
    badge_url: "🔥",
    xp_reward: 300,
    unlocked: false,
  },
  {
    id: "carbon_detective",
    name: "Carbon Detective",
    description: "Found your top carbon contributors using the Carbon Detective tool.",
    badge_url: "🕵️",
    xp_reward: 250,
    unlocked: false,
  },
];

const DEFAULT_CHATS: ChatMessage[] = [
  {
    id: "chat-1",
    profile_id: "mock-user-id",
    sender: "ai",
    message: "Hello! I am your AI Sustainability Twin. I am synchronized with your ecological logs and ready to help you optimize your carbon footprint. Ask me anything about transportation, recipe alternatives, energy saving, or simulations!",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_GROUPS: Group[] = [
  {
    id: "grp-1",
    name: "Green Family",
    type: "family",
    created_by: "mock-user-id",
    created_at: new Date().toISOString(),
    member_count: 4,
    joined: true,
  },
  {
    id: "grp-2",
    name: "Shared Dormitory 3B",
    type: "hostel",
    created_by: "other-user",
    created_at: new Date().toISOString(),
    member_count: 8,
    joined: false,
  },
  {
    id: "grp-3",
    name: "Eco Tech HQ",
    type: "office",
    created_by: "manager",
    created_at: new Date().toISOString(),
    member_count: 15,
    joined: false,
  },
];

const STATIC_LEADERBOARD = [
  { username: "LeafyEco", xp: 4500, green_score: 94, rank_movement: 0 },
  { username: "SolarKnight", xp: 3800, green_score: 88, rank_movement: 1 },
  { username: "RecyclePro", xp: 2900, green_score: 82, rank_movement: -1 },
  { username: "WindRider", xp: 1800, green_score: 74, rank_movement: 0 },
  { username: "UrbanFarmer", xp: 400, green_score: 45, rank_movement: 0 },
];

// Browser helper checking
const isBrowser = typeof window !== "undefined";

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Local storage error:", error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Local storage set error:", error);
  }
};

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
