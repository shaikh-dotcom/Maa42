import React, { useState } from "react";
import { X, User, Calendar, LogOut, Check, Copy } from "lucide-react";
import { UserProfile } from "../types";

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
  const [idCopied, setIdCopied] = useState(false);

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

  const handleCopyId = async () => {
    if (!user.maa42Id) return;

    try {
      await navigator.clipboard.writeText(user.maa42Id);

      setIdCopied(true);

      setTimeout(() => {
        setIdCopied(false);
      }, 1600);
    } catch {
      // Clipboard access can be denied by the browser.
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-surface-container relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
          aria-label="Close profile"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-on-surface truncate">
              {name}
            </h3>

            <p className="text-xs text-primary font-medium">
              MedSophia Maa42 Member
            </p>
          </div>
        </div>

        {/* Maa42 ID */}
        <div className="mb-6">
          <label className="font-bold text-on-surface-variant block mb-1.5 uppercase tracking-wider text-[11px]">
            Your Maa42 ID
          </label>

          <div className="flex items-center gap-2 bg-surface-container-low border border-surface-container rounded-xl p-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-on-surface-variant mb-0.5">
                Share this ID so other Maa42 members can find you
              </p>

              <p className="font-mono text-sm font-bold text-primary tracking-wider truncate">
                {user.maa42Id || "Generating ID..."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyId}
              disabled={!user.maa42Id}
              className="shrink-0 w-9 h-9 rounded-lg bg-surface text-primary border border-surface-container flex items-center justify-center hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Copy Maa42 ID"
              title="Copy Maa42 ID"
            >
              {idCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {idCopied && (
            <p className="mt-1.5 text-[10px] font-medium text-primary">
              Maa42 ID copied to clipboard
            </p>
          )}
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
                    ? "bg-surface text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Pregnancy (Week {week})
              </button>

              <button
                type="button"
                onClick={() => setIsPostpartum(true)}
                className={`py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  isPostpartum
                    ? "bg-surface text-secondary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Maa42 (Day {postpartumDay})
              </button>
            </div>
          </div>

          {!isPostpartum ? (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-on-surface-variant">
                  Gestational Week:
                </span>

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
                <span className="font-medium text-on-surface-variant">
                  Postpartum Day:
                </span>

                <span className="font-bold text-secondary">
                  Day {postpartumDay} of 42
                </span>
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
            <span className="text-on-surface-variant font-medium">
              Care Circle Push Alerts
            </span>

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
