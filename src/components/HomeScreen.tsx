import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, ArticleItem } from "../types";
import { ARTICLES } from "../data";
import {
  Heart,
  Droplet,
  Footprints,
  Smile,
  ArrowRight,
  Check,
  Bot,
  Sparkles,
} from "lucide-react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PanInfo } from "motion/react";

interface WeekData {
  week: number;
  imageUrl: string;
  sizeLabel: string;
  note: string;
}

interface HomeScreenProps {
  user: UserProfile;
  onNavigateToSophia: (initialPrompt?: string) => void;
  onOpenKickCounter: () => void;
  onOpenMoodLogger: () => void;
  onSelectArticle: (article: ArticleItem) => void;
  onOpenResources: () => void;
}
const BABY_WEEKS: WeekData[] = [
  {
    week: 4,
    imageUrl: "public/week4.png",
    sizeLabel: "poppy seed",
    note: "The neural tube begins to form.",
  },
  {
    week: 8,
    imageUrl: "public/week8.jpg",
    sizeLabel: "raspberry",
    note: "Tiny fingers and toes start to appear.",
  },
  {
    week: 12,
    imageUrl: "public/week12.png",
    sizeLabel: "lime",
    note: "Reflexes are developing — baby can curl toes.",
  },
  {
    week: 16,
    imageUrl: "public/week16.png",
    sizeLabel: "avocado",
    note: "Baby may start making facial expressions.",
  },
  {
    week: 20,
    imageUrl: "public/week20.jpg",
    sizeLabel: "banana",
    note: "Halfway there! Hearing is developing.",
  },
  {
    week: 24,
    imageUrl: "public/week-24.png",
    sizeLabel: "ear of corn",
    note: "Lungs are developing branching airways.",
  },
  {
    week: 28,
    imageUrl: "public/week 28.jpg",
    sizeLabel: "eggplant",
    note: "Baby can now blink and has eyelashes.",
  },
];

const AFFIRMATIONS = [
  "My body is beautifully designed for this journey, and every heartbeat brings us closer.",
  "I trust my body's natural wisdom to nurture and protect my growing baby.",
  "Taking time to rest and breathe is an act of deep love for myself and my little one.",
  "Each day brings me closer to holding my baby in my arms with peace and strength.",
  "I am surrounded by support, love, and capable care every step of the way.",
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onNavigateToSophia,
  onOpenKickCounter,
  onOpenMoodLogger,
  onSelectArticle,
  onOpenResources,
}) => {
  const [hydrationCount, setHydrationCount] = useState(6);
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [showWaterBubble, setShowWaterBubble] = useState(false);
  const initialWeekIndex = Math.max(
    0,
    BABY_WEEKS.reduce(
      (closest, w, i) => (w.week <= user.week ? i : closest),
      0,
    ),
  );
  const [weekIndex, setWeekIndex] = useState(initialWeekIndex);
  const activeWeek = BABY_WEEKS[weekIndex];

  const goToWeek = (i: number) => {
    if (i < 0 || i >= BABY_WEEKS.length) return;
    setWeekIndex(i);
  };

  const handleSlideDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) goToWeek(weekIndex + 1);
    else if (info.offset.x > 50) goToWeek(weekIndex - 1);
  };
  const handleAddGlass = () => {
    setHydrationCount((prev) => {
      const next = prev < 8 ? prev + 1 : 8;
      setShowWaterBubble(true);
      setTimeout(() => setShowWaterBubble(false), 800);
      return next;
    });
  };

  const handleToggleAffirmation = () => {
    setAffirmationIdx((prev) => (prev + 1) % AFFIRMATIONS.length);
    setIsFavorited(false);
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatPrompt.trim()) {
      onNavigateToSophia(chatPrompt.trim());
      setChatPrompt("");
    } else {
      onNavigateToSophia();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-28 flex flex-col"
    >
      {/* Baby Growth Slideshow */}
      <motion.div className="relative overflow-hidden rounded-3xl shadow-md mb-6 ">
        {/* Image section — no background at all now */}
        <div className="relative w-full h-64 sm:h-72 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={activeWeek.week}
              src={activeWeek.imageUrl}
              alt={`Baby at week ${activeWeek.week}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleSlideDragEnd}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full object-contain p-4 cursor-grab active:cursor-grabbing"
              draggable={false}
            />
          </AnimatePresence>

          <button
            onClick={() => goToWeek(weekIndex - 1)}
            disabled={weekIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/70 text-on-surface flex items-center justify-center disabled:opacity-0 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goToWeek(weekIndex + 1)}
            disabled={weekIndex === BABY_WEEKS.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/70 text-on-surface flex items-center justify-center disabled:opacity-0 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Text section — keeps the primary background */}
        <div className="relative z-10 p-5 flex flex-col gap-2 bg-primary text-on-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold bg-on-primary-fixed/20 text-primary-fixed px-3 py-1 rounded-full">
              Week {activeWeek.week}
            </span>
            <span className="text-xs text-primary-fixed-dim">
              Size of a {activeWeek.sizeLabel}
            </span>
          </div>
          <p className="text-sm text-primary-fixed leading-relaxed">
            {activeWeek.note}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {BABY_WEEKS.map((w, i) => (
              <button
                key={w.week}
                onClick={() => goToWeek(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === weekIndex
                    ? "w-5 bg-secondary"
                    : "w-1.5 bg-on-primary-fixed/30"
                }`}
                aria-label={`Go to week ${w.week}`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Daily Affirmation Card (kept as its own section) */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="relative overflow-hidden rounded-3xl bg-primary text-on-primary p-6 shadow-md mb-6 border border-primary-container"
      >
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-primary-container/40 pointer-events-none blur-xl"
        />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 bg-on-primary-fixed/20 text-primary-fixed px-3 py-1 rounded-full text-xs font-semibold w-fit">
              <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Daily Affirmation</span>
            </div>
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="text-xs text-primary-fixed hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Heart
                className={`w-3.5 h-3.5 ${isFavorited ? "fill-secondary text-secondary" : ""}`}
              />
              <span>{isFavorited ? "Saved" : "Save"}</span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.h2
              key={affirmationIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              onClick={handleToggleAffirmation}
              className="text-xl sm:text-2xl font-bold leading-snug cursor-pointer hover:opacity-95 transition-opacity select-none"
              title="Tap to cycle affirmations"
            >
              &ldquo;{AFFIRMATIONS[affirmationIdx]}&rdquo;
            </motion.h2>
          </AnimatePresence>
          <p className="text-xs text-primary-fixed-dim">
            Updated today at 8:30 AM &bull; Tap quote to cycle new affirmations
          </p>
        </div>
      </motion.div>

      {/* Growth & Hydration Progress Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Baby Growth Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="rounded-3xl bg-surface-container-low p-5 shadow-sm flex flex-col justify-between border border-surface-container"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Baby&apos;s Growth
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Size of a large mango
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full">
              75% Trimester
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0 flex items-center justify-center">
              {/* Concentric subtle heartbeat pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.14, 1],
                  opacity: [0.2, 0.45, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-22 h-22 rounded-full bg-primary/15"
              />
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 rounded-full bg-surface flex items-center justify-center relative shadow-inner z-10"
              >
                <span className="text-lg font-bold text-primary">600g</span>
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin duration-1000"
                  style={{ animationDuration: "10s" }}
                />
              </motion.div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Baby&apos;s hearing is fully developed. They can recognize your
                voice and respond to gentle touches!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hydration Tracker with animated bubble */}
        <motion.div
          whileHover={{ y: -3 }}
          className="rounded-3xl bg-surface-container-low p-5 shadow-sm flex flex-col justify-between border border-surface-container relative overflow-hidden"
        >
          {/* Animated floating water bubble */}
          <AnimatePresence>
            {showWaterBubble && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.5 }}
                animate={{ y: -20, opacity: 1, scale: 1.2 }}
                exit={{ y: -45, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.7 }}
                className="absolute top-6 right-6 z-20 bg-primary text-on-primary text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 pointer-events-none"
              >
                <Droplet className="w-3.5 h-3.5 fill-current" />
                <span>+1 Glass!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary">
                <Droplet
                  className="w-5 h-5 fill-current animate-bounce"
                  style={{ animationDuration: "2.5s" }}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Daily Hydration
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {hydrationCount} of 8 glasses logged
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleAddGlass}
              className="text-xs font-semibold text-primary bg-primary-fixed/50 hover:bg-primary-fixed px-3 py-1 rounded-full transition-colors cursor-pointer shadow-xs"
            >
              + Add Glass
            </motion.button>
          </div>

          <div className="grid grid-cols-8 gap-1.5 my-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
              const isFilled = num <= hydrationCount;
              return (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setHydrationCount(num)}
                  className={`h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                    isFilled
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                  title={`Log glass ${num}`}
                >
                  {isFilled ? <Check className="w-3.5 h-3.5" /> : num}
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-on-surface-variant mt-1">
            {hydrationCount >= 8
              ? "🎉 Daily wellness hydration target completed!"
              : `Only ${8 - hydrationCount} more ${8 - hydrationCount === 1 ? "glass" : "glasses"} to reach your daily wellness goal!`}
          </p>
        </motion.div>
      </div>

      {/* Quick Logs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Quick Logs
          </h3>
          <button
            onClick={onOpenKickCounter}
            className="text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            View History
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenKickCounter}
            className="flex items-center gap-3 p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all text-left group shadow-sm border border-surface-container cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-on-surface-variant">
                Track Activity
              </span>
              <span className="text-sm font-bold text-on-surface">
                Kick Count
              </span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenMoodLogger}
            className="flex items-center gap-3 p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all text-left group shadow-sm border border-surface-container cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-on-surface-variant">
                Check-in
              </span>
              <span className="text-sm font-bold text-on-surface">
                Log Mood
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Milestones & Articles Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Milestones &amp; Articles
          </h3>
          <button
            onClick={onOpenResources}
            className="text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            Explore All
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {ARTICLES.map((article) => (
            <motion.div
              key={article.id}
              whileHover={{ scale: 1.01, x: 2 }}
              onClick={() => onSelectArticle(article)}
              className="flex items-center gap-4 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all shadow-sm border border-surface-container cursor-pointer group"
            >
              <img
                src={article.imageUrl}
                alt={article.alt}
                className="w-20 h-20 rounded-xl object-cover shrink-0 transition-transform group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                  {article.category}
                </span>
                <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <p className="text-xs text-on-surface-variant line-clamp-1 mt-1">
                  {article.snippet}
                </p>
                <span className="text-[11px] text-outline mt-1 font-medium">
                  {article.readTime}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sticky Ask Sophia Floating Bar with animated aura */}
      <div className="sticky bottom-20 z-30 pt-2 pb-4">
        <motion.form
          whileHover={{ scale: 1.01 }}
          onSubmit={handleAskSubmit}
          className="relative flex items-center bg-surface-container-lowest rounded-full shadow-[0_6px_24px_rgba(13,92,99,0.12)] p-1.5 border border-outline-variant/40"
        >
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 ml-1 shadow-sm">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <input
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            className="w-full bg-transparent px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            placeholder={`Ask Sophia anything about Week ${user.week}...`}
            type="text"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="submit"
            className="bg-secondary text-on-secondary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            <span>Ask</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
};
