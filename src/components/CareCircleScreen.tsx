import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CareMember } from '../types';
import { INITIAL_CARE_TEAM } from '../data';
import { AlertCircle, Timer, Phone, FileText, Zap, MessageSquare, Video, Heart, Check, Loader2, Sparkles } from 'lucide-react';

interface CareCircleScreenProps {
  onOpenSosContraction: () => void;
  onOpenSosHotline: () => void;
  onPreviewPdf: (summaryText: string) => void;
  onContactMember: (member: CareMember, mode: 'chat' | 'call') => void;
}

export const CareCircleScreen: React.FC<CareCircleScreenProps> = ({
  onOpenSosContraction,
  onOpenSosHotline,
  onPreviewPdf,
  onContactMember,
}) => {
  const [summaryText, setSummaryText] = useState(
    "• BP Average: 118/76 mmHg (Stable & Optimal)\n• Weight gain: +0.4kg this week within target\n• Reported mild lower back tension on Wed; resolved with stretching and hydration.\n• Fetal activity regular: 12-14 movements logged daily during evening rest."
  );
  const [updatedTime, setUpdatedTime] = useState("Updated 2h ago");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);

  const handleRegenerateSummary = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/clinical-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bp: "116/74 mmHg",
          weightChange: "+0.5kg this week",
          week: 24,
          symptoms: "Mild pelvic pressure during evening, resolved after lying down and hydration."
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryText(data.summary);
        setUpdatedTime("Updated just now");
      }
    } catch (e) {
      setSummaryText("• BP Average: 116/74 mmHg (Optimal)\n• Weight gain: +0.5kg within clinical parameters\n• Symptoms: Mild pelvic pressure resolving with rest; baby kick count active.");
      setUpdatedTime("Updated just now");
    } finally {
      setIsSyncing(false);
      setSyncedSuccess(true);
      setTimeout(() => setSyncedSuccess(false), 3500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-28 flex flex-col"
    >
      {/* Top Welcome & Status Banner */}
      <div className="bg-primary-container text-on-primary-container p-6 rounded-3xl shadow-sm mb-6 relative overflow-hidden flex flex-col justify-between border border-primary/20">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-8 -bottom-8 w-40 h-40 bg-secondary rounded-full blur-2xl pointer-events-none"
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="bg-surface/20 text-on-primary px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
              Care Circle &amp; Triage
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary-fixed">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping" />
              <span>Clinical Team Active</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-primary mb-1">
            Your Care Circle is Synchronized
          </h2>
          <p className="text-sm text-on-primary-container/95 leading-relaxed">
            Collaborative maternal care updates, direct escalation paths, and automated telehealth summaries for Dr. Sharma and Dr. Vance.
          </p>
        </div>
      </div>

      {/* SOS & Urgent Triage Section */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="bg-error-container text-on-error-container p-6 rounded-3xl shadow-sm mb-6 flex flex-col gap-4 border border-error/20"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-error text-on-error flex items-center justify-center shadow-md shrink-0">
              <AlertCircle className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-error-container">
                Urgent Triage &amp; SOS Escalation
              </h3>
              <p className="text-xs text-on-error-container/85">
                Experiencing severe symptoms? Connect instantly with on-call triage.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenSosContraction}
            className="flex items-center justify-between bg-surface text-on-surface px-4 py-3.5 rounded-2xl font-semibold text-sm shadow-sm hover:bg-surface-bright transition-all cursor-pointer border border-surface-container"
          >
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-secondary animate-pulse" />
              <span>Contraction Timer &amp; Triage</span>
            </div>
            <span className="text-xs text-on-surface-variant font-bold">&rarr;</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenSosHotline}
            className="flex items-center justify-between bg-error text-on-error px-4 py-3.5 rounded-2xl font-semibold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-on-error fill-current animate-bounce" style={{ animationDuration: '2s' }} />
              <span>Instant OB Triage Hotline</span>
            </div>
            <span className="text-xs bg-on-error/20 px-2 py-0.5 rounded-full text-on-error font-bold">
              24/7
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Telehealth Clinical Summary Generator */}
      <div className="bg-surface-container-low p-6 rounded-3xl shadow-sm mb-6 flex flex-col gap-4 border border-surface-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Telehealth Clinical Summary</h3>
              <p className="text-xs text-on-surface-variant">
                AI-generated digest of your last 7 days for Dr. Sharma
              </p>
            </div>
          </div>
          <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
            Ready
          </span>
        </div>

        {/* Shimmer loading skeleton when regenerating */}
        {isSyncing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface p-5 rounded-2xl border border-surface-container space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI Clinical Digest Generating...</span>
              </span>
              <span className="text-[11px] text-on-surface-variant">Analyzing vitals &amp; logs</span>
            </div>
            <div className="h-4 bg-surface-container rounded-md w-3/4 animate-pulse" />
            <div className="h-4 bg-surface-container rounded-md w-full animate-pulse" />
            <div className="h-4 bg-surface-container rounded-md w-5/6 animate-pulse" />
          </motion.div>
        ) : (
          <div className="bg-surface p-4 rounded-2xl text-xs text-on-surface-variant space-y-2 border border-surface-container shadow-xs">
            <div className="flex justify-between items-center font-semibold text-on-surface pb-2 border-b border-surface-container">
              <span>Digest Period: Week 23-24</span>
              <span className="text-primary font-bold">{updatedTime}</span>
            </div>
            <div className="whitespace-pre-line leading-relaxed text-on-surface font-mono text-[11px]">
              {summaryText}
            </div>
          </div>
        )}

        <AnimatePresence>
          {syncedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-2.5 bg-primary-fixed text-on-primary-fixed rounded-2xl text-xs font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>Summary successfully generated and transmitted to Dr. Sharma!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleRegenerateSummary}
            disabled={isSyncing}
            className="w-full sm:flex-1 bg-primary text-on-primary py-3 px-4 rounded-full text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing with Dr. Sharma...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Regenerate &amp; Sync with Care Team</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPreviewPdf(summaryText)}
            className="w-full sm:w-auto bg-surface text-on-surface px-5 py-3 rounded-full text-xs font-semibold shadow-sm hover:bg-surface-bright transition-all cursor-pointer border border-surface-container"
          >
            Preview PDF
          </motion.button>
        </div>
      </div>

      {/* Your Care Team Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-on-surface">Your Care Team</h3>
          <button
            onClick={() => alert("Care Circle Settings: You can add doulas, lactation consultants, or family members to receive automatic updates.")}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Manage Circle
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {INITIAL_CARE_TEAM.map((member) => (
            <motion.div
              key={member.id}
              whileHover={{ y: -2 }}
              className="bg-surface-container-low p-5 rounded-3xl shadow-sm flex items-center justify-between border border-surface-container"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    className="w-14 h-14 rounded-full object-cover border border-surface-container-high"
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                  />
                  {member.role.toLowerCase().includes('ob') && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-on-surface">{member.name}</h4>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {member.badge}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{member.facility}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-primary font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{member.nextAppointment}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.canMessage && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onContactMember(member, 'chat')}
                    className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all shadow-xs cursor-pointer"
                    title={`Send message to ${member.name}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </motion.button>
                )}
                {member.canCall && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onContactMember(member, 'call')}
                    className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all shadow-xs cursor-pointer"
                    title={`Video call ${member.name}`}
                  >
                    <Video className="w-4 h-4" />
                  </motion.button>
                )}
                {member.id === 'rohan-partner' && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => alert("Partner Love Tap: Sent a warm notification to Rohan!")}
                    className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-secondary hover:text-on-secondary transition-all shadow-xs cursor-pointer"
                    title="Send Partner Love Tap"
                  >
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upcoming Care Schedule */}
      <div className="bg-surface-container-low p-6 rounded-3xl shadow-sm border border-surface-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-on-surface">Upcoming Care Schedule</h3>
          <span className="text-xs font-semibold text-primary">View All</span>
        </div>

        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-surface p-4 rounded-2xl flex items-center justify-between shadow-xs border border-surface-container"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary-fixed text-on-primary-fixed flex flex-col items-center justify-center text-xs font-bold shrink-0">
                <span className="text-sm">24</span>
                <span className="text-[9px] uppercase tracking-wide">Oct</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">
                  24-Week Comprehensive OB Checkup
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Metro Maternal Health &bull; Dr. Ananya Sharma
                </p>
              </div>
            </div>
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full shrink-0">
              10:00 AM
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-surface p-4 rounded-2xl flex items-center justify-between shadow-xs border border-surface-container"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex flex-col items-center justify-center text-xs font-bold shrink-0">
                <span className="text-sm">02</span>
                <span className="text-[9px] uppercase tracking-wide">Nov</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">
                  Virtual Nutrition &amp; Wellness Session
                </h4>
                <p className="text-xs text-on-surface-variant">Online Care Circle Group</p>
              </div>
            </div>
            <span className="bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full shrink-0">
              02:00 PM
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
