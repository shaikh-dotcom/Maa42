import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Wind } from 'lucide-react';

export const BreathingVisualizer: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [cycleCount, setCycleCount] = useState(0);

  // 4s Inhale -> 4s Hold -> 4s Exhale -> 2s Rest
  useEffect(() => {
    if (!isActive) {
      setPhase('Inhale');
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const runCycle = () => {
      if (!isMounted) return;
      setPhase('Inhale');

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setPhase('Hold');

        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          setPhase('Exhale');

          timeoutId = setTimeout(() => {
            if (!isMounted) return;
            setPhase('Rest');

            timeoutId = setTimeout(() => {
              if (!isMounted) return;
              setCycleCount((c) => c + 1);
              runCycle();
            }, 2000);
          }, 4000);
        }, 4000);
      }, 4000);
    };

    runCycle();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isActive]);

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'Inhale':
        return 'Deep breath into pelvic floor & diaphragm...';
      case 'Hold':
        return 'Hold gently without straining...';
      case 'Exhale':
        return 'Slow, warm release through open mouth...';
      case 'Rest':
        return 'Rest & soften pelvic muscles...';
    }
  };

  const getScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case 'Inhale':
        return 1.35;
      case 'Hold':
        return 1.35;
      case 'Exhale':
        return 0.95;
      case 'Rest':
        return 1.0;
    }
  };

  const getDuration = () => {
    switch (phase) {
      case 'Inhale':
        return 4;
      case 'Hold':
        return 0.3;
      case 'Exhale':
        return 4;
      case 'Rest':
        return 2;
    }
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 border border-surface-container relative overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">
              Diaphragmatic &amp; Pelvic Floor Breathing
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Clinically verified 4-4-4 rhythm for postpartum calmness
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
            Cycles Completed
          </span>
          <span className="text-sm font-black text-on-surface">{cycleCount}</span>
        </div>
      </div>

      {/* Animation Stage */}
      <div className="relative h-48 flex items-center justify-center my-3">
        {/* Outer breathing aura */}
        <motion.div
          animate={{
            scale: getScale(),
            opacity: isActive ? (phase === 'Hold' ? 0.35 : 0.2) : 0.1,
          }}
          transition={{
            duration: getDuration(),
            ease: phase === 'Inhale' ? 'easeOut' : 'easeInOut',
          }}
          className="absolute w-40 h-40 rounded-full bg-primary-container blur-xl"
        />

        {/* Concentric Guide Rings */}
        <div className="absolute w-44 h-44 rounded-full border border-dashed border-primary/25" />
        <div className="absolute w-32 h-32 rounded-full border border-primary/20" />

        {/* Dynamic Expanding Sphere */}
        <motion.div
          animate={{
            scale: getScale(),
          }}
          transition={{
            duration: getDuration(),
            ease: phase === 'Inhale' ? 'easeOut' : 'easeInOut',
          }}
          className="w-28 h-28 rounded-full bg-linear-to-tr from-primary to-primary-container text-on-primary flex flex-col items-center justify-center shadow-lg relative z-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isActive ? phase : 'idle'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <span className="text-sm font-extrabold block tracking-wide">
                {isActive ? phase : 'Ready'}
              </span>
              <span className="text-[10px] opacity-80 font-medium">
                {isActive
                  ? phase === 'Inhale' || phase === 'Exhale' || phase === 'Hold'
                    ? '4 sec'
                    : '2 sec'
                  : 'Tap Start'}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Status Instruction Bar */}
      <div className="text-center mb-5">
        <p className="text-xs font-semibold text-primary transition-all duration-300">
          {isActive ? getPhaseInstruction() : 'Take a comfortable seated posture with relaxed shoulders.'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsActive(!isActive)}
          className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
            isActive
              ? 'bg-secondary text-on-secondary hover:bg-secondary-container'
              : 'bg-primary text-on-primary hover:bg-primary-container'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause Guide</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start 4-4-4 Breathing</span>
            </>
          )}
        </motion.button>

        {cycleCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsActive(false);
              setCycleCount(0);
            }}
            className="p-2.5 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
            title="Reset Counter"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
};
