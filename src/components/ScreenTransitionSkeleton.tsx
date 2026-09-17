import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface ScreenTransitionSkeletonProps {
  title?: string;
  subtitle?: string;
}

export const ScreenTransitionSkeleton: React.FC<ScreenTransitionSkeletonProps> = ({
  title = 'Syncing your care view...',
  subtitle = 'Loading clinical data & personalized wellness markers',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]"
    >
      <div className="relative mb-6">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-md"
        />
        <div className="w-14 h-14 rounded-2xl bg-surface-container border border-surface-container-high flex items-center justify-center relative z-10 shadow-sm">
          <Heart className="w-7 h-7 text-primary animate-pulse fill-primary/20" />
        </div>
      </div>

      <motion.div
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <h4 className="text-sm font-bold text-on-surface flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-secondary animate-spin" />
          <span>{title}</span>
        </h4>
        <p className="text-xs text-on-surface-variant mt-1 max-w-xs">{subtitle}</p>
      </motion.div>

      {/* Shimmer skeleton cards */}
      <div className="w-full space-y-3">
        <div className="h-20 w-full bg-surface-container/60 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-surface-container/60 rounded-2xl animate-pulse" />
          <div className="h-24 bg-surface-container/60 rounded-2xl animate-pulse" />
        </div>
        <div className="h-32 w-full bg-surface-container/60 rounded-2xl animate-pulse" />
      </div>
    </motion.div>
  );
};
