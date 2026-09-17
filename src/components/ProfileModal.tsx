import React, { useState } from 'react';
import { UserProfile, ScreenId } from '../types';
import { X, User, Calendar, Bell, Heart, LogOut, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
  onGoToLanding: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onUpdateUser,
  onClose,
  onGoToLanding,
}) => {
  const [name, setName] = useState(user.name);
  const [isPostpartum, setIsPostpartum] = useState(user.isPostpartum);
  const [week, setWeek] = useState(user.week);
  const [postpartumDay, setPostpartumDay] = useState(user.postpartumDay);
  const [notifications, setNotifications] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateUser({
      name,
      isPostpartum,
      week,
      postpartumDay,
    });
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-surface-container relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">{name}</h3>
            <p className="text-xs text-primary font-medium">MedSophia Maa42 Member</p>
          </div>
        </div>

        <div className="space-y-4 mb-6 text-xs">
          {/* Pregnancy vs Postpartum Mode Toggle */}
          <div>
            <label className="font-bold text-on-surface-variant block mb-1.5 uppercase tracking-wider text-[11px]">
              Active Care Phase
            </label>
            <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setIsPostpartum(false)}
                className={`py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  !isPostpartum
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Pregnancy (Week {week})
              </button>
              <button
                type="button"
                onClick={() => setIsPostpartum(true)}
                className={`py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  isPostpartum
                    ? 'bg-surface text-secondary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Maa42 (Day {postpartumDay})
              </button>
            </div>
          </div>

          {!isPostpartum ? (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-on-surface-variant">Gestational Week:</span>
                <span className="font-bold text-primary">Week {week}</span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-on-surface-variant">Postpartum Day:</span>
                <span className="font-bold text-secondary">Day {postpartumDay} of 42</span>
              </div>
              <input
                type="range"
                min="1"
                max="42"
                value={postpartumDay}
                onChange={(e) => setPostpartumDay(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer"
              />
            </div>
          )}

          {/* Name edit */}
          <div>
            <label className="font-bold text-on-surface-variant block mb-1 uppercase tracking-wider text-[11px]">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between py-1">
            <span className="text-on-surface-variant font-medium">Care Circle Push Alerts</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-4 h-4 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="w-full bg-primary text-on-primary py-3 rounded-full font-bold text-xs shadow-sm hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {savedToast ? (
              <>
                <Check className="w-4 h-4" />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          <button
            onClick={() => {
              onClose();
              onGoToLanding();
            }}
            className="w-full bg-surface text-on-surface-variant py-2.5 rounded-full font-medium text-xs hover:text-error transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
