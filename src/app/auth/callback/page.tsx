"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        if (code && supabase) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Supabase code exchange error:", error.message);
          }
        }
      } catch (err) {
        console.error("Callback handler exception:", err);
      } finally {
        router.push("/dashboard");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center p-8 glass-panel max-w-md w-full mx-4 border border-white/10 shadow-[0_0_50px_rgba(0,230,118,0.15)] relative overflow-hidden">
      {/* Dynamic glow effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]" />

      {/* Rotating custom loader */}
      <div className="relative w-16 h-16 flex items-center justify-center mb-6">
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-accent/25 animate-spin"
          style={{ animationDuration: "8s" }}
        />
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>

      <h2 className="font-syne font-extrabold text-base text-white tracking-widest uppercase text-glow text-center">
        Syncing Ecosystem
      </h2>
      <p className="text-[10px] font-mono text-zinc-400 mt-2 text-center max-w-[280px] leading-relaxed">
        Establishing secure authentication pathways...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[600px] bg-[#07110A] text-white">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 glass-panel max-w-md w-full mx-4 border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-transparent animate-spin mb-4" />
            <h2 className="font-syne font-bold text-sm uppercase tracking-widest text-zinc-500">
              Initializing Callback Handler
            </h2>
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
