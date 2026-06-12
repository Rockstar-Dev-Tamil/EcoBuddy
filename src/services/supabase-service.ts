import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Profile, PlanetState, SustainabilityLog, LeaderboardEntry, ChatMessage } from "@/types";
import { ProfileSchema, PlanetStateSchema, } from "@/types/schemas";

export const SupabaseService = {
  /**
   * Check if Supabase client is active and configured
   */
  isEnabled(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  },

  /**
   * Fetch user profile. Seed it if it doesn't exist yet (first-time Google login).
   */
  async getProfile(
    userId: string,
    email?: string,
    defaultName?: string,
    defaultAvatar?: string
  ): Promise<Profile | null> {
    if (!this.isEnabled()) return null;
    
    try {
      const { data, error } = await supabase!
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile not found - Auto seed it (especially for Google OAuth)
        const username = defaultName || (email ? email.split("@")[0] : "EcoAdventurer_" + userId.slice(0, 5));
        const avatar_url = defaultAvatar || "/avatars/avatar_default.png";
        const newProfile: Omit<Profile, "created_at"> = {
          id: userId,
          username,
          avatar_url,
          xp: 100,
          level: 1,
          streak_count: 1,
          green_score: 50,
        };

        const { data: inserted, error: insertError } = await supabase!
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        if (insertError) throw insertError;
        
        // Auto-seed planet state as well
        await this.seedPlanetState(userId);
        
        return inserted as Profile;
      }

      if (error) throw error;
      return ProfileSchema.parse(data) as Profile;
    } catch (e) {
      console.error("Error in Supabase getProfile:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Update Profile metrics (XP, level, score, streaks)
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    if (!this.isEnabled()) return null;
    try {
      const { data, error } = await supabase!
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (e) {
      console.error("Error in Supabase updateProfile:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Seed a default planet state for new users
   */
  async seedPlanetState(userId: string): Promise<PlanetState | null> {
    if (!this.isEnabled()) return null;
    try {
      const defaultPlanet = {
        profile_id: userId,
        vegetation: 0.5,
        rivers: 0.5,
        wildlife: 0.5,
        atmosphere_clarity: 0.5,
        pollution: 0.2,
        desertification: 0.3,
      };

      const { data, error } = await supabase!
        .from("planet_states")
        .insert([defaultPlanet])
        .select()
        .single();

      if (error) throw error;
      return data as PlanetState;
    } catch (e) {
      console.error("Error seeding planet state:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Fetch planet state for profile
   */
  async getPlanetState(userId: string): Promise<PlanetState | null> {
    if (!this.isEnabled()) return null;
    try {
      const { data, error } = await supabase!
        .from("planet_states")
        .select("*")
        .eq("profile_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // Missing planet state - seed it
        return await this.seedPlanetState(userId);
      }

      if (error) throw error;
      return PlanetStateSchema.parse(data) as PlanetState;
    } catch (e) {
      console.error("Error in Supabase getPlanetState:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Update planet visual factors
   */
  async updatePlanetState(userId: string, updates: Partial<PlanetState>): Promise<PlanetState | null> {
    if (!this.isEnabled()) return null;
    try {
      const { data, error } = await supabase!
        .from("planet_states")
        .update(updates)
        .eq("profile_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as PlanetState;
    } catch (e) {
      console.error("Error in Supabase updatePlanetState:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Get Sustainability Action Logs
   */
  async getLogs(userId: string): Promise<SustainabilityLog[]> {
    if (!this.isEnabled()) return [];
    try {
      const { data, error } = await supabase!
        .from("sustainability_logs")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SustainabilityLog[];
    } catch (e) {
      console.error("Error in Supabase getLogs:", e instanceof Error ? e.message : String(e));
      return [];
    }
  },

  /**
   * Add a new action log
   */
  async addLog(userId: string, log: Omit<SustainabilityLog, "id" | "profile_id" | "created_at">): Promise<SustainabilityLog | null> {
    if (!this.isEnabled()) return null;
    try {
      const { data, error } = await supabase!
        .from("sustainability_logs")
        .insert([{ ...log, profile_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data as SustainabilityLog;
    } catch (e) {
      console.error("Error in Supabase addLog:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Get chat logs
   */
  async getChats(userId: string): Promise<ChatMessage[]> {
    if (!this.isEnabled()) return [];
    try {
      const { data, error } = await supabase!
        .from("chat_history")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    } catch (e) {
      console.error("Error in Supabase getChats:", e instanceof Error ? e.message : String(e));
      return [];
    }
  },

  /**
   * Add chat log entry
   */
  async addChat(userId: string, sender: "user" | "ai", message: string): Promise<ChatMessage | null> {
    if (!this.isEnabled()) return null;
    try {
      const { data, error } = await supabase!
        .from("chat_history")
        .insert([{ profile_id: userId, sender, message }])
        .select()
        .single();

      if (error) throw error;
      return data as ChatMessage;
    } catch (e) {
      console.error("Error in Supabase addChat:", e instanceof Error ? e.message : String(e));
      return null;
    }
  },

  /**
   * Clear chat log history
   */
  async clearChat(userId: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    try {
      const { error } = await supabase!
        .from("chat_history")
        .delete()
        .eq("profile_id", userId);

      return !error;
    } catch (e) {
      console.error("Error in Supabase clearChat:", e instanceof Error ? e.message : String(e));
      return false;
    }
  },

  /**
   * Get global leaderboards rankings
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.isEnabled()) return [];
    try {
      const { data, error } = await supabase!
        .from("profiles")
        .select("id, username, xp, green_score")
        .order("xp", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return data.map((item: any, idx: number) => ({
        profile_id: String(item.id),
        username: String(item.username),
        xp: Number(item.xp),
        green_score: Number(item.green_score),
        rank: idx + 1,
        rank_movement: 0
      }));
    } catch (e) {
      console.error("Error in Supabase getLeaderboard:", e instanceof Error ? e.message : String(e));
      return [];
    }
  }
};
