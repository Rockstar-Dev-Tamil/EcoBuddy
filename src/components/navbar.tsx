/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useGame } from "@/stores/game-store";
import { 
  LayoutDashboard, 
  Globe, 
  Bot, 
  Camera, 
  Compass, 
  Users, 
  Flame, 
  Leaf, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  LogOut 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SupabaseService } from "@/services/supabase-service";

interface NavbarProps {
  children?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, userId, isLoading } = useGame();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !userId && pathname !== "/" && pathname !== "/auth/callback") {
      router.push("/");
    }
  }, [userId, isLoading, pathname, router]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "3D Planet", href: "/planet", icon: Globe },
    { name: "Carbon Tracker", href: "/carbon-tracker", icon: Activity },
    { name: "AI Twin", href: "/twin", icon: Bot },
    { name: "EcoSnap AI", href: "/ecosnap", icon: Camera },
    { name: "2050 Simulator", href: "/simulator", icon: Compass },
    { name: "Community", href: "/community", icon: Users },
  ];

  const getLevelName = (lvl: number) => {
    if (lvl >= 15) return "Forest Guardian";
    if (lvl >= 10) return "Tree";
    if (lvl >= 5) return "Plant";
    if (lvl >= 2) return "Sprout";
    return "Seed";
  };

  const xpProgress = profile ? (profile.xp % 1000) / 10 : 0;
  // const xpNeeded = profile ? 1000 - (profile.xp % 1000) : 1000;

  // Breadcrumbs parsing
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "EcoBuddy AI";
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
        <span>EcoBuddy</span>
        <span className="text-zinc-700">/</span>
        {segments.map((seg, idx) => {
          const name = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
          const isLast = idx === segments.length - 1;
          return (
            <React.Fragment key={idx}>
              <span className={isLast ? "text-white font-semibold font-syne" : ""}>{name}</span>
              {!isLast && <span className="text-zinc-700">/</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const handleLogOut = async () => {
    try {
      if (SupabaseService.isEnabled()) {
        const { error } = await supabase!.auth.signOut();
        if (error) throw error;
      }
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/");
    }
  };

  // If on Landing Auth page, do not render Layout Wrapper Shell
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0A0F0A] text-white">
      {/* 1. DESKTOP SIDEBAR NAVIGATION (lg:flex) */}
      <aside 
        className={`hidden lg:flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 bg-[#0A0F0A] border-r border-white/5 transition-all duration-300 ${
          isCollapsed ? "w-[72px]" : "w-60"
        }`}
      >
        <div>
          {/* Logo Brand area */}
          <div className="h-16 flex items-center px-4 border-b border-white/5 overflow-hidden">
            <Link href="/dashboard" className="flex items-center gap-3 select-none">
              <div className="p-2 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <span className="font-syne text-base font-bold bg-gradient-to-r from-white via-accent to-secondary bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                  EcoBuddy AI
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Links list */}
          <nav className="p-3 flex flex-col gap-1 mt-4" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`sidebar-link-${item.name.toLowerCase().replace(" ", "-")}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 group ${
                    isActive 
                      ? "bg-accent/10 text-accent border border-accent/20" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent" : "opacity-80 group-hover:opacity-100"}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                  
                  {/* Tooltip on collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-16 bg-[#111811] text-accent border border-accent/20 px-2 py-1 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-50 font-syne">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer collapse trigger */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-2 bg-[#0A0F0A]/50">
          {!isCollapsed && mounted && (
            <div className="px-2 py-1.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1.5">
              <div className="text-[10px] text-zinc-400 flex items-center justify-between font-mono">
                <span>LVL {profile?.level || 1}</span>
                <span>{xpProgress}%</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all duration-300"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* 2. RIGHT CONTENT PAGE container */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-60"
        }`}
      >
        {/* Top Floating Header Navbar */}
        <header className="sticky top-0 z-20 w-full bg-[#0A0F0A]/80 backdrop-blur-md border-b border-white/5 h-16 px-4 md:px-8 flex items-center justify-between">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            {getBreadcrumbs()}
          </div>

          {/* User Widgets (XP status, Streak, Profile Avatar) */}
          <div className="flex items-center gap-4">
            {/* Streak Indicator */}
            {mounted && profile && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{profile.streak_count} Day Streak</span>
              </div>
            )}

            {/* Level status indicator */}
            {mounted && profile && (
              <div className="hidden md:flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Lvl {profile.level}</span>
                <span className="text-[9px] text-zinc-400 font-semibold">{getLevelName(profile.level)}</span>
              </div>
            )}

            {/* User Profile avatar dropdown — keyboard accessible */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setProfileMenuOpen(false);
                  }}
                  onBlur={(e) => {
                    // Close when focus leaves the entire dropdown region
                    if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                      setProfileMenuOpen(false);
                    }
                  }}
                  id="profile-menu-button"
                  aria-haspopup="true"
                  aria-expanded={profileMenuOpen}
                  aria-label="Open profile menu"
                  className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent font-syne text-xs shadow-inner overflow-hidden cursor-pointer hover:border-accent transition-all duration-300 select-none"
                >
                  {mounted && profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    mounted && profile?.username ? profile.username[0].toUpperCase() : "U"
                  )}
                </button>

                {/* Keyboard-accessible logout dropdown */}
                {profileMenuOpen && (
                  <div
                    role="menu"
                    aria-labelledby="profile-menu-button"
                    className="absolute right-0 top-9 w-36 glass-panel p-2 border border-white/5 bg-[#111811] shadow-xl rounded-xl z-50"
                  >
                    <button
                      onClick={() => { handleLogOut(); setProfileMenuOpen(false); }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setProfileMenuOpen(false);
                        if (e.key === "Tab") setProfileMenuOpen(false);
                      }}
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
          </div>
        </header>

        {/* Page children contents */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col justify-start">
          {children}
        </main>
      </div>

      {/* 3. MOBILE FLOATING FOOTER NAVIGATION LINK BAR (lg:hidden) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 glass-panel rounded-full px-4 py-2 border border-white/10 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1 p-2 rounded-full relative transition-all duration-300"
              style={{ color: isActive ? "#00e676" : "rgba(244, 251, 244, 0.6)" }}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
