import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maa42Logo } from './Maa42Logo';
import { UserProfile, ScreenId } from '../types';
import { AlertCircle, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentScreen: ScreenId;
  user: UserProfile;
  onOpenSos: () => void;
  onOpenProfile: () => void;
  onGoToLanding?: () => void;
  onTriggerLoadingScreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  user,
  onOpenSos,
  onOpenProfile,
  onGoToLanding,
  onTriggerLoadingScreen,
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home':
        return 'Home Dashboard';
      case 'sophia':
        return 'Sophia AI Chat';
      case 'tracker':
        return 'Maa42 Tracker';
      case 'circle':
        return 'Care Circle';
      default:
        return 'MedSophia';
    }
  };

  const getSubTitle = () => {
    if (user.isPostpartum) {
      return `Fourth Trimester • Day ${user.postpartumDay} of 42`;
    }
    return `Week ${user.week} • ${user.trimester === 1 ? '1st' : user.trimester === 2 ? '2nd' : '3rd'} Trimester`;
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-surface-container/60 shadow-[0_1px_8px_rgba(13,92,99,0.04)]">
      <div className="max-w-4xl mx-auto h-20 px-4 sm:px-6 flex items-center justify-between">
        {/* Logo & Title */}
        <button
          onClick={onGoToLanding}
          className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity cursor-pointer"
          title="Return to Welcome Page"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-surface-container flex items-center justify-center p-1">
            <Maa42Logo className="h-8 w-8 transition-transform group-hover:scale-105" />
          </div>
          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentScreen}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors"
              >
                {getScreenTitle()}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm font-bold text-primary">
              {getSubTitle()}
            </span>
          </div>
        </button>

        {/* Right actions: Re-sync / Loading Trigger, SOS button & Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onTriggerLoadingScreen && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onTriggerLoadingScreen}
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer"
              title="Sync & Re-run Sanctuary Loader"
            >
              <Sparkles className="w-4 h-4" />
            </motion.button>
          )}

          <motion.button
            id="header-sos-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenSos}
            className="flex items-center gap-1.5 bg-error-container text-on-error-container hover:bg-red-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-[0_1px_8px_rgba(186,26,26,0.15)] transition-all cursor-pointer"
            aria-label="Urgent SOS Triage Hotline"
          >
            <AlertCircle className="w-4 h-4 text-error animate-pulse" />
            <span className="tracking-wide">SOS</span>
          </motion.button>

          <motion.button
            id="header-profile-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-all shadow-sm cursor-pointer"
            aria-label="User profile and pregnancy settings"
          >
            <User className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
