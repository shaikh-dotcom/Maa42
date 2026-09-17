import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Footprints, Clock, CheckCircle2, RotateCcw, X, Sparkles } from 'lucide-react';

interface KickCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKickSession?: (kicks: number, durationMinutes: number) => void;
}

export const KickCounterModal: React.FC<KickCounterModalProps> = ({
  isOpen,
  onClose,
  onSaveKickSession,
}) => {
  const [kicks, setKicks] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [ripples, setRipples] = useState<{ id: number }[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && isOpen) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isOpen]);

  if (!isOpen) return null;

  const handleAddKick = () => {
    setKicks((prev) => prev + 1);
    setIsRunning(true); // first tap starts the session clock
    const newId = Date.now();
    setRipples((prev) => [...prev.slice(-3), { id: newId }]);
  };

  const handleReset = () => {
    setKicks(0);
    setSeconds(0);
    setIsRunning(false);
    setRipples([]);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    if (onSaveKickSession) {
      onSaveKickSession(kicks, Math.round(seconds / 60));
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="bg-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-surface-container relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">Baby Kick Counter</h3>
            <p className="text-xs text-on-surface-variant">ACOG Standard: 10 kicks in 2 hours</p>
          </div>
        </div>

        {/* Counter Circle & Tap Target with Animated Ripples */}
        <div className="flex flex-col items-center justify-center my-6 relative">
          {ripples.map((r) => (
            <motion.div
              key={r.id}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-40 h-40 rounded-full border-2 border-primary pointer-events-none"
            />
          ))}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleAddKick}
            className="w-40 h-40 rounded-full bg-primary/10 hover:bg-primary/15 transition-all border-4 border-primary flex flex-col items-center justify-center shadow-lg group cursor-pointer relative z-10"
          >
            <Footprints className="w-8 h-8 text-primary mb-1 group-hover:scale-110 transition-transform" />
            <motion.span
              key={kicks}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-4xl font-extrabold text-primary font-headline"
            >
              {kicks}
            </motion.span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
              Tap for Kick
            </span>
          </motion.button>

          <div className="flex items-center gap-2 mt-4 text-xs font-medium text-on-surface-variant">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Session Duration: {formatTime(seconds)}</span>
          </div>
        </div>

        {/* Progress status */}
        <div className="bg-surface-container-low p-3.5 rounded-2xl mb-5 text-xs text-center border border-surface-container">
          {kicks >= 10 ? (
            <span className="text-primary font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>Goal Achieved: Baby is actively moving!</span>
            </span>
          ) : (
            <span className="text-on-surface-variant">
              {10 - kicks} more {10 - kicks === 1 ? 'movement' : 'movements'} to reach healthy 10-count benchmark.
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
            title="Reset counter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex-1 bg-primary text-on-primary rounded-full font-bold text-xs py-3.5 shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved &amp; Logged!</span>
              </>
            ) : (
              <span>Save Kick Session</span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
