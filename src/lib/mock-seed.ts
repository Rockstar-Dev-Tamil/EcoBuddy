import {
  Profile,
  PlanetState,
  SustainabilityLog,
  DailyChallenge,
  Achievement,
  ChatMessage,
  Group,
} from "@/types";

export const DEFAULT_PROFILE: Profile = {
  id: "mock-user-id",
  username: "EcoAdventurer",
  avatar_url: "/avatars/avatar_default.png",
  xp: 150,
  level: 1,
  streak_count: 3,
  green_score: 64,
  created_at: new Date().toISOString(),
};

export const DEFAULT_PLANET: PlanetState = {
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

export const DEFAULT_LOGS: SustainabilityLog[] = [
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

export const DEFAULT_CHALLENGES: DailyChallenge[] = [
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

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
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

export const DEFAULT_CHATS: ChatMessage[] = [
  {
    id: "chat-1",
    profile_id: "mock-user-id",
    sender: "ai",
    message:
      "Hello! I am your AI Sustainability Twin. I am synchronized with your ecological logs and ready to help you optimize your carbon footprint. Ask me anything about transportation, recipe alternatives, energy saving, or simulations!",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEFAULT_GROUPS: Group[] = [
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

export const STATIC_LEADERBOARD = [
  { username: "LeafyEco", xp: 4500, green_score: 94, rank_movement: 0 },
  { username: "SolarKnight", xp: 3800, green_score: 88, rank_movement: 1 },
  { username: "RecyclePro", xp: 2900, green_score: 82, rank_movement: -1 },
  { username: "WindRider", xp: 1800, green_score: 74, rank_movement: 0 },
  { username: "UrbanFarmer", xp: 400, green_score: 45, rank_movement: 0 },
];
