"use client";

import React, { useState } from "react";
import { useGame } from "@/stores/game-store";
import { 
  Camera, 
  FileText,
  Check, 
  HelpCircle,
  Leaf, 
  ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GeminiEcoSnapService } from "@/services/gemini/ecosnap";

interface ScanResult {
  category: "diet" | "energy" | "transport" | "waste" | string;
  description: string;
  co2Emission: number;
  carbonOffset: number;
  sustainabilityScore: number;
  xpEarned: number;
  datasetExplain: string;
  confidence: number;
  alternatives: { name: string; carbonSaving: number; description: string }[];
  isMock?: boolean;
}

// Circular progress indicator component for scores
const ProgressCircle: React.FC<{ value: number; max: number; label: string; color: string }> = ({ value, max, label, color }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-xl p-3 flex-1 min-w-[70px]">
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r={r} className="stroke-zinc-800/80 fill-transparent" strokeWidth="2.5" />
          <circle 
            cx="24" 
            cy="24" 
            r={r} 
            className={`${color} fill-transparent transition-all duration-700 ease-out`} 
            strokeWidth="2.5" 
            strokeDasharray={circ} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-bold font-mono text-zinc-100">{value}</span>
      </div>
      <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wider text-center">{label}</span>
    </div>
  );
};

// Mini Vector Sprig drawing for speech bubbles
const MiniSprig: React.FC = () => {
  return (
    <div className="w-14 h-14 shrink-0 relative flex items-center justify-center select-none bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-md">
        <defs>
          <linearGradient id="miniBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>
        {/* Ears */}
        <path d="M 35,35 C 25,25 20,28 15,35 Z" fill="#22c55e" />
        <path d="M 65,35 C 75,25 80,28 85,35 Z" fill="#22c55e" />
        {/* Body */}
        <ellipse cx="50" cy="65" rx="20" ry="24" fill="url(#miniBody)" />
        {/* Head */}
        <circle cx="50" cy="42" r="18" fill="url(#miniBody)" />
        {/* Eyes */}
        <circle cx="43" cy="38" r="2" fill="#ffffff" />
        <circle cx="57" cy="38" r="2" fill="#ffffff" />
        {/* Smile */}
        <path d="M 46,45 Q 50,49 54,45" fill="none" stroke="#14532d" strokeWidth="1" />
        {/* Bud */}
        <circle cx="50" cy="20" r="3" fill="#f472b6" />
      </svg>
    </div>
  );
};

export default function EcoSnapPage() {
  const { logAction } = useGame();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);

  // Mock templates for testing
  const mockTemplates = [
    {
      name: "Mock Utility Bill",
      filename: "electricity-bill.pdf",
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    {
      name: "Mock Grocery Receipt",
      filename: "supermarket-receipt.jpg",
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    {
      name: "Mock Vegan Plate",
      filename: "healthy-dinner.png",
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFileInput(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFileInput(file);
  };

  const loadFileInput = (file: File) => {
    setFileName(file.name);
    setErrorMsg("");
    setScanResult(null);
    setIsLogged(false);
    setScanStep(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const loadTemplate = (template: typeof mockTemplates[0]) => {
    setFileName(template.filename);
    setSelectedImage(template.dataUrl);
    setErrorMsg("");
    setScanResult(null);
    setIsLogged(false);
    setScanStep(0);
  };

  const handleScan = async () => {
    if (!selectedImage) return;
    setIsScanning(true);
    setErrorMsg("");
    setScanResult(null);
    setIsLogged(false);
    setScanStep(1);

    // Simulate logs with timeouts
    const step2 = setTimeout(() => setScanStep(2), 800);
    const step3 = setTimeout(() => setScanStep(3), 1600);
    const step4 = setTimeout(() => setScanStep(4), 2400);

    try {
      const data = await GeminiEcoSnapService.scanImage(selectedImage, fileName);

      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);

      setScanStep(5);
      setScanResult(data);
    } catch (err) {
      console.error(err);
      setScanStep(0);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong during the analysis.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogToLedger = () => {
    if (!scanResult) return;
    logAction(
      scanResult.category,
      scanResult.description,
      scanResult.co2Emission,
      scanResult.carbonOffset,
      scanResult.xpEarned
    );
    setIsLogged(true);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "diet": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "energy": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
      case "waste": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "transport": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
      default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20 lg:pb-0 select-none">
      
      {/* Introduction Banner Area */}
      <div className="max-w-7xl w-full mx-auto px-4 py-4 shrink-0">
        <h1 className="font-cabinet font-extrabold text-2xl lg:text-3xl text-white tracking-tight">EcoSnap Vision Lab</h1>
        <p className="text-xs text-zinc-400 mt-1">
          OCR bill scanning & image vision powered by Gemini. Simply upload any receipt or grocery plate.
        </p>
      </div>

      <section className="flex-1 max-w-7xl w-full mx-auto px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Pane: Scan Upload Zone (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full bg-zinc-950/20">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest block mb-4">Laboratory Input</span>
              
              {/* Upload Card */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 aspect-video sm:aspect-square flex flex-col items-center justify-center bg-zinc-950/40 transition-all duration-300 ${
                  isDragActive 
                    ? "border-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.2)] bg-emerald-500/5 scale-[1.01]" 
                    : "border-zinc-800 hover:border-accent/40"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="file-upload-input"
                  aria-label="Upload sustainability receipt, meal, product label, or utility bill"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {selectedImage ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedImage} alt={`Preview of uploaded file: ${fileName}`} className="w-full h-full object-cover opacity-75" />
                    
                    {/* Glowing Laser Scan beam */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-1 bg-[#00E676] shadow-[0_0_15px_#00e676] animate-scan z-10" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-3 animate-pulse">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-zinc-300">Drag & drop receipt/meal photo here</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">PNG, JPG or WEBP formats</span>
                  </div>
                )}
              </div>

              {/* Demo presets */}
              <div className="mt-6">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2.5">Demo Presets</span>
                <div className="grid grid-cols-3 gap-2">
                  {mockTemplates.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadTemplate(t)}
                      className="px-3 py-2 text-[10px] font-syne font-bold glass-panel-hover rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white cursor-pointer hover:scale-[1.02] text-center"
                    >
                      {t.name.replace("Mock ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time scan pipelines */}
              {isScanning && (
                <div className="mt-5 p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col gap-3 font-mono">
                  <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest block border-b border-zinc-850 pb-1.5 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-accent animate-spin" />
                    <span>OCR Vision Status</span>
                  </span>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 1, text: "Reading image & extracting raw OCR text layers..." },
                      { id: 2, text: "Cross-referencing Agribalyse agricultural datasets..." },
                      { id: 3, text: "Consulting Open Food Facts database..." },
                      { id: 4, text: "Calibrating carbon equivalents & green index ratings..." }
                    ].map((step) => {
                      const isDone = scanStep > step.id || scanStep === 5;
                      const isActive = scanStep === step.id;
                      return (
                        <div key={step.id} className="flex items-center gap-2 text-[10px]">
                          {isDone ? (
                            <span className="text-accent font-bold">✓</span>
                          ) : isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                          )}
                          <span className={isDone ? "text-zinc-400" : isActive ? "text-accent font-bold" : "text-zinc-650"}>
                            {step.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {selectedImage && (
              <button
                onClick={handleScan}
                disabled={isScanning}
                id="btn-scan-action"
                aria-label={isScanning ? "Scanning image, please wait" : "Trigger AI Vision Analysis on uploaded image"}
                className="w-full mt-6 py-3.5 bg-accent hover:bg-accent-bright text-black font-syne font-bold rounded-full text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-accent/20 cursor-pointer disabled:opacity-50 hover:scale-[1.01] transition-all"
              >
                {isScanning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                    <span>Analyzing Scanned File...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Trigger AI Vision Analysis</span>
                  </>
                )}
              </button>
            )}

            {errorMsg && (
              <div
                className="flex items-center gap-2 text-red-400 text-xs font-semibold mt-2"
                role="alert"
                aria-live="assertive"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: AI Analysis findings Dashboard (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {scanResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full bg-zinc-950/20"
                role="status"
                aria-live="polite"
                aria-label={`Scan result: ${scanResult.description}`}
                aria-atomic="true"
              >
                <div>
                  {/* Category and Title */}
                  <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getCategoryColor(scanResult.category)}`}>
                        {scanResult.category}
                      </span>
                      <h2 className="font-syne font-bold text-base md:text-lg text-zinc-100 mt-2">{scanResult.description}</h2>
                    </div>

                    {/* Progress Rings */}
                    <div className="flex items-center gap-3">
                      <ProgressCircle 
                        value={scanResult.sustainabilityScore} 
                        max={100} 
                        label="Sustainability" 
                        color="stroke-accent" 
                      />
                      <ProgressCircle 
                        value={scanResult.confidence} 
                        max={100} 
                        label="Confidence" 
                        color="stroke-secondary" 
                      />
                    </div>
                  </div>

                  {/* CO2 statistics counter */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Carbon Emitted</span>
                      <span className="font-outfit font-extrabold text-base md:text-lg text-white mt-1 block">
                        {scanResult.co2Emission} kg
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Baseline Offset</span>
                      <span className={`font-outfit font-extrabold text-base md:text-lg mt-1 block ${
                        scanResult.carbonOffset >= 0 ? "text-accent" : "text-red-400"
                      }`}>
                        {scanResult.carbonOffset >= 0 ? "+" : ""}{scanResult.carbonOffset} kg
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">XP reward</span>
                      <span className="font-outfit font-extrabold text-base md:text-lg text-yellow-400 mt-1 block">
                        +{scanResult.xpEarned}
                      </span>
                    </div>
                  </div>

                  {/* AI Vision Assistant Sprig Narration speech bubble */}
                  <div className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-white/[0.02] flex gap-4 items-start mb-6">
                    <MiniSprig />
                    <div className="flex-1 text-xs text-zinc-300 leading-relaxed relative bg-zinc-950/40 px-3.5 py-2.5 rounded-xl border border-white/5">
                      <span className="font-syne font-bold text-accent block mb-1">Sprig&apos;s Vision Summary</span>
                      <p>
                        &quot;I analyzed this photo! I detected {scanResult.description} (a {scanResult.category} category). 
                        {scanResult.alternatives.length > 0 && ` If you substitute this with '${scanResult.alternatives[0].name}', you could offset about ${scanResult.alternatives[0].carbonSaving} kg CO₂! `}
                        Log this item to ledger now to secure your +{scanResult.xpEarned} XP!&quot;
                      </p>
                    </div>
                  </div>

                  {/* Alternatives */}
                  {scanResult.alternatives.length > 0 && (
                    <div className="mb-6">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Suggested Carbon-Offset Alternatives</span>
                      <div className="flex flex-col gap-2.5">
                        {scanResult.alternatives.map((alt, idx) => (
                          <div key={idx} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all duration-300 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-xs font-semibold text-zinc-200 block">{alt.name}</span>
                              <span className="text-[10px] text-zinc-500 mt-0.5 block">{alt.description}</span>
                            </div>
                            <span className="text-[10px] font-extrabold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-accent shrink-0">
                              Save {alt.carbonSaving} kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit action */}
                <button
                  onClick={handleLogToLedger}
                  disabled={isLogged}
                  id="btn-log-action"
                  aria-label={isLogged ? "Action already logged to your ledger" : "Log this sustainability action and earn XP"}
                  className={`w-full py-3.5 rounded-full font-syne font-bold text-xs flex items-center justify-center gap-2 border transition-all duration-300 cursor-pointer ${
                    isLogged
                      ? "bg-emerald-500/10 border-emerald-500/30 text-accent"
                      : "bg-white text-black hover:bg-zinc-200 border-white hover:scale-[1.01]"
                  }`}
                >
                  {isLogged ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Action Logged successfully (+{scanResult.xpEarned} XP)</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Log this Action & Gain XP</span>
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center h-full min-h-[400px] bg-zinc-950/20">
                <HelpCircle className="w-12 h-12 text-zinc-650 mb-3" />
                <h3 className="font-syne font-bold text-sm text-zinc-300 uppercase tracking-wider">Awaiting Scan Input</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-2 leading-relaxed">
                  Trigger an AI scanner analysis on the left to extract carbon footprints, sustainability ratings, and Sprig companion advice.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </section>
    </div>
  );
}
