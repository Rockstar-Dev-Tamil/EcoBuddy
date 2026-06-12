"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/stores/game-store";
import { supabase } from "@/lib/supabase";
import { SupabaseService } from "@/services/supabase-service";
import { MockDB } from "@/lib/mock-db";
import { User, Camera, LogOut, Flame, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, achievements, refreshAll, userId } = useGame();
  
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Seed form values from profile state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (profile) {
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaveSuccess(false);
    setIsSaving(true);

    if (!username.trim()) {
      setErrorMsg("Username cannot be empty.");
      setIsSaving(false);
      return;
    }

    try {
      if (userId && SupabaseService.isEnabled()) {
        // Save to Supabase
        await SupabaseService.updateProfile(userId, {
          username: username.trim(),
          avatar_url: avatarUrl,
        });
      } else {
        // Save to Local MockDB
        MockDB.updateProfile({
          username: username.trim(),
          avatar_url: avatarUrl,
        });
      }
      
      refreshAll();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogOut = async () => {
    try {
      if (SupabaseService.isEnabled()) {
        const { error } = await supabase!.auth.signOut();
        if (error) throw error;
      }
      // Redirect to landing
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/");
    }
  };

  const getLevelName = (lvl: number) => {
    if (lvl >= 15) return "Forest Guardian";
    if (lvl >= 10) return "Tree";
    if (lvl >= 5) return "Plant";
    if (lvl >= 2) return "Sprout";
    return "Seed";
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (!mounted || !profile) {
    return (
      <div className="flex-1 flex flex-col pb-20 lg:pb-0 bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col pb-20 lg:pb-0">
      <section className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-xl text-white">Profile Dashboard</h1>
              <p className="text-xs text-zinc-400">Edit your credentials, choose an avatar, and check achievements.</p>
            </div>
          </div>

          <button
            onClick={handleLogOut}
            id="btn-profile-logout"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Edit credentials Form (7 cols) */}
          <div className="md:col-span-7">
            <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-5">
              <h2 className="font-syne font-bold text-base text-zinc-200">Personal Details</h2>
              
              <hr className="border-zinc-800/80" />

              {/* Avatar Uploader Preview */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center font-bold text-accent text-2xl overflow-hidden shadow-inner select-none">
                    {avatarUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                      </>
                    ) : (
                      username ? username[0].toUpperCase() : "U"
                    )}
                  </div>
                  {/* Uploader Input trigger overlay */}
                  <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity duration-300">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      aria-label="Upload Avatar Image"
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-300 block">Upload Profile Photo</span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Click the avatar circle to select a file. Max 1MB.</span>
                </div>
              </div>

              {/* Username Input */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label htmlFor="profile-username-input" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Username</label>
                <input
                  id="profile-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="EcoAdventurer"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/45 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                id="btn-save-profile"
                className="w-full py-3 bg-accent hover:bg-accent-bright text-black font-syne font-bold rounded-full text-xs transition-all duration-300 mt-4 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving profile..." : saveSuccess ? "Saved successfully!" : "Save Changes"}
              </button>

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-accent text-[10px] font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl text-center">
                  {errorMsg}
                </div>
              )}
            </form>
          </div>

          {/* Right: User Statistics Summary & Badges (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* Gamification metrics list */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
              <h2 className="font-syne font-bold text-base text-zinc-200">Ecology Stats</h2>
              
              <hr className="border-zinc-800/80" />

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Level Status</span>
                  <span className="text-emerald-400 font-bold">Lvl {profile.level} ({getLevelName(profile.level)})</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Total Experience</span>
                  <span className="text-zinc-200 font-mono">{profile.xp.toLocaleString()} XP</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Green Score Index</span>
                  <span className="text-accent font-bold">{profile.green_score} / 100</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Streak Count</span>
                  <span className="text-amber-500 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{profile.streak_count} Days</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Badges Unlocked</span>
                  <span className="text-purple-400 font-bold">{unlockedCount} / {achievements.length}</span>
                </div>
              </div>
            </div>

            {/* Locked/Unlocked Badges Shelf list */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
              <h2 className="font-syne font-bold text-sm text-zinc-200">Unlocked Badges Shelf</h2>
              
              <hr className="border-zinc-800/80" />

              {unlockedCount === 0 ? (
                <span className="text-xs text-zinc-500 text-center py-4">No badges unlocked yet. Complete daily logs to start earning!</span>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {achievements.filter((a) => a.unlocked).map((ach) => (
                    <div 
                      key={ach.id} 
                      className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xl select-none"
                      title={`${ach.name}: ${ach.description}`}
                    >
                      {ach.badge_url}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
