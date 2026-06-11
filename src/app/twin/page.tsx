"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useGame } from "@/stores/game-store";
import { 
  Bot, 
  Send, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  Check, 
  Leaf, 
  TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";
import { SprigAvatar } from "@/components/sprig-avatar";

interface ParsedAction {
  actionName: string;
  offset: number;
  category: string;
  xp: number;
}

interface MessageBlock {
  type: "insight" | "recommendation" | "impact" | "reward" | "text" | "bullet";
  content: string;
  icon?: React.ReactNode;
}

// Regex parser to find recommended action tags
const parseActionTag = (text: string): { cleanText: string; action: ParsedAction | null } => {
  const regex = /\[Action:\s*([^|]+)\|\s*Offset:\s*([^|]+)\|\s*Category:\s*([^|]+)\|\s*XP:\s*([^\]]+)\]/i;
  const match = text.match(regex);
  if (match) {
    const cleanText = text.replace(regex, "").trim();
    const action = {
      actionName: match[1].trim(),
      offset: parseFloat(match[2].trim()),
      category: match[3].trim().toLowerCase(),
      xp: parseInt(match[4].trim(), 10)
    };
    return { cleanText, action };
  }
  return { cleanText: text, action: null };
};

// Parser to break AI response into structured layout cards
const parseMessageIntoBlocks = (text: string): MessageBlock[] => {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const blocks: MessageBlock[] = [];

  for (const line of lines) {
    // Check if it is a bullet point list item
    if (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)) {
      const cleanLine = line.replace(/^[-*\d.]+\s*/, "");
      blocks.push({ type: "bullet", content: cleanLine });
      continue;
    }

    const lower = line.toLowerCase();
    
    // Custom structural formatting matching suggestions, impact, meal ideas, and rewards
    if (line.includes("🌿") || lower.startsWith("suggestion:") || lower.includes("suggestion") || lower.includes("suggest:")) {
      blocks.push({ 
        type: "recommendation", 
        content: line.replace(/^[🌿\s]+/, "").replace(/^suggestion:?\s*/i, "").replace(/^suggest:?\s*/i, ""), 
        icon: <Leaf className="w-4 h-4 text-[#00E676] shrink-0" />
      });
    } else if (line.includes("🌎") || line.includes("🌱") || lower.includes("kg co") || lower.includes("carbon") || lower.includes("offset") || lower.includes("impact")) {
      blocks.push({ 
        type: "impact", 
        content: line.replace(/^[🌎🌱\s]+/, "").replace(/^impact:?\s*/i, ""), 
        icon: <TrendingDown className="w-4 h-4 text-secondary shrink-0" />
      });
    } else if (line.includes("🍝") || lower.includes("recipe") || lower.includes("meal idea") || lower.includes("cook")) {
      blocks.push({ 
        type: "insight", 
        content: line.replace(/^[🍝\s]+/, "").replace(/^quick recipe:?\s*/i, "").replace(/^quick meal idea:?\s*/i, "").replace(/^meal idea:?\s*/i, ""), 
        icon: <span className="text-sm shrink-0">🍝</span>
      });
    } else if (line.includes("⭐") || line.includes("🏆") || lower.includes("xp") || lower.includes("reward")) {
      blocks.push({ 
        type: "reward", 
        content: line.replace(/^[⭐🏆\s]+/, "").replace(/^reward:?\s*/i, ""), 
        icon: <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
      });
    } else {
      blocks.push({ type: "text", content: line });
    }
  }

  // If blocks array is empty, default back to full text
  if (blocks.length === 0) {
    blocks.push({ type: "text", content: text });
  }

  return blocks;
};

// Premium Action Logger Card inside bubbles
const ActionCard: React.FC<{
  action: ParsedAction;
  isLogged: boolean;
  onLog: () => void;
}> = ({ action, isLogged, onLog }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "diet": return "🥗";
      case "energy": return "⚡";
      case "waste": return "♻️";
      case "transport": return "🚲";
      default: return "🌱";
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mt-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md max-w-md animate-pulse-glow" style={{ animationDuration: "3s" }}>
      <div className="flex items-start gap-3">
        <div className="text-xl p-1.5 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
          {getCategoryIcon(action.category)}
        </div>
        <div>
          <span className="text-xs font-bold text-white block leading-snug">{action.actionName}</span>
          <span className="text-[10px] text-accent font-semibold block mt-1">Saves {action.offset} kg CO₂ equivalent</span>
        </div>
      </div>
      
      <button
        onClick={onLog}
        disabled={isLogged}
        className={`w-full sm:w-auto px-4.5 py-2 rounded-full text-xs font-bold font-syne transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
          isLogged
            ? "bg-emerald-500/10 border border-emerald-500/30 text-accent"
            : "bg-accent hover:bg-accent-bright text-black hover:scale-105 active:scale-95"
        }`}
      >
        {isLogged ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Logged!</span>
          </>
        ) : (
          <>
            <Leaf className="w-3.5 h-3.5" />
            <span>Log (+{action.xp} XP)</span>
          </>
        )}
      </button>
    </div>
  );
};



// Sub-Client container handles chat thread logic
function TwinChatClient() {
  const searchParams = useSearchParams();
  const autoQuery = searchParams.get("autoquery");

  const { chats, sendChatMessage, clearChatHistory, isLoading, logAction, profile } = useGame();
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Track logged recommendations
  const [loggedActions, setLoggedActions] = useState<Record<string, boolean>>({});
  const autoQuerySent = useRef(false);

  // Sprig emotional state machine state
  const [sprigState, setSprigState] = useState<"idle" | "thinking" | "happy" | "concerned" | "celebrating">("idle");

  const triggerSprigState = useCallback((newState: typeof sprigState, duration = 3000) => {
    setSprigState(newState);
    const timer = setTimeout(() => {
      setSprigState((current) => {
        if (current === newState) return "idle";
        return current;
      });
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  // Set up quick category chips
  const categoryChips = [
    { label: "Food 🍔", query: "Suggest a low-carbon plant-based recipe to replace standard beef meals, detailing CO2 savings." },
    { label: "Travel 🚗", query: "Suggest carbon offsets for a 20km daily work commute compared to taking public transit." },
    { label: "Electricity ⚡", query: "What are three immediate ways to reduce my home appliance electricity footprint?" },
    { label: "Shopping 🛒", query: "How does packaging choice affect my local eco footprint? Give a standard metric comparison." },
    { label: "Challenges 🌱", query: "Provide a quick green action recommendation that I can log today for extra XP." },
  ];

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, isSending]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;
    setInputMessage("");
    setIsSending(true);
    setSprigState("thinking");

    // Check keywords for concerned states
    const lower = text.toLowerCase();
    const isConcerned = lower.includes("carbon") || lower.includes("pollution") || lower.includes("emissions") || lower.includes("car") || lower.includes("electricity") || lower.includes("spike") || lower.includes("leak");

    try {
      const aiResponse = await sendChatMessage(text);
      const isOverloaded = aiResponse?.message?.includes("overloaded") || aiResponse?.message?.includes("disconnected");
      if (isOverloaded) {
        triggerSprigState("concerned", 5000);
      } else if (isConcerned) {
        triggerSprigState("concerned", 4000);
      } else {
        triggerSprigState("happy", 3000);
      }
    } catch (err) {
      console.error(err);
      triggerSprigState("concerned", 4000);
    } finally {
      setIsSending(false);
    }
  }, [isSending, sendChatMessage, triggerSprigState]);

  // Handle auto-query parameter on load
  useEffect(() => {
    if (autoQuery && !autoQuerySent.current) {
      autoQuerySent.current = true;
      handleSendMessage(autoQuery);
    }
  }, [autoQuery, handleSendMessage]);

  const handleQuickLog = async (chatId: string, name: string, offset: number, category: string, xp: number) => {
    try {
      await logAction(category, name, 0, offset, xp);
      setLoggedActions((prev) => ({ ...prev, [chatId]: true }));
      triggerSprigState("celebrating", 4000);
    } catch (err) {
      console.error("Failed to log recommended action:", err);
    }
  };

  const handleClearChatHistory = async () => {
    try {
      await clearChatHistory();
      setLoggedActions({});
      triggerSprigState("celebrating", 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(inputMessage);
    }
  };

  // Structured block formatter
  const renderMessageContent = (blocks: MessageBlock[]) => {
    return (
      <div className="flex flex-col gap-2.5">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case "recommendation":
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-[#00E676]/25 bg-emerald-500/5 text-xs text-zinc-100 flex items-start gap-2.5 shadow-sm">
                  {block.icon}
                  <div>
                    <span className="font-syne font-bold text-accent block mb-0.5">🌿 Suggestion</span>
                    <p className="leading-relaxed text-zinc-200">{block.content}</p>
                  </div>
                </div>
              );
            case "impact":
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-secondary/25 bg-secondary/5 text-xs text-zinc-100 flex items-start gap-2.5 shadow-sm">
                  {block.icon}
                  <div>
                    <span className="font-syne font-bold text-secondary block mb-0.5">🌎 Impact</span>
                    <p className="leading-relaxed text-zinc-200">{block.content}</p>
                  </div>
                </div>
              );
            case "reward":
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-yellow-500/25 bg-yellow-500/5 text-xs text-zinc-100 flex items-start gap-2.5 shadow-sm">
                  {block.icon}
                  <div>
                    <span className="font-syne font-bold text-yellow-400 block mb-0.5">⭐ Reward</span>
                    <p className="leading-relaxed text-zinc-200">{block.content}</p>
                  </div>
                </div>
              );
            case "insight":
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-white/10 bg-white/5 text-xs text-zinc-100 flex items-start gap-2.5 shadow-sm">
                  {block.icon}
                  <div>
                    <span className="font-syne font-bold text-zinc-200 block mb-0.5">🍝 Quick Meal Idea</span>
                    <p className="leading-relaxed text-zinc-200">{block.content}</p>
                  </div>
                </div>
              );
            case "bullet":
              return (
                <div key={idx} className="flex items-start gap-2.5 pl-2 text-xs text-zinc-200 leading-relaxed py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                  <span>{block.content}</span>
                </div>
              );
            default:
              return (
                <p key={idx} className="text-xs sm:text-sm text-zinc-200 leading-relaxed">{block.content}</p>
              );
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-2 py-4">
      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch h-[calc(100vh-140px)]">
        
        {/* LEFT PANEL: Companion plant spirit Sprig (4 columns) */}
        <div className="md:col-span-4 glass-panel p-6 flex flex-col items-center justify-between text-center border border-white/5 relative overflow-hidden select-none bg-zinc-950/20">
          <div className="absolute top-4 left-4 text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Ecosystem Companion</div>

          <div className="flex-1 flex flex-col items-center justify-center py-12 relative w-full">
            {/* Sprig Mascot rendering */}
            <SprigAvatar state={sprigState} />

            {/* AI Mascot Label Status */}
            <div className="mt-6 z-10">
              <h3 className="font-syne font-bold text-base text-zinc-100 tracking-wide flex items-center gap-1.5 justify-center">
                <span>Sprig</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 border border-accent/20 text-accent font-mono">Lvl {profile?.level || 1}</span>
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1.5 uppercase font-bold tracking-widest font-mono">
                {isSending ? "Calculating carbon paths..." : 
                 sprigState === "happy" ? "Sprig is happy! 🌱" :
                 sprigState === "celebrating" ? "Celebrating offset! 🎉" :
                 sprigState === "concerned" ? "Sprig is concerned ⚠️" : "Companion Synced"}
              </p>
            </div>
          </div>

          <div className="w-full border-t border-white/5 pt-4">
            <span className="text-[10px] text-zinc-500 leading-relaxed max-w-[200px] block mx-auto font-medium">
              Sprig grows, blooms, and wiggles its leaves in response to your daily environmental actions.
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Conversation Thread log (8 columns) */}
        <div className="md:col-span-8 flex flex-col justify-between items-stretch h-full gap-4">
          
          {/* Conversational Window Header */}
          <div className="flex items-center justify-between p-4.5 glass-panel border border-white/5 shrink-0 bg-zinc-950/20">
            <div>
              <h2 className="font-syne font-bold text-sm text-white uppercase tracking-wider">
                Companion Stream
              </h2>
              <span className="text-[10px] text-zinc-500 block">Powered by Gemini 2.5 Flash • Adaptive Footprint Engine</span>
            </div>

            <button
              onClick={handleClearChatHistory}
              id="btn-clear-chat"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all duration-300 cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto glass-panel p-5 border border-white/5 flex flex-col gap-5 bg-zinc-950/10 no-scrollbar">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </div>
            ) : chats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="p-4 rounded-full bg-accent/5 border border-accent/15 text-accent mb-4 scale-110">
                  <Bot className="w-5 h-5 animate-bounce" />
                </div>
                <h3 className="font-syne font-bold text-base text-zinc-200">Start Your Conversational Ledger</h3>
                
                {/* Dynamically rendered welcome bubble from Sprig */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 max-w-md bg-white/[0.02] shadow-lg backdrop-blur-sm relative text-left mt-4">
                  <span className="font-syne font-bold text-accent text-[10px] block mb-1">{"Sprig's Greeting"}</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Hello! I am **Sprig**, your plant-based spirit companion. {"I'm"} ready to audit your carbon logs! Ask me anything about meal alternatives, transit carbon calculations, or timeline simulations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {chats.map((chat) => {
                  const { cleanText, action } = parseActionTag(chat.message);
                  const isLogged = loggedActions[chat.id] || false;
                  const blocks = parseMessageIntoBlocks(cleanText);

                  return (
                    <div
                      key={chat.id}
                      className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${chat.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          chat.sender === "user" 
                            ? "bg-accent/20 border border-accent/30 text-accent font-syne" 
                            : "bg-emerald-500/10 border border-emerald-500/30 text-accent font-syne"
                        }`}>
                          {chat.sender === "user" ? "U" : "S"}
                        </div>

                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl border flex flex-col ${
                          chat.sender === "user"
                            ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/15 border-accent/20 text-white rounded-tr-none shadow-md"
                            : "bg-white/[0.03] border-white/5 text-zinc-100 rounded-tl-none shadow-lg backdrop-blur-sm"
                        }`}>
                          
                          {/* Formatting blocks */}
                          {renderMessageContent(blocks)}

                          {/* Action log card integration */}
                          {chat.sender === "ai" && action && (
                            <ActionCard 
                              action={action} 
                              isLogged={isLogged} 
                              onLog={() => handleQuickLog(chat.id, action.actionName, action.offset, action.category, action.xp)}
                            />
                          )}

                          <span className="text-[8px] text-zinc-600 block text-right mt-3 font-mono">
                            {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Leaf Typing Indicator */}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%] flex-row">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 text-zinc-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      
                      {/* Leaf floating loader */}
                      <div className="flex items-center gap-3 mt-1">
                        <div className="relative w-8 h-8 flex items-center justify-center shrink-0 bg-white/5 rounded-full border border-white/5">
                          <motion.span 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                            className="absolute"
                          >
                            🍃
                          </motion.span>
                        </div>
                        <div className="flex gap-1.5 p-3.5 rounded-2xl rounded-tl-none bg-white/[0.02] border border-white/5 items-center">
                          <span className="text-[10px] text-zinc-400 font-bold font-syne mr-2 uppercase tracking-wide">Sprig is thinking</span>
                          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Footer Input and prompts chips */}
          <div className="flex flex-col gap-3.5 shrink-0">
            {/* Quick chips prompts */}
            {!isSending && chats.length <= 1 && (
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                {categoryChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent-dim/15 hover:text-white text-zinc-400 transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
                  >
                    <span>{chip.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Input form bar */}
            <div className="relative flex items-center w-full">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Sprig (e.g. 'Should I order burgers or cook at home tonight?')"
                id="chat-input-field"
                className="w-full pl-5 pr-14 py-4 rounded-full bg-white/[0.03] backdrop-blur-md text-sm border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-colors"
                disabled={isSending}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isSending}
                id="chat-send-button"
                className={`absolute right-2 p-3 rounded-full text-black transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  inputMessage.trim() && !isSending
                    ? "bg-gradient-to-r from-accent to-secondary hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,230,118,0.25)]"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Main page container wraps ChatClient in Suspense boundary for static page builds
export default function TwinChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col bg-[#0A0F0A] text-white justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <TwinChatClient />
    </Suspense>
  );
}
