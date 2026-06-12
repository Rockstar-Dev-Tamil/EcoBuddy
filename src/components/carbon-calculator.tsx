"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CARBON_CONSTANTS } from "@/lib/carbon-utils";
import { useGame } from "@/stores/game-store";
import { 
  CarFront, 
  Utensils, 
  Zap, 
  ShoppingCart, 
  Droplet, 
  Trash2,
  CheckCircle,
  Plus
} from "lucide-react";

// Icons for categories
const CATEGORY_ICONS: Record<string, React.ElementType<{ className?: string }>> = {
  food: Utensils,
  transportation: CarFront,
  electricity: Zap,
  shopping: ShoppingCart,
  water: Droplet,
  waste: Trash2,
};

export function CarbonCalculator() {
  const { logAction } = useGame();
  
  const [activeCategory, setActiveCategory] = useState<string>("transportation");
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = Object.keys(CARBON_CONSTANTS);
  const items = activeCategory ? Object.keys(CARBON_CONSTANTS[activeCategory as keyof typeof CARBON_CONSTANTS]) : [];

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setActiveItem(null);
    setQuantity(1);
    setShowSuccess(false);
  };

  const handleItemClick = (item: string) => {
    setActiveItem(item);
    setQuantity(1);
    setShowSuccess(false);
  };

  const calculateEmission = () => {
    if (!activeCategory || !activeItem) return 0;
    const baseValue = (CARBON_CONSTANTS as Record<string, Record<string, number>>)[activeCategory][activeItem];
    return baseValue * quantity;
  };

  const currentEmission = calculateEmission();

  const handleSubmit = async () => {
    if (!activeCategory || !activeItem) return;
    
    setIsSubmitting(true);
    
    // Slight artificial delay for UX
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const emission = currentEmission;
    // Determine offset vs emission based on negative constants (like recycling)
    const isOffset = emission < 0;
    
    // e.g. "Car - 12 km" or "Recycling - 5 kg"
    const desc = `${activeItem} (${quantity} units)`;
    
    await logAction(
      activeCategory,
      desc,
      isOffset ? 0 : emission, // co2_emission
      isOffset ? Math.abs(emission) : 0, // carbon_offset
      15 // xp
    );

    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setActiveItem(null);
      setQuantity(1);
    }, 2000);
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden">
      {/* Background glow based on emission type */}
      <div 
        className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${
          currentEmission < 0 ? "bg-accent" : currentEmission > 5 ? "bg-red-500" : "bg-secondary"
        }`} 
      />

      <div className="flex flex-col gap-1 z-10">
        <h2 className="font-syne font-bold text-xl text-white">Log Activity</h2>
        <p className="text-xs text-zinc-400">Select a category and input your daily usage to track your carbon footprint.</p>
      </div>

      {/* Category Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 z-10">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Plus;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                isActive 
                  ? "bg-accent/10 border-accent/30 text-accent shadow-[0_0_15px_rgba(0,230,118,0.1)]" 
                  : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Item Selector (Chips) */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap gap-2 z-10"
        >
          {items.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${
                activeItem === item
                  ? "bg-secondary/20 border-secondary text-secondary"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {item}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Quantity Slider */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4 z-10"
          >
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-xs text-zinc-400">Amount / Duration / Distance</span>
              <span className="text-2xl font-outfit font-extrabold text-white">
                {quantity} <span className="text-sm font-normal text-zinc-500">units</span>
              </span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="50" 
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />

            <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Impact</span>
                <span className={`text-xl font-outfit font-bold ${
                  currentEmission < 0 ? "text-accent" : currentEmission > 5 ? "text-red-400" : "text-yellow-400"
                }`}>
                  {currentEmission > 0 ? "+" : ""}{currentEmission.toFixed(1)} kg CO₂
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || showSuccess}
                className={`px-6 py-2.5 rounded-xl font-syne font-bold text-sm transition-all duration-300 flex items-center justify-center min-w-[120px] ${
                  showSuccess
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isSubmitting
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {showSuccess ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Logged!</span>
                  </motion.div>
                ) : isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Log Activity</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
