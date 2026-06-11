"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGame } from "@/stores/game-store";
import { Globe, RefreshCw, Sparkles, AlertTriangle, ShieldCheck, Sun } from "lucide-react";
import { motion } from "framer-motion";

// Dynamically import Three.js / React Three Fiber component to prevent SSR errors
const PlanetViewer = dynamic(
  () => import("@/features/planet-3d/planet-viewer").then((mod) => mod.PlanetViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[450px] bg-zinc-950/20 border border-zinc-800/40 rounded-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
        <span className="text-sm font-syne font-bold text-zinc-500 uppercase tracking-widest">Initializing 3D WebGL Canvas...</span>
      </div>
    ),
  }
);

interface EcosystemCardProps {
  title: string;
  value: number;
  label: string;
  colorClass: string;
  icon: string;
}

// Circular Metric Progress Card Component
const EcosystemCard: React.FC<EcosystemCardProps> = ({ title, value, label, colorClass, icon }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-accent/20 hover:bg-white/[0.06] hover:shadow-[0_0_25px_rgba(0,230,118,0.04)] transition-all duration-300 group">
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">{title}</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base">{icon}</span>
          <span className="text-xs text-white font-extrabold font-syne">{label}</span>
        </div>
      </div>
      
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r={r} className="stroke-zinc-800/80 fill-transparent" strokeWidth="3" />
          <circle 
            cx="24" 
            cy="24" 
            r={r} 
            className={`${colorClass} fill-transparent transition-all duration-700 ease-out`} 
            strokeWidth="3" 
            strokeDasharray={circ} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-bold font-mono text-zinc-300">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

export default function PlanetPage() {
  const { planet } = useGame();

  // Core metrics state synced with local state for custom presets simulation
  const [vegetation, setVegetation] = useState(0.5);
  const [rivers, setRivers] = useState(0.5);
  const [wildlife, setWildlife] = useState(0.5);
  const [atmosphereClarity, setAtmosphereClarity] = useState(0.5);
  const [pollution, setPollution] = useState(0.2);
  const [desertification, setDesertification] = useState(0.3);

  // Programmatic controls state
  const [isNightMode, setIsNightMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Sync sliders to actual database planet state
  const syncWithLedger = () => {
    setVegetation(planet.vegetation);
    setRivers(planet.rivers);
    setWildlife(planet.wildlife);
    setAtmosphereClarity(planet.atmosphere_clarity);
    setPollution(planet.pollution);
    setDesertification(planet.desertification);
  };

  useEffect(() => {
    syncWithLedger();
  }, [planet]);

  // Preset extreme environmental simulations
  const applyPreset = (preset: "oasis" | "smog") => {
    if (preset === "oasis") {
      setVegetation(0.95);
      setRivers(0.85);
      setWildlife(0.9);
      setAtmosphereClarity(0.9);
      setPollution(0.02);
      setDesertification(0.05);
    } else {
      setVegetation(0.1);
      setRivers(0.15);
      setWildlife(0.05);
      setAtmosphereClarity(0.15);
      setPollution(0.85);
      setDesertification(0.8);
    }
  };

  // Warning or status calculations based on active settings
  const getPlanetaryStatus = () => {
    if (pollution > 0.6) {
      return {
        severity: "critical",
        title: "Acidic Atmosphere Warning",
        desc: "Thick smog and carbon compounds have accumulated. Clean up emissions logs to restore flora respiration.",
        color: "text-red-400 bg-red-500/10 border-red-500/25",
        icon: AlertTriangle,
      };
    }
    if (vegetation > 0.75 && pollution < 0.25) {
      return {
        severity: "pristine",
        title: "Pristine Wilderness Status",
        desc: "Lush vegetation cover is active. Diverse wildlife species are thriving in clean valleys.",
        color: "text-accent bg-emerald-500/10 border-emerald-500/25",
        icon: ShieldCheck,
      };
    }
    if (desertification > 0.5) {
      return {
        severity: "warning",
        title: "Topsoil Desertification Alert",
        desc: "Failing to log compost and recycling actions causes soil nutrient depletion. Forests are dry.",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
        icon: AlertTriangle,
      };
    }
    return {
      severity: "neutral",
      title: "Balanced Temperate Ecosystem",
      desc: "Maintain positive sustainability logs to offset carbon emissions and clear smog index.",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
      icon: Sun,
    };
  };

  const status = getPlanetaryStatus();

  // Metrics configurations
  const forestHealthValue = vegetation * 100;
  const forestHealthRating = forestHealthValue >= 75 ? "Excellent" : forestHealthValue >= 40 ? "Good" : "Poor";

  const airQualityValue = atmosphereClarity * 100;
  const airQualityRating = airQualityValue >= 75 ? "Pristine" : airQualityValue >= 40 ? "Good" : "Smoggy";

  const wildlifeValue = wildlife * 100;
  const wildlifeRating = wildlifeValue >= 75 ? "Rich" : wildlifeValue >= 40 ? "Moderate" : "Low";

  const waterEcoValue = rivers * 100;
  const waterEcoRating = waterEcoValue >= 70 ? "Healthy" : waterEcoValue >= 40 ? "Moderate" : "Polluted";

  const pollutionValue = pollution * 100;
  const pollutionRating = pollutionValue >= 65 ? "High" : pollutionValue >= 30 ? "Medium" : "Low";

  return (
    <div className="flex-1 flex flex-col pb-20 lg:pb-0 select-none">
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: 3D Viewport (Takes up 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent animate-pulse" />
              <span className="font-syne font-bold text-sm text-white uppercase tracking-wider">3D Virtual Ecosystem Shell</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">DRAG TO ROTATE • ZOOM TO EXPLORE</span>
          </div>

          {/* R3F WebGL Viewer container */}
          <div className="flex-1 min-h-[480px] glass-panel rounded-3xl overflow-hidden border border-white/5 relative bg-zinc-950/45 shadow-inner">
            <PlanetViewer
              vegetation={vegetation}
              rivers={rivers}
              wildlife={wildlife}
              atmosphereClarity={atmosphereClarity}
              pollution={pollution}
              desertification={desertification}
              cloudSpeedMultiplier={1.0}
              isNightMode={isNightMode}
              autoRotate={autoRotate}
            />
            
            {/* Presets absolute buttons overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <button
                onClick={() => applyPreset("oasis")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-accent text-xs font-bold font-syne transition-all duration-300 cursor-pointer text-center hover:scale-[1.02]"
              >
                Simulate Oasis
              </button>
              <button
                onClick={() => applyPreset("smog")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 text-xs font-bold font-syne transition-all duration-300 cursor-pointer text-center hover:scale-[1.02]"
              >
                Simulate Smog
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Adjustment Sliders Panel (Takes up 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-syne font-bold text-lg text-white">Ecosystem Health Metrics</h1>
                <p className="text-xs text-zinc-400 mt-1">Real-time status calculated from carbon logs.</p>
              </div>
              
              {/* Sync Button */}
              <button
                onClick={syncWithLedger}
                id="btn-sync-ledger"
                className="p-2.5 rounded-full bg-white/5 border border-white/5 text-accent hover:border-accent/30 hover:bg-accent/10 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                title="Sync with Ledger"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <hr className="border-zinc-800/80" />

            {/* Circular Progress Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EcosystemCard
                title="Forest Health"
                value={forestHealthValue}
                label={`🌲 ${forestHealthRating}`}
                colorClass="stroke-[#00e676]"
                icon="🌲"
              />
              <EcosystemCard
                title="Air Quality"
                value={airQualityValue}
                label={`🌤 ${airQualityRating}`}
                colorClass="stroke-[#1de9b6]"
                icon="🌤"
              />
              <EcosystemCard
                title="Wildlife Diversity"
                value={wildlifeValue}
                label={`🦋 ${wildlifeRating}`}
                colorClass="stroke-[#a855f7]"
                icon="🦋"
              />
              <EcosystemCard
                title="Water Ecosystem"
                value={waterEcoValue}
                label={`💧 ${waterEcoRating}`}
                colorClass="stroke-[#3b82f6]"
                icon="💧"
              />
              <div className="sm:col-span-2">
                <EcosystemCard
                  title="Pollution Index"
                  value={pollutionValue}
                  label={`⚠ ${pollutionRating}`}
                  colorClass="stroke-[#f43f5e]"
                  icon="⚠"
                />
              </div>
            </div>
          </div>

          {/* Programmatic Controls Box */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <h2 className="font-syne font-bold text-sm text-zinc-200">Environmental Controls</h2>
            <hr className="border-zinc-800/80" />
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsNightMode(!isNightMode)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold font-syne transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] ${
                  isNightMode
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {isNightMode ? "🌙 Night Mode" : "☀️ Day Mode"}
              </button>
              
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold font-syne transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] ${
                  autoRotate
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {autoRotate ? "🔄 Rotating" : "⏹️ Static"}
              </button>
            </div>
          </div>

          {/* Dynamic Ecosystem Warnings box */}
          <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300 ${status.color}`}>
            <status.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-syne font-bold text-sm block mb-1">{status.title}</span>
              <p className="text-xs opacity-80 leading-relaxed">{status.desc}</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
