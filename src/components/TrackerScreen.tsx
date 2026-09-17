import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, AudioTrack } from "../types";
import { AUDIO_TRACKS } from "../data";
import { soundEngine } from "../utils/audio";
import { BreathingVisualizer } from "./BreathingVisualizer";
import {
  Heart,
  Zap,
  Droplet,
  CheckCircle,
  Play,
  Pause,
  ChevronRight,
  Activity,
} from "lucide-react";

interface TrackerScreenProps {
  user: UserProfile;
  // Set when a track is picked from ResourcesModal elsewhere in the app —
  // this screen owns playback, so it starts that exact track on arrival.
  initialTrackId?: string;
  onClearInitialTrackId?: () => void;
}

const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~364.4, matches strokeDasharray below

// Postpartum: percent through the 42-day window, days remaining, and a
// milestone message appropriate to where in recovery the user actually is.
function getPostpartumStage(day: number) {
  const clamped = Math.max(1, Math.min(42, day || 1));
  const percent = Math.round((clamped / 42) * 100);
  const daysRemaining = Math.max(0, 42 - clamped);
  let milestone =
    "Early recovery — prioritize rest and monitoring for bleeding changes.";
  if (clamped > 7 && clamped <= 14)
    milestone =
      "Lochia is typically lightening — gentle walking can begin as tolerated.";
  else if (clamped > 14 && clamped <= 28)
    milestone = "Pelvic floor repair phase active.";
  else if (clamped > 28)
    milestone =
      "Approaching the end of your golden month — gradual return to normal activity.";
  return {
    label: `Day ${clamped}`,
    totalLabel: "of 42",
    percent,
    remainingLabel: `${daysRemaining} Days Remaining`,
    milestone,
  };
}

// Pregnancy: percent through a 40-week pregnancy, weeks remaining, and a
// trimester-appropriate milestone message.
function getPregnancyStage(week: number) {
  const clamped = Math.max(1, Math.min(40, week || 1));
  const percent = Math.round((clamped / 40) * 100);
  const weeksRemaining = Math.max(0, 40 - clamped);
  let milestone =
    "First trimester — early development and adjusting to new symptoms.";
  if (clamped >= 14 && clamped < 28)
    milestone =
      "Second trimester — energy often returns and baby\u2019s movements become noticeable.";
  else if (clamped >= 28)
    milestone = "Third trimester — baby is growing rapidly ahead of birth.";
  return {
    label: `Week ${clamped}`,
    totalLabel: "of 40",
    percent,
    remainingLabel: `${weeksRemaining} Weeks Remaining`,
    milestone,
  };
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({
  user,
  initialTrackId,
  onClearInitialTrackId,
}) => {
  const [energyLevel, setEnergyLevel] = useState(6);
  const [secondaryLevel, setSecondaryLevel] = useState(2);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [logSavedToast, setLogSavedToast] = useState(false);

  const stage = user.isPostpartum
    ? getPostpartumStage(user.postpartumDay ?? 1)
    : getPregnancyStage(user.week);
  const ringOffset = RING_CIRCUMFERENCE * (1 - stage.percent / 100);

  useEffect(() => {
    if (initialTrackId) {
      const track = AUDIO_TRACKS.find((t) => t.id === initialTrackId);
      if (track) {
        soundEngine.start(track.frequency);
        setActiveTrackId(track.id);
      }
      onClearInitialTrackId?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrackId]);

  // Make sure audio never keeps playing silently in the background after
  // this screen unmounts — activeTrackId resets to null on remount, which
  // previously left `soundEngine` and the UI out of sync.
  useEffect(() => {
    return () => {
      soundEngine.stop();
    };
  }, []);

  const getEnergyLabel = (val: number) => {
    if (val > 7) return `High (${val}/10)`;
    if (val > 3) return `Moderate (${val}/10)`;
    return `Low (${val}/10)`;
  };

  const getSecondaryLabel = (val: number) => {
    const labels = user.isPostpartum
      ? ["None", "Light Spotting", "Moderate Flow", "Consult Doctor"]
      : ["None", "Occasional (Braxton Hicks)", "Frequent", "Consult Doctor"];
    return labels[val - 1] || labels[1];
  };

  const handleUpdateLog = () => {
    setLogSavedToast(true);
    setTimeout(() => {
      setLogSavedToast(false);
    }, 3000);
  };

  const handleToggleAudio = (track: AudioTrack) => {
    if (activeTrackId === track.id) {
      soundEngine.stop();
      setActiveTrackId(null);
    } else {
      soundEngine.start(track.frequency);
      setActiveTrackId(track.id);
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
      {/* Recovery / Pregnancy Status Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-primary-container text-on-primary-container p-6 shadow-md mb-6 border border-primary/20">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-8 -bottom-8 pointer-events-none"
        >
          <Heart className="w-44 h-44 fill-current" />
        </motion.div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-on-primary-container/20 px-3 py-1 rounded-full text-xs font-semibold w-fit">
            <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>
              {user.isPostpartum
                ? "Maa42 Recovery Program"
                : "Pregnancy Wellness Tracker"}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-headline text-on-primary">
            {user.isPostpartum
              ? `Fourth Trimester \u2022 ${stage.label} ${stage.totalLabel}`
              : `${stage.label} ${stage.totalLabel} \u2022 ${stage.percent}% Along`}
          </h1>
          <p className="text-sm text-on-primary-container/95 max-w-md leading-relaxed">
            {user.isPostpartum
              ? `You are ${stage.percent}% through the sacred postpartum window. Rest, nourishment, and gentle core rehabilitation are your focus today.`
              : `You are ${stage.percent}% through your pregnancy journey. Steady hydration, rest, and gentle movement are your focus today.`}
          </p>
        </div>
      </section>

      {/* Circular Progress & Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Recovery/Pregnancy Window Progress Ring Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-surface-container-low rounded-3xl p-5 shadow-sm flex flex-col justify-between border border-surface-container"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-on-surface">
              {user.isPostpartum
                ? "42-Day Recovery Window"
                : "40-Week Pregnancy Journey"}
            </h2>
            <span className="text-xs font-semibold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-full">
              {stage.remainingLabel}
            </span>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  className="text-surface-container-highest"
                  cx="72"
                  cy="72"
                  fill="transparent"
                  r={RING_RADIUS}
                  stroke="currentColor"
                  strokeWidth="12"
                />
                <motion.circle
                  className="text-secondary"
                  cx="72"
                  cy="72"
                  fill="transparent"
                  r={RING_RADIUS}
                  stroke="currentColor"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-3xl font-extrabold text-on-surface">
                  {stage.label}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {stage.totalLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center pt-1">
            <p className="text-xs text-on-surface-variant font-medium">
              Milestone: {stage.milestone}
            </p>
          </div>
        </motion.div>

        {/* Today's Check-in Sliders */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-surface-container-low rounded-3xl p-5 shadow-sm flex flex-col justify-between border border-surface-container"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-on-surface">
              Daily Check-In
            </h2>
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>Logged Today</span>
            </span>
          </div>

          <div className="flex flex-col gap-4 my-auto">
            {/* Energy Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-on-surface-variant flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-secondary" />
                  <span>Energy Levels</span>
                </span>
                <span className="font-bold text-primary">
                  {getEnergyLabel(energyLevel)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer bg-surface-container-highest rounded-lg h-2"
              />
            </div>

            {/* Lochia (postpartum) / Braxton Hicks (pregnancy) Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-on-surface-variant flex items-center gap-1">
                  {user.isPostpartum ? (
                    <Droplet className="w-3.5 h-3.5 text-secondary fill-current" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-secondary" />
                  )}
                  <span>
                    {user.isPostpartum
                      ? "Lochia / Bleeding"
                      : "Contractions / Tightness"}
                  </span>
                </span>
                <span className="font-bold text-secondary">
                  {getSecondaryLabel(secondaryLevel)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={secondaryLevel}
                onChange={(e) => setSecondaryLevel(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer bg-surface-container-highest rounded-lg h-2"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleUpdateLog}
            className="w-full mt-3 bg-primary text-on-primary py-2.5 rounded-full text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Update Daily Log</span>
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {logSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-primary-fixed text-on-primary-fixed rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span>
              Daily {user.isPostpartum ? "recovery" : "wellness"} log updated
              &amp; synchronized with Dr. Sharma&apos;s chart.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Guided Diaphragmatic Breathing Guide */}
      <div className="mb-6">
        <BreathingVisualizer />
      </div>

      {/* Curated Recovery Care & Audio Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Curated {user.isPostpartum ? "Recovery" : "Wellness"} Care &amp;
            Audio Therapy
          </h2>
          <span className="text-xs font-semibold text-primary">
            Web Audio Synthesizer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AUDIO_TRACKS.map((track) => {
            const isPlayingThis = activeTrackId === track.id;
            return (
              <motion.div
                key={track.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToggleAudio(track)}
                className={`p-4 rounded-3xl flex items-center gap-3.5 shadow-sm transition-all cursor-pointer group border ${
                  isPlayingThis
                    ? "bg-surface border-primary ring-2 ring-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                    isPlayingThis
                      ? "bg-primary text-on-primary animate-pulse"
                      : track.colorClass
                  }`}
                >
                  {isPlayingThis ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </div>

                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
                      {track.category}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      {track.duration}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface truncate mt-1">
                    {track.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-on-surface-variant truncate">
                      {track.speaker}
                    </p>
                    {isPlayingThis && (
                      <div className="flex items-end gap-0.5 h-3 ml-auto">
                        <motion.span
                          animate={{ height: ["20%", "100%", "30%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.7,
                            ease: "easeInOut",
                          }}
                          className="w-1 bg-primary rounded-full"
                        />
                        <motion.span
                          animate={{ height: ["80%", "20%", "90%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            ease: "easeInOut",
                          }}
                          className="w-1 bg-primary rounded-full"
                        />
                        <motion.span
                          animate={{ height: ["30%", "90%", "40%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "easeInOut",
                          }}
                          className="w-1 bg-primary rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
};
