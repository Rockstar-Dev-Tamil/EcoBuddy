"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Mail,
  Lock,
  Sparkles,
  Camera,
  Bot,
  Compass,
  Globe,
  ArrowRight,
  User,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SupabaseService } from "@/services/supabase-service";
import { useGame } from "@/stores/game-store";
import { SprigAvatar } from "@/components/sprig-avatar";

// Dynamically import the 3D PlanetViewer to prevent SSR/hydration mismatch errors
const PlanetViewer = dynamic(
  () => import("@/features/planet-3d/planet-viewer").then((mod) => mod.PlanetViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[180px] bg-zinc-950/20 border border-zinc-800/40 rounded-2xl">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin mb-2" />
        <span className="text-[9px] font-syne font-bold text-zinc-500 uppercase tracking-widest">
          3D Planet Loading...
        </span>
      </div>
    ),
  }
);

// Animated counting number counter component
const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const totalMilliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / end), 15);

    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMilliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return `${num}+`;
  };

  return <span>{formatNumber(count)}</span>;
};

// Static deterministic arrays for background assets to satisfy React purity checking
const stars = Array.from({ length: 35 }).map((_, i) => {
  const r1 = Math.sin(i * 12.34);
  const r2 = Math.cos(i * 56.78);
  return {
    id: i,
    x: Math.abs(Math.floor(r1 * 100000)) % 100,
    y: Math.abs(Math.floor(r2 * 100000)) % 100,
    size: Math.abs(r1) * 1.5 + 0.5,
    opacity: Math.abs(r2) * 0.7 + 0.3,
  };
});

const bgParticles = Array.from({ length: 15 }).map((_, i) => {
  const r1 = Math.sin(i * 90.12);
  const r2 = Math.cos(i * 34.56);
  return {
    id: i,
    x: Math.abs(Math.floor(r1 * 100000)) % 100,
    y: Math.abs(Math.floor(r2 * 100000)) % 100,
    size: (Math.abs(Math.floor(r1 * 100000)) % 3) + 2,
    duration: 12 + Math.abs(r2) * 12,
    delay: Math.abs(r1) * 5,
  };
});

export default function LandingPage() {
  const router = useRouter();
  const { userId, isLoading: isStoreLoading } = useGame();

  // Intro loading state transitions
  const [introStep, setIntroStep] = useState(0); // 0 = loading leaf, 1 = morphing to logo, 2 = main app revealed
  const [isIntroLoading, setIsIntroLoading] = useState(true);

  // Auth states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isStoreLoading && userId) {
      router.push("/dashboard");
    }
  }, [userId, isStoreLoading, router]);

  // Rotate social proof list items every 2.5s
  const socialProofItems = [
    { text: "AI-powered sustainability companion", icon: "🌎" },
    { text: "Personalized living ecosystem", icon: "🌱" },
    { text: "Gemini Vision analysis", icon: "📸" },
    { text: "Gamified habit tracking", icon: "🏆" },
  ];

  const [activeSocialProofIdx, setActiveSocialProofIdx] = useState(0);

  useEffect(() => {
    if (isIntroLoading) return;
    const timer = setInterval(() => {
      setActiveSocialProofIdx((prev) => (prev + 1) % socialProofItems.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isIntroLoading, socialProofItems.length]);

  // Handle simulated loading screen steps
  useEffect(() => {
    const t1 = setTimeout(() => {
      setIntroStep(1); // Morph leaf into logo
    }, 1800);

    const t2 = setTimeout(() => {
      setIntroStep(2); // Reveal main page
    }, 2800);

    const t3 = setTimeout(() => {
      setIsIntroLoading(false); // Remove loader completely from DOM
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);

    if (!email || (isSignUp && !username && !isOtpSent)) {
      setAuthError("Please fill out all required fields.");
      setIsLoading(false);
      return;
    }

    if (!SupabaseService.isEnabled()) {
      setAuthError(
        "Database connection not configured. Please set your Supabase environment variables."
      );
      setIsLoading(false);
      return;
    }

    try {
      if (!isOtpSent) {
        // Step 1: Send OTP code
        const { error } = await supabase!.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: isSignUp,
            data: isSignUp
              ? {
                  username: username.trim(),
                  full_name: username.trim(),
                }
              : undefined,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
        setIsOtpSent(true);
      } else {
        // Step 2: Verify OTP code
        if (!otpToken || otpToken.length !== 6) {
          setAuthError("Please enter a valid 6-digit verification code.");
          setIsLoading(false);
          return;
        }

        const { error } = await supabase!.auth.verifyOtp({
          email,
          token: otpToken.trim(),
          type: "email",
        });

        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Authentication Error:", err);
      let message = "Authentication failed. Please check your inputs.";
      if (err instanceof Error) {
        message = err.message;
        if (
          message.includes("Error sending magic link email") ||
          message.includes("magic link") ||
          message.includes("SMTP") ||
          message.includes("AuthApiError")
        ) {
          message =
            "Supabase email delivery failed (SMTP rate limit or unconfigured provider). Please click 'Proceed in Offline Sandbox Mode' below to explore EcoBuddy instantly.";
        }
      }
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError("");
    setIsLoading(true);

    if (!SupabaseService.isEnabled()) {
      setAuthError(
        "Database connection not configured. Please set your Supabase environment variables."
      );
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google Auth error:", err);
      let message = "Failed to start Google OAuth.";
      if (err instanceof Error) {
        message = err.message;
      }
      setAuthError(
        `${message} Please click 'Proceed in Offline Sandbox Mode' below to explore EcoBuddy instantly.`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07110A] text-white overflow-hidden flex flex-col font-sans selection:bg-accent/30 selection:text-white">
      {/* 1. ANIMATED LIVING BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient Blurred Green/Teal gradients */}
        <motion.div
          animate={{
            x: [-40, 20, -40],
            y: [-30, 40, -30],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-950/20 blur-[130px] opacity-70"
        />
        <motion.div
          animate={{
            x: [20, -30, 20],
            y: [30, -20, 30],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-[-100px] w-[500px] h-[500px] rounded-full bg-accent-dim/10 blur-[150px] opacity-60"
        />
        <motion.div
          animate={{
            x: [-20, 40, -20],
            y: [50, -30, 50],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-60 left-1/3 w-[550px] h-[550px] rounded-full bg-secondary-dim/15 blur-[140px] opacity-65"
        />

        {/* Quiet stars background */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}

        {/* Floating background dust/particles */}
        {bgParticles.map((part) => (
          <motion.div
            key={part.id}
            className="absolute rounded-full bg-accent/20"
            style={{
              left: `${part.x}%`,
              top: `${part.y}%`,
              width: `${part.size}px`,
              height: `${part.size}px`,
            }}
            animate={{
              y: ["0px", "-120px", "0px"],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: part.duration,
              delay: part.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Premium noise overlay texture */}
        <div className="noise-bg" />
      </div>

      {/* 2. LOADING INTRO SCREEN OVERLAY */}
      <AnimatePresence>
        {isIntroLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07110A]"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Rotating glowing leaf (Step 0) */}
              {introStep === 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: 360 }}
                  transition={{
                    scale: { duration: 0.6 },
                    opacity: { duration: 0.6 },
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  }}
                  className="w-20 h-20 text-accent filter drop-shadow-[0_0_25px_rgba(0,230,118,0.7)]"
                >
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.3 2.7C18.9 1.9 14 3 10.6 6.4C7.2 9.8 6.2 14.6 6.3 18L2.7 21.6C2.3 22 2.3 22.6 2.7 23C2.9 23.2 3.2 23.3 3.5 23.3S4.1 23.2 4.3 23L7.9 19.4C11.3 19.5 16.1 18.5 19.5 15.1C22.9 11.7 24 6.8 21.3 2.7ZM17.4 13.1C15 15.5 11 16.3 8 15.8C9.3 14 11.2 11.8 13.5 9.5C13.9 9.1 13.9 8.5 13.5 8.1C13.1 7.7 12.5 7.7 12.1 8.1C9.8 10.4 7.6 12.3 5.8 13.6C5.3 10.6 6.1 6.6 8.5 4.2C11 1.7 14.7 0.9 16.6 1.3C18.6 7.5 19.9 10.6 17.4 13.1Z"
                      fill="currentColor"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Leaf morphs and transforms into the EcoBuddy Logo (Step 1) */}
              {introStep === 1 && (
                <motion.div
                  initial={{ scale: 0.5, rotate: 180, opacity: 0 }}
                  animate={{ scale: 1.15, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="w-28 h-28 filter drop-shadow-[0_0_40px_rgba(0,230,118,0.5)] flex items-center justify-center"
                >
                  <Image
                    src="/logo.png"
                    alt="EcoBuddy Logo"
                    width={112}
                    height={112}
                    className="object-contain rounded-3xl"
                    priority
                  />
                </motion.div>
              )}

              {/* Orbiting loading dust particles (Steps 0 and 1) */}
              {introStep < 2 && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute inset-0 border border-dashed border-accent/25 rounded-full"
                  />
                  {[...Array(6)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-accent to-secondary"
                      animate={{
                        x: [
                          Math.cos((idx * Math.PI) / 3) * 110,
                          Math.cos((idx * Math.PI) / 3 + Math.PI * 2) * 110,
                        ],
                        y: [
                          Math.sin((idx * Math.PI) / 3) * 110,
                          Math.sin((idx * Math.PI) / 3 + Math.PI * 2) * 110,
                        ],
                        scale: [0.8, 1.3, 0.8],
                        opacity: [0.3, 0.9, 0.3],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        ease: "linear",
                        delay: idx * 0.1,
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Glowing text statement */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 font-syne font-bold text-xs uppercase tracking-[0.25em] text-accent/80 text-glow"
            >
              Growing your future
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN LANDING CONTENT */}
      {!isIntroLoading && (
        <>
          {/* Brand logo header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10 select-none shrink-0"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shadow-[0_4px_20px_rgba(0,230,118,0.1)] cursor-pointer"
              >
                <Image
                  src="/logo.png"
                  alt="EcoBuddy logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-syne font-bold text-base tracking-tight bg-gradient-to-r from-white via-[#00E676] to-[#1DE9B6] bg-clip-text text-transparent">
                  EcoBuddy AI
                </span>
                <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase">
                  Ecosystem Companion
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                Gemini 3.5 Engine
              </span>
            </div>
          </motion.div>

          {/* Main Column container */}
          <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 z-10 py-8 lg:py-0">
            <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* LEFT COLUMN: HERO, SOCIAL PROOF, STATS */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
                className="lg:col-span-7 flex flex-col gap-8 text-left"
              >
                {/* Platform Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim/15 text-accent text-[10px] font-bold uppercase tracking-widest border border-accent/20 w-max">
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                  <span>The Autonomous Eco Companion</span>
                </div>

                {/* Cabinet Grotesk / Syne Hero Text */}
                <h1 className="font-syne font-extrabold text-5xl sm:text-6xl lg:text-[70px] text-white leading-[90%] tracking-tight max-w-2xl">
                  See the future
                  <br />
                  you&apos;re creating,
                  <br />
                  and take action
                  <br />
                  to build a<br />
                  <span className="bg-gradient-to-r from-[#00E676] via-[#1DE9B6] to-[#00E676] bg-clip-text text-transparent animate-shimmer-text bg-[length:200%_auto] text-glow filter drop-shadow-[0_0_20px_rgba(0,230,118,0.25)]">
                    greener one.
                  </span>
                </h1>

                {/* Social Proof items carousel */}
                <div className="h-10 relative overflow-hidden max-w-lg mt-1 select-none">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSocialProofIdx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.45 }}
                      className="flex items-center gap-3 text-zinc-300 font-syne text-sm font-semibold tracking-wide"
                    >
                      <span className="text-lg flex items-center justify-center p-1.5 rounded-lg bg-white/5 border border-white/5">
                        {socialProofItems[activeSocialProofIdx].icon}
                      </span>
                      <span>{socialProofItems[activeSocialProofIdx].text}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
                  EcoBuddy AI translates active transportation, organic diet, smart electricity, and
                  recycling logs into a beautiful, living 3D ecosystem. Track your carbon decisions
                  in real-time.
                </p>

                {/* Statistics counters section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl py-4 border-y border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="font-syne font-extrabold text-2xl sm:text-3xl text-white">
                      <AnimatedCounter value={1000000} />
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-snug">
                      CO₂ decisions simulated
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-syne font-extrabold text-2xl sm:text-3xl text-[#1DE9B6]">
                      <AnimatedCounter value={25000} />
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-snug">
                      Eco actions tracked
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-syne font-extrabold text-2xl sm:text-3xl text-white">
                      <AnimatedCounter value={100} />
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-snug">
                      Daily challenges
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-syne font-extrabold text-2xl sm:text-3xl text-accent font-mono">
                      ∞
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-snug">
                      Future possibilities
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* RIGHT COLUMN: FLOATING GLASS AUTHENTICATION CARD */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: "easeOut" }}
                className="lg:col-span-5 flex justify-center w-full"
              >
                <div
                  className="w-full max-w-[430px] p-6 sm:p-8 flex flex-col gap-6 relative"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "32px",
                    boxShadow:
                      "0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {/* Subtle top indicator bar */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E676]/30 to-transparent" />

                  {!SupabaseService.isEnabled() ? (
                    <div
                      className="flex flex-col gap-4 text-center p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-450 rounded-2xl"
                      role="alert"
                    >
                      <AlertTriangle
                        className="w-8 h-8 mx-auto animate-bounce text-yellow-500"
                        aria-hidden="true"
                      />
                      <h3 className="font-syne font-bold text-sm text-yellow-400">
                        Database Offline
                      </h3>
                      <p className="text-[10px] leading-relaxed text-zinc-400">
                        Supabase environment variables are missing. Please set{" "}
                        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to connect to your live database.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Header title */}
                      <div className="text-center">
                        <h2 className="font-syne font-extrabold text-xl sm:text-2xl text-white tracking-wide">
                          {isOtpSent
                            ? "Verify Your Email"
                            : isSignUp
                              ? "Create an Account"
                              : "Access EcoBuddy"}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
                          {isOtpSent
                            ? `Enter the 6-digit code sent to ${email}`
                            : isSignUp
                              ? "Begin your environmental journey"
                              : "Synchronize your sustainability logs"}
                        </p>
                      </div>

                      {/* Google Authenticator (PRIMARY) - only when OTP is not sent */}
                      {!isOtpSent && (
                        <>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleGoogleAuth}
                              disabled={isLoading}
                              id="btn-auth-google"
                              aria-label="Continue with Google"
                              className="w-full h-[56px] px-6 bg-white hover:bg-slate-100 text-slate-900 font-syne font-bold rounded-full text-sm transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-lg hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50"
                            >
                              <svg
                                className="w-5 h-5 shrink-0"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.07-.22-.12-.45-.12-.63z"
                                />
                                <path
                                  fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                              </svg>
                              <span>Continue with Google</span>
                            </button>
                          </div>

                          {/* Or statement */}
                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-white/5" />
                            <span className="flex-shrink mx-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
                              or continue with email
                            </span>
                            <div className="flex-grow border-t border-white/5" />
                          </div>
                        </>
                      )}

                      {/* Auth Form Submission (SECONDARY) */}
                      <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                        {!isOtpSent ? (
                          <>
                            {isSignUp && (
                              <div className="relative">
                                <label htmlFor="auth-username" className="sr-only">
                                  Username
                                </label>
                                <input
                                  id="auth-username"
                                  type="text"
                                  required
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  placeholder="Username"
                                  aria-label="Username"
                                  className="w-full h-[56px] pl-12 pr-4 bg-white/[0.03] border border-white/10 focus:border-accent/40 focus:ring-1 focus:ring-accent/40 text-xs text-white placeholder-zinc-500 rounded-full transition-all focus:outline-none"
                                />
                                <div className="absolute left-4.5 top-5 text-zinc-500">
                                  <User className="w-4 h-4" aria-hidden="true" />
                                </div>
                              </div>
                            )}

                            <div className="relative">
                              <label htmlFor="auth-email" className="sr-only">
                                Email address
                              </label>
                              <input
                                id="auth-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                aria-label="Email address"
                                className="w-full h-[56px] pl-12 pr-4 bg-white/[0.03] border border-white/10 focus:border-accent/40 focus:ring-1 focus:ring-accent/40 text-xs text-white placeholder-zinc-500 rounded-full transition-all focus:outline-none"
                              />
                              <div className="absolute left-4.5 top-5 text-zinc-500">
                                <Mail className="w-4 h-4" aria-hidden="true" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <label htmlFor="auth-email-readonly" className="sr-only">
                                Sending to email
                              </label>
                              <input
                                id="auth-email-readonly"
                                type="email"
                                disabled
                                value={email}
                                aria-label="Sending to email"
                                className="w-full h-[56px] pl-12 pr-4 bg-white/[0.01] border border-white/5 text-xs text-zinc-500 rounded-full opacity-60 cursor-not-allowed focus:outline-none"
                              />
                              <div className="absolute left-4.5 top-5 text-zinc-650">
                                <Mail className="w-4 h-4" aria-hidden="true" />
                              </div>
                            </div>

                            <div className="relative">
                              <label htmlFor="auth-otp" className="sr-only">
                                Verification Code
                              </label>
                              <input
                                id="auth-otp"
                                type="text"
                                required
                                maxLength={6}
                                value={otpToken}
                                onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                                placeholder="6-digit code"
                                aria-label="6-digit verification code"
                                className="w-full h-[56px] pl-12 pr-4 bg-white/[0.03] border border-white/10 focus:border-accent/40 focus:ring-1 focus:ring-accent/40 text-xs text-white placeholder-zinc-500 rounded-full text-center font-bold tracking-[0.5em] focus:outline-none"
                              />
                              <div className="absolute left-4.5 top-5 text-zinc-500">
                                <Lock className="w-4 h-4" aria-hidden="true" />
                              </div>
                            </div>
                          </>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          id="btn-auth-submit"
                          className="w-full h-[56px] bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-accent-dim/15 text-white font-syne font-bold rounded-full text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                        >
                          <span>
                            {isLoading
                              ? "Processing..."
                              : isOtpSent
                                ? isSignUp
                                  ? "Verify & Sign Up"
                                  : "Verify & Log In"
                                : "Send Verification Code"}
                          </span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>

                        {isOtpSent && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOtpSent(false);
                              setOtpToken("");
                              setAuthError("");
                            }}
                            className="text-[11px] text-zinc-400 hover:text-white transition-colors underline cursor-pointer self-center mt-1"
                          >
                            Go Back / Change Email
                          </button>
                        )}
                      </form>

                      {authError && (
                        <div className="flex flex-col gap-3">
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            role="alert"
                            className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-2xl text-center leading-relaxed font-medium"
                          >
                            {authError}
                          </motion.div>
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="w-full h-[56px] bg-accent/10 border border-accent/25 hover:border-accent/40 text-accent hover:text-white font-syne font-bold rounded-full text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            <span>Proceed in Offline Sandbox Mode</span>
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      {/* Toggle Sign Up/Log In and Guest links */}
                      <div className="flex flex-col gap-2.5 pt-2 text-center">
                        {!isOtpSent && (
                          <button
                            onClick={() => {
                              setIsSignUp(!isSignUp);
                              setAuthError("");
                            }}
                            id="btn-auth-toggle"
                            className="text-[11px] font-bold text-accent hover:text-[#39ff14] transition-colors cursor-pointer font-syne hover:underline"
                          >
                            {isSignUp
                              ? "Already have an account? Log In"
                              : "Don't have an account? Sign Up"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard")}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium hover:underline transition-colors cursor-pointer"
                        >
                          Preview Dashboard as Guest (Local Sandbox)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* 4. FEATURES BENTO GRID SECTION (BOTTOM) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
              className="max-w-[1400px] w-full mt-24 mb-16"
            >
              <div className="flex flex-col gap-2 mb-10 text-center sm:text-left select-none">
                <span className="text-[10px] text-accent uppercase font-extrabold tracking-[0.2em]">
                  Comprehensive Platform Features
                </span>
                <h3 className="font-syne font-extrabold text-2xl sm:text-3xl text-white">
                  Gamified Platform Bento
                </h3>
              </div>

              {/* Bento Layout Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* CARD 1: Personalized Planet (Takes 6 cols) */}
                <div className="md:col-span-6 glass-panel p-6 border border-white/5 flex flex-col justify-between overflow-hidden relative group hover:border-[#00E676]/30 hover:shadow-[0_8px_32px_rgba(0,230,118,0.08)] transition-all duration-300">
                  <div className="z-10 select-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-accent border border-emerald-500/20">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="font-syne font-extrabold text-xs text-white uppercase tracking-wider">
                        Personalized Planet
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mt-1">
                      Observe a living low-poly planetary model. The vegetation density, rivers,
                      clouds, and animal ecosystem react dynamically to your carbon logs.
                    </p>
                  </div>

                  {/* Rotating 3D WebGL preview */}
                  <div className="w-full h-[190px] relative overflow-hidden mt-4 bg-zinc-950/20 rounded-2xl border border-white/5">
                    <PlanetViewer
                      vegetation={0.8}
                      rivers={0.7}
                      wildlife={0.65}
                      pollution={0.12}
                      desertification={0.15}
                      autoRotate={true}
                    />
                  </div>
                </div>

                {/* CARD 2: EcoSnap Vision (Takes 6 cols) */}
                <div className="md:col-span-6 glass-panel p-6 border border-white/5 flex flex-col justify-between overflow-hidden relative group hover:border-[#00E676]/30 hover:shadow-[0_8px_32px_rgba(0,230,118,0.08)] transition-all duration-300">
                  <div className="z-10 select-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="font-syne font-extrabold text-xs text-cyan-400 uppercase tracking-wider">
                        EcoSnap Vision
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mt-1">
                      Upload receipt slips, grocery wrappers, or energy statements. Gemini Vision
                      parses and calculates immediate carbon points.
                    </p>
                  </div>

                  {/* Animated Scanner Preview */}
                  <div className="w-full h-[190px] mt-4 relative bg-zinc-950/30 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center p-4">
                    {/* Glowing scanning laser lines */}
                    <motion.div
                      animate={{
                        top: ["0%", "100%", "0%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10"
                    />

                    {/* Receipt visual mock */}
                    <div className="w-40 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[7px] text-zinc-500 font-mono flex flex-col gap-1.5 relative shadow-inner">
                      <div className="w-10 h-2 bg-zinc-800 rounded mb-1" />
                      <div className="flex justify-between">
                        <span>Oat Milk (Organic)</span>
                        <span className="text-accent">+10 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beef Burger patty</span>
                        <span className="text-red-400">+1.8kg CO₂</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recyclable Paper Bag</span>
                        <span className="text-accent">+5 XP</span>
                      </div>
                      <div className="border-t border-dashed border-zinc-800 pt-1 flex justify-between font-bold text-zinc-300 mt-1">
                        <span>NET CO₂ OFFSET</span>
                        <span className="text-[#1DE9B6]">-0.65 kg</span>
                      </div>

                      {/* Mock bounding boxes */}
                      <motion.div
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-5 left-2 right-2 border border-dashed border-cyan-400/40 rounded p-1 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 3: AI Twin Sprig (Takes 7 cols) */}
                <div className="md:col-span-7 glass-panel p-6 border border-white/5 flex flex-col justify-between overflow-hidden relative group hover:border-[#00E676]/30 hover:shadow-[0_8px_32px_rgba(0,230,118,0.08)] transition-all duration-300">
                  <div className="z-10 select-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="font-syne font-extrabold text-xs text-indigo-400 uppercase tracking-wider">
                        AI twin (Sprig)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-md mt-1">
                      Converse with Sprig, your virtual tree-spirit companion. Sprig answers
                      plant-based recipe requests, commutes audit parameters, and tracks
                      environmental milestones.
                    </p>
                  </div>

                  {/* Sprig Mascot & Speech Bubble */}
                  <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 relative">
                    {/* Speech bubble */}
                    <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl relative text-[10px] text-zinc-300 max-w-[180px] shadow-md backdrop-blur-sm self-center sm:-mr-4 z-10 leading-relaxed">
                      <span className="absolute bottom-[-6px] left-[50%] sm:left-auto sm:right-[-6px] sm:top-[50%] w-3 h-3 bg-zinc-950/80 border-b border-r border-white/10 rotate-45" />
                      {"Hi! I'm Sprig 🌿 Let's grow a greener future together."}
                    </div>

                    {/* Small sized avatar */}
                    <div className="scale-75 -mt-6 sm:-mt-0">
                      <SprigAvatar state="idle" />
                    </div>
                  </div>
                </div>

                {/* CARD 4: Earth 2050 (Takes 5 cols) */}
                <div className="md:col-span-5 glass-panel p-6 border border-white/5 flex flex-col justify-between overflow-hidden relative group hover:border-[#00E676]/30 hover:shadow-[0_8px_32px_rgba(0,230,118,0.08)] transition-all duration-300">
                  <div className="z-10 select-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="font-syne font-extrabold text-xs text-amber-400 uppercase tracking-wider">
                        Earth 2050
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mt-1">
                      Simulate planetary regional climate models (CO₂ density, AQI, sea levels)
                      depending on user habit trajectories.
                    </p>
                  </div>

                  {/* Slider Timeline Animation preview */}
                  <div className="w-full h-[130px] mt-6 bg-zinc-950/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 select-none">
                      <span>2026</span>
                      <span className="text-accent font-bold">2038</span>
                      <span>2050</span>
                    </div>

                    {/* Styled timeline slider bar */}
                    <div className="relative w-full h-[4px] bg-zinc-800 rounded-full flex items-center">
                      <div className="absolute left-0 w-1/2 h-full bg-gradient-to-r from-accent to-[#1DE9B6]" />
                      <motion.div
                        animate={{ x: [0, 80, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-1/2 w-4 h-4 rounded-full bg-white border border-[#1DE9B6] shadow-[0_0_10px_rgba(29,233,182,0.8)] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-300 font-syne font-bold select-none">
                      <div className="flex items-center gap-1">
                        <span className="text-[#1DE9B6]">AQI</span>
                        <span>42 (Pristine)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-red-400">Temp</span>
                        <span>+1.1 °C</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer text */}
          <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-600 font-semibold uppercase tracking-wider z-10 select-none shrink-0">
            <span>© 2026 EcoBuddy AI</span>
            <span>Developed in Pair Programming</span>
          </footer>
        </>
      )}
    </div>
  );
}
