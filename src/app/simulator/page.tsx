"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Calendar, 
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import { MiniSprig } from "./components/MiniSprig";
import { WavyWater } from "./components/WavyWater";
import { ThermometerFill } from "./components/ThermometerFill";
import { TreesGrid } from "./components/TreesGrid";
import { useClimateMetrics } from "./hooks/useClimateMetrics";
export default function SimulatorPage() {
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto play simulator timeline
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveYear((prev) => {
          if (prev >= 2050) {
            setIsPlaying(false);
            return 2050; // Pause at end year
          }
          return prev + 1;
        });
      }, 850);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Dynamic calculations based on year selection (2026 to 2050)
  const metrics = useClimateMetrics(activeYear);

  const progressPercent = ((activeYear - 2026) / (2050 - 2026)) * 100;

  return (
    <div className="flex-1 flex flex-col pb-20 lg:pb-0 select-none">
      <section className="flex-grow max-w-7xl w-full mx-auto px-4 py-4 flex flex-col gap-6">
        
        {/* Intro Header area */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg text-white">Earth 2050 Climate Simulator</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Observe side-by-side projections of global offset habits.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Play/Pause timeline */}
            <button
              onClick={() => {
                if (activeYear >= 2050) setActiveYear(2026);
                setIsPlaying(!isPlaying);
              }}
              aria-label={isPlaying ? "Pause climate simulation" : activeYear >= 2050 ? "Restart climate simulation" : "Play climate simulation"}
              className={`px-4.5 py-2 rounded-full border text-xs font-bold font-syne transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                isPlaying
                  ? "bg-accent/15 border-accent/40 text-accent animate-pulse"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Simulation</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 bg-zinc-950/65 px-4.5 py-2 rounded-full border border-zinc-800 font-syne font-bold text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Year {activeYear}</span>
            </div>
          </div>
        </div>

        {/* Cinematic Timeline slider */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4 bg-zinc-950/15">
          <div className="flex justify-between items-center text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest">
            <span>2026 (Present)</span>
            <span className="text-accent text-xs font-bold font-syne tracking-wide">Timeline Index: Year {activeYear}</span>
            <span>2050 (Future Projection)</span>
          </div>
          
          <div className="relative w-full h-8 flex items-center">
            {/* Track bg */}
            <div className="absolute inset-y-3 left-0 right-0 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-350"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Slider */}
            <input
              type="range"
              min="2026"
              max="2050"
              step="1"
              value={activeYear}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveYear(parseInt(e.target.value));
              }}
              id="simulator-timeline-slider"
              aria-label="Simulation Timeline Year Selector"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {/* Handle glow */}
            <div 
              className="absolute w-5 h-5 rounded-full bg-white border-2 border-accent shadow-[0_0_12px_#00e676] pointer-events-none -ml-2.5 transition-all"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Side-by-Side Projection pathways */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* PATHWAY 1: Business as Usual (BAU) */}
          <div className="glass-panel p-6 rounded-2xl border border-red-500/10 bg-red-950/5 relative overflow-hidden flex flex-col justify-between gap-5 group hover:border-red-500/20 transition-all duration-300">
            {/* Murky Smog background glow */}
            <div 
              className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-[70px] pointer-events-none transition-colors duration-500" 
              style={{ backgroundColor: `rgba(244, 67, 54, ${0.03 + metrics.progress * 0.1})` }}
            />

            <div>
              <div className="flex justify-between items-center border-b border-red-500/10 pb-3 mb-4">
                <div>
                  <h2 className="font-syne font-bold text-sm md:text-base text-red-400 uppercase tracking-wider">Business As Usual</h2>
                  <p className="text-[10px] text-zinc-500">Unmitigated emissions, standard fossil utility pathways</p>
                </div>
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              </div>

              {/* 4 Story Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Temp */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden">
                  <ThermometerFill fillPercent={metrics.bau.tempPercent} colorClass="#f43f5e" />
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Temperature</span>
                    <span className="text-sm md:text-base font-outfit font-bold text-red-400 mt-1 block">+{metrics.bau.temp}°C</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 block">Warming acceleration</span>
                  </div>
                </div>

                {/* AQI */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Air Quality</span>
                      <span className="text-sm md:text-base font-outfit font-bold text-red-400 mt-1 block">{metrics.bau.aqi} AQI</span>
                    </div>
                    {/* Floating Smog Sphere */}
                    <div 
                      className="w-5 h-5 rounded-full transition-colors duration-700 ease-out border border-white/10" 
                      style={{ 
                        backgroundColor: metrics.progress > 0.6 ? "#4f4539" : "#65756c",
                        boxShadow: metrics.progress > 0.6 ? "0 0 10px rgba(79, 69, 57, 0.5)" : "none"
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-4 block">Hazardous smog index</span>
                </div>

                {/* Sea levels */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[100px]">
                  <div className="z-10">
                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Sea Level Rise</span>
                    <span className="text-sm md:text-base font-outfit font-bold text-red-400 mt-1 block">+{metrics.bau.seaLevel} cm</span>
                  </div>
                  {/* Wavy water */}
                  <WavyWater heightPercent={metrics.bau.seaPercent} colorClass="#f43f5e" />
                </div>

                {/* Forest cover */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Forest Canopy</span>
                    <span className="text-sm md:text-base font-outfit font-bold text-zinc-300 mt-1 block">{metrics.bau.forest}%</span>
                  </div>
                  <TreesGrid count={metrics.bau.forestCount} color="#f43f5e" />
                </div>

              </div>
            </div>
            
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] leading-relaxed">
              <strong>Emissions Spike:</strong> Vanishing forests and rising sea levels threaten local biodiversity.
            </div>
          </div>

          {/* PATHWAY 2: Sustainable Future (Eco) */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10 bg-emerald-950/5 relative overflow-hidden flex flex-col justify-between gap-5 group hover:border-accent/30 hover:shadow-[0_0_30px_rgba(0,230,118,0.05)] transition-all duration-300">
            {/* Verdant atmosphere glow */}
            <div 
              className="absolute -left-12 -top-12 w-48 h-48 rounded-full blur-[70px] pointer-events-none transition-colors duration-500" 
              style={{ backgroundColor: `rgba(0, 230, 118, ${0.03 + metrics.progress * 0.1})` }}
            />

            <div>
              <div className="flex justify-between items-center border-b border-emerald-500/10 pb-3 mb-4">
                <div>
                  <h2 className="font-syne font-bold text-sm md:text-base text-accent uppercase tracking-wider">Sustainable Future</h2>
                  <p className="text-[10px] text-zinc-500">Compost logs, rail transit, renewable household utilities</p>
                </div>
                <CheckCircle className="w-4 h-4 text-accent animate-pulse" />
              </div>

              {/* 4 Story Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Temp */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden">
                  <ThermometerFill fillPercent={metrics.eco.tempPercent} colorClass="#00e676" />
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Temperature</span>
                    <span className="text-sm md:text-base font-outfit font-bold text-accent mt-1 block">+{metrics.eco.temp}°C</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 block">Warming capped</span>
                  </div>
                </div>

                {/* AQI */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Air Quality</span>
                      <span className="text-sm md:text-base font-outfit font-bold text-accent mt-1 block">{metrics.eco.aqi} AQI</span>
                    </div>
                    {/* Floating clean sphere */}
                    <div 
                      className="w-5 h-5 rounded-full transition-colors duration-700 ease-out border border-accent/25" 
                      style={{ 
                        backgroundColor: "#1de9b6",
                        boxShadow: "0 0 10px rgba(29, 233, 182, 0.45)"
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-4 block">Excellent clean air index</span>
                </div>

                {/* Sea levels */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[100px]">
                  <div className="z-10">
                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Sea Level Rise</span>
                    <span className="text-sm md:text-base font-outfit font-bold text-accent mt-1 block">+{metrics.eco.seaLevel} cm</span>
                  </div>
                  {/* Wavy water */}
                  <WavyWater heightPercent={metrics.eco.seaPercent} colorClass="#3b82f6" />
                </div>

                {/* Forest cover */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Forest Canopy</span>
                    <span className="text-sm md:text-base font-outfit font-bold text-zinc-300 mt-1 block">{metrics.eco.forest}%</span>
                  </div>
                  <TreesGrid count={metrics.eco.forestCount} color="#00e676" />
                </div>

              </div>
            </div>
            
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-accent rounded-xl text-[10px] leading-relaxed">
              <strong>Offset Stable:</strong> Expanded reserves restore wildlife habitats and cap sea level surges.
            </div>
          </div>

        </div>

        {/* Sprig Storytelling Narration widget */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex gap-4.5 items-start mt-2">
          <MiniSprig />
          <div className="flex-1 text-xs text-zinc-300 leading-relaxed bg-zinc-950/45 border border-white/5 p-4 rounded-xl">
            <span className="font-syne font-bold text-accent block mb-1">Sprig&apos;s Simulator Narration</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <p className="border-r border-white/5 pr-4">
                <strong className="text-red-400 block mb-0.5">BAU Path:</strong>
                {metrics.bau.narration}
              </p>
              <p className="pl-0 md:pl-2">
                <strong className="text-accent block mb-0.5">Sustainable Path:</strong>
                {metrics.eco.narration}
              </p>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
