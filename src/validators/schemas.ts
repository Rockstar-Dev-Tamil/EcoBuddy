/**
 * schemas.ts
 *
 * This file declares Zod runtime schemas used to validate inputs,
 * database records, and API communication payloads.
 */

import { z } from "zod";

/**
 * Zod schema for validating Profile structures.
 */
export const ProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().optional(),
  xp: z.number().min(0),
  level: z.number().min(1),
  streak_count: z.number().min(0),
  green_score: z.number().min(0).max(100),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
});

/**
 * Zod schema for validating PlanetState structures.
 */
export const PlanetStateSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  vegetation: z.number().min(0).max(1),
  rivers: z.number().min(0).max(1),
  wildlife: z.number().min(0).max(1),
  atmosphere_clarity: z.number().min(0).max(1),
  pollution: z.number().min(0).max(1),
  desertification: z.number().min(0).max(1),
  last_updated: z.string().datetime({ offset: true }).or(z.string()),
});

/**
 * Zod schema for validating SustainabilityLog structures.
 */
export const SustainabilityLogSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  category: z.string(),
  description: z.string(),
  carbon_offset: z.number(),
  co2_emission: z.number(),
  xp_earned: z.number().min(0),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
});

/**
 * Zod schema for validating DailyChallenge structures.
 */
export const DailyChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  xp_reward: z.number().min(0),
  category: z.string(),
  target_value: z.number().min(0),
  current_value: z.number().min(0),
  completed: z.boolean(),
  action_type: z.string(),
});

/**
 * Zod schema for validating Achievement structures.
 */
export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  badge_url: z.string(),
  xp_reward: z.number().min(0),
  unlocked: z.boolean(),
  unlocked_at: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

/**
 * Zod schema for validating LeaderboardEntry structures.
 */
export const LeaderboardEntrySchema = z.object({
  profile_id: z.string(),
  username: z.string(),
  xp: z.number().min(0),
  green_score: z.number().min(0).max(100),
  rank: z.number().min(1),
  rank_movement: z.number(),
});

/**
 * Zod schema for validating ChatMessage structures.
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  sender: z.enum(["user", "ai"]),
  message: z.string(),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
});

/**
 * Zod schema for validating Group structures.
 */
export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  created_by: z.string(),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
  member_count: z.number().min(0),
  joined: z.boolean(),
});
