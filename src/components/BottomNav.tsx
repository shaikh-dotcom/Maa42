import React from "react";
import { motion } from "motion/react";
import { ScreenId } from "../types";
import {
  Home,
  Bot,
  TrendingUp,
  BookOpen,
  Users,
  MessageCircle,
} from "lucide-react";

interface BottomNavProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  onOpenResources: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenResources,
}) => {
  const tabs = [
    { id: "home" as ScreenId, label: "Home", icon: Home },
    { id: "sophia" as ScreenId, label: "Sophia", icon: Bot },
    { id: "tracker" as ScreenId, label: "Tracker", icon: TrendingUp },
    {
      id: "resources" as const,
      label: "Resources",
      icon: BookOpen,
      isAction: true,
    },
    { id: "messages" as ScreenId, label: "Messages", icon: MessageCircle },
    { id: "circle" as ScreenId, label: "Care Circle", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-surface-container/80 shadow-[0_-2px_16px_rgba(13,92,99,0.06)]">
      <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !tab.isAction && currentScreen === tab.id;

          return (
            <motion.button
              key={tab.label}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (tab.isAction) {
                  onOpenResources();
                } else {
                  onSelectScreen(tab.id as ScreenId);
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-1 w-14 h-16 rounded-2xl transition-colors cursor-pointer ${
                isActive
                  ? "text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-primary-container rounded-2xl -z-10 shadow-xs"
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-medium tracking-tight relative z-10">
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
