import React from "react";
import { motion } from "motion/react";

interface MaterniBotBrainSkeletonProps {
  message?: string;
}

export const MaterniBotBrainSkeleton: React.FC<
  MaterniBotBrainSkeletonProps
> = ({ message = "MaterniBot brain building..." }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-28"
    >
      <div className="animate-pulse space-y-5">
        {/* Bot header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-surface-container-highest" />

          <div className="flex-1 space-y-2">
            <div className="h-5 w-44 rounded-lg bg-surface-container-highest" />
            <div className="h-3 w-32 rounded-lg bg-surface-container" />
          </div>

          <div className="h-8 w-20 rounded-full bg-surface-container-highest" />
        </div>

        {/* Main intelligence card */}
        <div className="rounded-3xl bg-surface-container-low border border-surface-container p-6 shadow-sm">
          <div className="space-y-4">
            <div className="h-5 w-56 rounded-lg bg-surface-container-highest" />

            <div className="space-y-3">
              <div className="h-4 w-full rounded-lg bg-surface-container" />
              <div className="h-4 w-[92%] rounded-lg bg-surface-container" />
              <div className="h-4 w-[76%] rounded-lg bg-surface-container" />
            </div>
          </div>
        </div>

        {/* Sensor cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-32 rounded-3xl bg-surface-container-low border border-surface-container" />
          <div className="h-32 rounded-3xl bg-surface-container-low border border-surface-container" />
        </div>

        {/* Reminder/safety card */}
        <div className="rounded-3xl bg-surface-container-low border border-surface-container p-6">
          <div className="space-y-3">
            <div className="h-4 w-36 rounded-lg bg-surface-container-highest" />
            <div className="h-4 w-full rounded-lg bg-surface-container" />
            <div className="h-4 w-[85%] rounded-lg bg-surface-container" />
            <div className="h-4 w-[65%] rounded-lg bg-surface-container" />
          </div>
        </div>

        {/* Brain-building status */}
        <div className="flex flex-col items-center justify-center pt-4 text-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />

            <span className="text-sm font-semibold text-on-surface">
              {message}
            </span>
          </div>

          <p className="mt-2 max-w-md text-xs leading-5 text-on-surface-variant">
            Connecting to MaterniBot&apos;s clinical intelligence service.
            Render may take a little longer when the service has been asleep.
          </p>

          <div className="flex items-center gap-1 mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MaterniBotBrainSkeleton;
