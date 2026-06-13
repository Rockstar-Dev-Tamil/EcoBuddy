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
  category: "food" | "transportation" | "electricity" | "shopping" | "water" | "waste" | string;
  description: string;
  carbon_offset: number; // positive for offsets/reductions (kg)
  co2_emission: number; // absolute emission (kg)
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
