import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maa42Logo } from './Maa42Logo';
import { ScreenId } from '../types';
import { Heart, ArrowRight, Bot, TrendingUp, Users, ChevronRight, Star, Sparkles } from 'lucide-react';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  isAuthenticated: boolean;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onNavigate,
  isAuthenticated,
  onOpenSignIn,
  onOpenSignUp,
}) => {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-20 flex flex-col"
    >
      {/* Top Hero Section with Warm Ivory tactile depth */}
      <motion.section
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden py-10 sm:py-12 px-6 rounded-3xl bg-surface-container-low mb-8 shadow-sm border border-surface-container-high/40"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary pointer-events-none blur-2xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-secondary pointer-events-none blur-2xl"
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold mb-6 shadow-sm"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-primary animate-pulse" />
            <span>MedSophia Maa42 Care System</span>
          </motion.div>

          {/* Emblem with gentle breathing motion */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-2xl bg-white shadow-[0_4px_20px_rgba(19,107,115,0.08)] flex items-center justify-center p-3 mb-6 border border-surface-container"
          >
            <Maa42Logo className="w-full h-full" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-primary tracking-tight mb-4 font-headline leading-tight"
          >
            AI-assisted care for the moments mothers need it most
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-on-surface-variant text-base sm:text-lg mb-8 leading-relaxed font-body"
          >
            Nurturing your 42-day postpartum recovery with intelligent guidance, seamless partner sync, and compassionate clinical oversight.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowOnboardingModal(true)}
              className="bg-primary text-on-primary font-semibold px-8 py-3.5 rounded-full shadow-[0_4px_20px_rgba(0,67,73,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => (isAuthenticated ? onNavigate('home') : onOpenSignIn())}
              className="bg-surface text-primary border border-outline-variant/40 font-semibold px-8 py-3.5 rounded-full hover:bg-surface-container transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{isAuthenticated ? 'Enter Dashboard' : 'Sign In'}</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Value Propositions / Core Pillars */}
      <section className="mb-10">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            DESIGNED FOR MODERN MOTHERHOOD
          </span>
          <h2 className="text-2xl font-bold text-primary mt-1 font-headline">
            Everything you need in one gentle space
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Sophia AI */}
          <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigate('sophia')}
            className="bg-surface-container-low p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container hover:border-primary-fixed cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Sophia AI Companion</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Your 24/7 empathetic guide for feeding queries, emotional support, and soothing newborn tips tailored to your exact hour postpartum.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Always available</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>

          {/* Card 2: 42-Day Tracker */}
          <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigate('tracker')}
            className="bg-surface-container-low p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container hover:border-secondary-fixed cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">42-Day Recovery Tracker</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Daily physical and mental wellbeing checkpoints designed specifically around traditional and modern golden month milestones.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-secondary">
              <span>Personalized roadmap</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>

          {/* Card 3: Care Circle Sync */}
          <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigate('circle')}
            className="bg-surface-container-low p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container hover:border-tertiary-fixed cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Care Circle Sync</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Keep your partner, family helpers, and OB-GYN effortlessly aligned with automatic updates, vital logs, and shared care notes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-tertiary">
              <span>Connected care</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Banner */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 bg-primary text-on-primary p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-md"
      >
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Heart className="w-48 h-48 fill-current" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-1 text-on-primary-fixed mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current text-secondary-container" />
            ))}
          </div>
          <p className="text-lg sm:text-xl font-medium italic mb-4 leading-snug">
            &ldquo;Having Sophia answer my frantic 3 AM feeding questions while automatically updating my OB-GYN gave me the peace of mind every new mother deserves.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center text-sm shadow-xs">
              AM
            </div>
            <div>
              <h4 className="text-sm font-bold">Aaliyah M.</h4>
              <p className="text-xs text-primary-fixed-dim">New mom to baby Leo &bull; Day 14</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Onboarding / Setup Modal */}
      <AnimatePresence>
        {showOnboardingModal && (
          <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-surface p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-surface-container"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center mb-4 mx-auto shadow-md">
                <Heart className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-primary text-center mb-2 font-headline">
                Welcome to MedSophia
              </h3>
              <p className="text-on-surface-variant text-sm text-center mb-6 leading-relaxed">
                Let&apos;s set up your personal 42-day recovery journey and connect your care circle.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowOnboardingModal(false);
                    onNavigate('home');
                  }}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-full font-semibold text-sm shadow-[0_4px_16px_rgba(0,67,73,0.2)] hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Begin Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                {isAuthenticated ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowOnboardingModal(false);
                      onNavigate('home');
                    }}
                    className="w-full bg-surface text-secondary border border-secondary/30 py-3 rounded-full font-semibold text-sm hover:bg-secondary-fixed/20 transition-all cursor-pointer"
                  >
                    Enter Dashboard
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowOnboardingModal(false);
                      onOpenSignUp();
                    }}
                    className="w-full bg-surface text-secondary border border-secondary/30 py-3 rounded-full font-semibold text-sm hover:bg-secondary-fixed/20 transition-all cursor-pointer"
                  >
                    Create New Account
                  </motion.button>
                )}

                <button
                  onClick={() => {
                    setShowOnboardingModal(false);
                    onNavigate('home');
                  }}
                  className="w-full bg-surface-container text-on-surface py-2.5 rounded-full font-medium text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Skip to Dashboard Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
