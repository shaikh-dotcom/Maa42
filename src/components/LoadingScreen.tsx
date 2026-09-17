import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, ShieldCheck, Baby, Activity } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
  userName?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, userName = 'Sarah' }) => {
  const [progress, setProgress] = useState(12);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    { title: 'Opening your sacred care sanctuary...', detail: 'Harmonizing personalized clinical profile' },
    { title: 'Synchronizing Maa42 postpartum milestones...', detail: 'Loading 42-day maternal recovery protocol' },
    { title: 'Connecting Dr. Sharma & Care Circle...', detail: 'Securing encrypted telehealth channels' },
    { title: `Welcome, ${userName}`, detail: 'MedSophia AI companion is ready' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 100;
        }
        const increment = Math.floor(Math.random() * 18) + 12;
        const next = Math.min(prev + increment, 100);

        if (next > 75) setPhaseIndex(3);
        else if (next > 45) setPhaseIndex(2);
        else if (next > 20) setPhaseIndex(1);

        return next;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface px-6 overflow-hidden"
    >
      {/* Ambient background glow rings */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-96 h-96 rounded-full bg-primary-fixed/40 blur-3xl pointer-events-none -top-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute w-80 h-80 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none -bottom-10"
      />

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center">
        {/* Breathing Emblem */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Animated concentric ripples */}
          <motion.div
            animate={{
              scale: [1, 1.6, 1.9],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute w-28 h-28 rounded-full border border-primary/40"
          />
          <motion.div
            animate={{
              scale: [1, 1.4, 1.7],
              opacity: [0.5, 0.15, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.7,
            }}
            className="absolute w-28 h-28 rounded-full border border-secondary/30"
          />

          {/* Central Logo Container */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-24 h-24 rounded-3xl bg-white shadow-xl border border-surface-container flex items-center justify-center p-3 relative overflow-hidden"
          >
            <img
              src="/logo.svg"
              alt="MedSophia Maa42"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>

        {/* Brand name */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-1"
        >
          <span className="text-xs uppercase tracking-widest font-bold text-secondary">
            Postpartum &amp; Maternal Care
          </span>
          <h1 className="text-2xl font-black text-on-surface tracking-tight mt-0.5">
            MedSophia
          </h1>
        </motion.div>

        {/* Dynamic Status Text */}
        <div className="h-16 flex flex-col items-center justify-center my-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
                {phaseIndex === 0 && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                {phaseIndex === 1 && <Baby className="w-3.5 h-3.5" />}
                {phaseIndex === 2 && <ShieldCheck className="w-3.5 h-3.5" />}
                {phaseIndex === 3 && <Activity className="w-3.5 h-3.5 text-secondary" />}
                <span>{phases[phaseIndex].title}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium">
                {phases[phaseIndex].detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden p-0.5 border border-surface-container-high relative mb-3">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary via-primary-container to-secondary"
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>

        {/* Progress numbers & skip */}
        <div className="w-full flex items-center justify-between text-[11px] text-on-surface-variant font-semibold">
          <span>Clinical sync {progress}%</span>
          <button
            onClick={onComplete}
            className="text-primary hover:underline cursor-pointer transition-colors"
          >
            Enter Sanctuary &rarr;
          </button>
        </div>
      </div>
    </motion.div>
  );
};
