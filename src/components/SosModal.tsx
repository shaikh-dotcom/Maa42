import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Timer, Phone, Play, Square, X, ShieldAlert, HeartPulse, Clock } from 'lucide-react';

interface ContractionRecord {
  id: string;
  startTime: string;
  durationSeconds: number;
  intensity: 'Mild' | 'Moderate' | 'Intense';
}

interface SosModalProps {
  isOpen: boolean;
  initialTab?: 'timer' | 'hotline';
  onClose: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  initialTab = 'timer',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'hotline'>(initialTab);
  const [isTiming, setIsTiming] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [intensity, setIntensity] = useState<'Mild' | 'Moderate' | 'Intense'>('Moderate');
  const [contractions, setContractions] = useState<ContractionRecord[]>([
    { id: '1', startTime: '10:14 AM', durationSeconds: 52, intensity: 'Moderate' },
    { id: '2', startTime: '10:21 AM', durationSeconds: 60, intensity: 'Moderate' },
    { id: '3', startTime: '10:28 AM', durationSeconds: 58, intensity: 'Intense' },
  ]);
  // Real hotline number this button dials via a tel: link — replace with
  // your actual triage line before shipping. No more fake "Connecting..."
  // UI on an emergency-facing feature.
  const HOTLINE_TEL = '+18005556224';
  const HOTLINE_DISPLAY = '1-800-555-MAA42';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTiming) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTiming]);

  if (!isOpen) return null;

  const handleToggleTimer = () => {
    if (isTiming) {
      const newRecord: ContractionRecord = {
        id: String(Date.now()),
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: seconds,
        intensity,
      };
      setContractions([newRecord, ...contractions]);
      setIsTiming(false);
      setSeconds(0);
    } else {
      setSeconds(0);
      setIsTiming(true);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        className="bg-surface rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-surface-container my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-error fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Urgent Maternal Triage</h2>
              <p className="text-xs text-on-surface-variant">Rapid Assessment &amp; Clinical Escalation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-container p-1 rounded-2xl my-4">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'timer'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Contraction Timer</span>
          </button>
          <button
            onClick={() => setActiveTab('hotline')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'hotline'
                ? 'bg-error text-on-error shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>OB Triage Hotline (24/7)</span>
          </button>
        </div>

        {activeTab === 'timer' ? (
          <div>
            {/* Timer Counter with Animated Waves */}
            <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col items-center justify-center border border-surface-container mb-4 relative overflow-hidden">
              {isTiming && (
                <motion.div
                  animate={{ scale: [0.9, 1.3, 0.9], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-44 h-44 rounded-full bg-error pointer-events-none"
                />
              )}

              <span className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 relative z-10">
                {isTiming ? 'Contraction Active...' : 'Ready to Time'}
              </span>
              <div className="text-5xl font-mono font-bold text-primary my-2 tracking-wider relative z-10">
                {formatTimer(seconds)}
              </div>
              <p className="text-xs text-on-surface-variant text-center mb-4 relative z-10">
                Tap when a contraction starts, tap again when tension fully releases.
              </p>

              {/* Intensity Picker */}
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <span className="text-xs font-medium text-on-surface-variant">Intensity:</span>
                {(['Mild', 'Moderate', 'Intense'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`text-xs px-3 py-1 rounded-full font-semibold cursor-pointer transition-all ${
                      intensity === level
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleTimer}
                className={`w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md relative z-10 ${
                  isTiming
                    ? 'bg-error text-on-error hover:opacity-95 animate-pulse'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
              >
                {isTiming ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Contraction</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Contraction</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* 5-1-1 Rule Banner */}
            <div className="bg-primary-fixed/40 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-on-primary-fixed-variant mb-4">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>5-1-1 Rule:</strong> If contractions occur every 5 minutes, lasting 1 minute each, for 1 full hour, contact your OB or head to the hospital.
              </span>
            </div>

            {/* Log History */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Recent Contractions
              </h3>
              <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                {contractions.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-low border border-surface-container text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{c.startTime}</span>
                      <span className="text-on-surface-variant">&bull;</span>
                      <span className="bg-secondary-fixed/40 text-secondary px-2 py-0.5 rounded-md font-medium">
                        {c.intensity}
                      </span>
                    </div>
                    <span className="font-bold text-on-surface">{c.durationSeconds}s duration</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 24/7 Hotline Tab */
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-error-container text-on-error-container border border-error/20">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-error" />
                <span>Immediate Warning Signs</span>
              </h3>
              <ul className="text-xs space-y-1.5 list-disc list-inside text-on-error-container/90">
                <li>Heavy vaginal bleeding (soaking a pad in an hour)</li>
                <li>Sudden severe swelling in hands, feet, or face with vision flashes</li>
                <li>Sharp continuous abdominal pain that does not ease</li>
                <li>Noticeable reduction or cessation of baby kicks</li>
                <li>Gush or continuous trickle of watery fluid</li>
              </ul>
            </div>

            <div className="bg-surface-container-low p-5 rounded-2xl border border-surface-container text-center">
              <h4 className="text-sm font-bold text-on-surface mb-1">
                Metro Maternal Health On-Call OB Desk
              </h4>
              <p className="text-xs text-on-surface-variant mb-4">
                Staffed 24 hours by board-certified OB-GYNs and triage midwives.
              </p>

              <motion.a
                whileTap={{ scale: 0.96 }}
                href={`tel:${HOTLINE_TEL}`}
                className="w-full py-4 rounded-full bg-error text-on-error font-bold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-5 h-5 fill-current" />
                <span>Call 24/7 OB Triage ({HOTLINE_DISPLAY})</span>
              </motion.a>
              <p className="text-[11px] text-on-surface-variant text-center mt-2 flex items-center justify-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Tapping dials your device&apos;s phone app directly — no in-app simulation.</span>
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
