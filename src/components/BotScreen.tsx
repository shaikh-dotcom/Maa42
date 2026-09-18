import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, BotProfile, BotSensorReading, BotReminder, BotSymptomEntry } from "../types";
import {
  Cpu,
  Wifi,
  WifiOff,
  RefreshCw,
  HeartPulse,
  Droplets,
  Thermometer,
  Wind,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Languages,
  Loader2,
} from "lucide-react";

interface BotScreenProps {
  user: UserProfile;
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
  { value: "ja", label: "Japanese" },
];

const REMINDER_CATEGORIES: { value: string; label: string }[] = [
  { value: "medicine", label: "Medicine" },
  { value: "water", label: "Water" },
  { value: "vitamin", label: "Vitamin" },
  { value: "appointment", label: "Appointment" },
  { value: "general", label: "General" },
];

async function getJson(url: string) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

async function postJson(url: string, body: unknown, method: "POST" | "PATCH" = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || Number.isNaN(ms)) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const BotScreen: React.FC<BotScreenProps> = ({ user }) => {
  const [online, setOnline] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState<string>("");

  const [botProfile, setBotProfile] = useState<BotProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncLang, setSyncLang] = useState("en");
  const [syncMessage, setSyncMessage] = useState("");

  const [reading, setReading] = useState<BotSensorReading | null>(null);
  const [readingLoading, setReadingLoading] = useState(true);

  const [reminders, setReminders] = useState<BotReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    category: "water",
    message: "",
    medicine_name: "",
    dose: "",
    frequency: "",
    interval_minutes: "",
  });
  const [addingReminder, setAddingReminder] = useState(false);

  const [symptoms, setSymptoms] = useState<BotSymptomEntry[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState(true);
  const [symptomText, setSymptomText] = useState("");
  const [loggingSymptom, setLoggingSymptom] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await getJson("/api/bot/status");
      setOnline(Boolean(data.online));
      setStatusError(data.online ? "" : data.error || "Bot unreachable");
    } catch (err: any) {
      setOnline(false);
      setStatusError(err?.message || "Bot unreachable");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await getJson("/api/bot/profile");
      setBotProfile(data.profile ?? null);
      if (data.profile?.preferred_lang) setSyncLang(data.profile.preferred_lang);
    } catch {
      setBotProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshReading = useCallback(async () => {
    setReadingLoading(true);
    try {
      const data = await getJson("/api/bot/sensors/latest");
      setReading(data.reading ?? null);
    } catch {
      setReading(null);
    } finally {
      setReadingLoading(false);
    }
  }, []);

  const refreshReminders = useCallback(async () => {
    setRemindersLoading(true);
    try {
      const data = await getJson("/api/bot/reminders");
      setReminders(data.reminders ?? []);
    } catch {
      setReminders([]);
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  const refreshSymptoms = useCallback(async () => {
    setSymptomsLoading(true);
    try {
      const data = await getJson("/api/bot/symptoms?limit=20");
      setSymptoms(data.symptoms ?? []);
    } catch {
      setSymptoms([]);
    } finally {
      setSymptomsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    refreshStatus();
    refreshProfile();
    refreshReading();
    refreshReminders();
    refreshSymptoms();
  }, [refreshStatus, refreshProfile, refreshReading, refreshReminders, refreshSymptoms]);

  useEffect(() => {
    refreshAll();
    // Keep status + the latest reading reasonably live without hammering
    // the bot backend — 20s is frequent enough for a desktop companion.
    const interval = setInterval(() => {
      refreshStatus();
      refreshReading();
    }, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    if (!user.dueDate) {
      setSyncMessage("Set your due date in your profile first.");
      return;
    }
    setSyncing(true);
    setSyncMessage("");
    try {
      const isoDate = new Date(user.dueDate).toISOString().slice(0, 10);
      await postJson("/api/bot/profile", {
        due_date: isoDate,
        preferred_lang: syncLang,
      });
      setSyncMessage("Synced to MaterniBot.");
      refreshProfile();
    } catch (err: any) {
      setSyncMessage(err?.message || "Sync failed — is the bot backend running?");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 4000);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.message.trim()) return;
    if (newReminder.category === "medicine" && !newReminder.medicine_name.trim()) return;
    setAddingReminder(true);
    try {
      await postJson("/api/bot/reminders", {
        category: newReminder.category,
        message: newReminder.message.trim(),
        medicine_name: newReminder.medicine_name.trim() || undefined,
        dose: newReminder.dose.trim() || undefined,
        frequency: newReminder.frequency.trim() || undefined,
        interval_minutes: newReminder.interval_minutes
          ? Number(newReminder.interval_minutes)
          : undefined,
      });
      setNewReminder({
        category: "water",
        message: "",
        medicine_name: "",
        dose: "",
        frequency: "",
        interval_minutes: "",
      });
      setShowAddReminder(false);
      refreshReminders();
    } catch (err: any) {
      setSyncMessage(err?.message || "Couldn't add reminder.");
      setTimeout(() => setSyncMessage(""), 4000);
    } finally {
      setAddingReminder(false);
    }
  };

  const handleDeactivateReminder = async (r: BotReminder) => {
    try {
      await postJson(
        `/api/bot/reminders/${r.id}/deactivate?category=${encodeURIComponent(r.category)}`,
        {},
        "PATCH",
      );
      setReminders((prev) => prev.filter((x) => !(x.id === r.id && x.category === r.category)));
    } catch (err: any) {
      setSyncMessage(err?.message || "Couldn't remove reminder.");
      setTimeout(() => setSyncMessage(""), 4000);
    }
  };

  const handleLogSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText.trim()) return;
    setLoggingSymptom(true);
    try {
      await postJson("/api/bot/symptoms", { symptom_text: symptomText.trim() });
      setSymptomText("");
      refreshSymptoms();
    } catch (err: any) {
      setSyncMessage(err?.message || "Couldn't log symptom.");
      setTimeout(() => setSyncMessage(""), 4000);
    } finally {
      setLoggingSymptom(false);
    }
  };

  const vitals = [
    {
      key: "heart_rate",
      label: "Heart Rate",
      icon: HeartPulse,
      value: reading?.heart_rate != null ? `${reading.heart_rate} bpm` : "—",
    },
    {
      key: "spo2",
      label: "SpO2",
      icon: Droplets,
      value: reading?.spo2 != null ? `${reading.spo2}%` : "—",
    },
    {
      key: "temperature",
      label: "Room Temp",
      icon: Thermometer,
      value: reading?.temperature != null ? `${reading.temperature}°C` : "—",
    },
    {
      key: "humidity",
      label: "Humidity",
      icon: Wind,
      value: reading?.humidity != null ? `${reading.humidity}%` : "—",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-28 flex flex-col"
    >
      {/* Connection Status Banner */}
      <section
        className={`relative overflow-hidden rounded-3xl p-6 shadow-md mb-6 border ${
          online
            ? "bg-primary-container text-on-primary-container border-primary/20"
            : "bg-surface-container-low text-on-surface border-surface-container"
        }`}
      >
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                online ? "bg-on-primary-container/15" : "bg-surface-container-highest"
              }`}
            >
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold font-headline">MaterniBot</h1>
                {online === null ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
                ) : online ? (
                  <Wifi className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-outline" />
                )}
              </div>
              <p className="text-xs opacity-80">
                {online === null
                  ? "Checking connection..."
                  : online
                    ? "Connected to your desktop companion"
                    : statusError || "Bot backend unreachable — is it running?"}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={refreshAll}
            className="w-9 h-9 rounded-full bg-surface/60 hover:bg-surface/90 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </section>

      <AnimatePresence>
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 bg-primary-fixed text-on-primary-fixed rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pregnancy Profile Sync */}
      <section className="rounded-3xl bg-surface-container-low p-5 shadow-sm border border-surface-container mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-on-surface">Pregnancy Profile Sync</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-surface p-3 border border-surface-container">
            <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold mb-1">
              On this app
            </p>
            <p className="text-sm font-bold text-on-surface">
              {user.isPostpartum ? `Day ${user.postpartumDay}` : `Week ${user.week}`}
            </p>
            <p className="text-xs text-on-surface-variant">
              {user.dueDate ? `Due ${new Date(user.dueDate).toLocaleDateString()}` : "No due date set"}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-3 border border-surface-container">
            <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold mb-1">
              On MaterniBot
            </p>
            {profileLoading ? (
              <p className="text-sm text-on-surface-variant">Loading...</p>
            ) : botProfile ? (
              <>
                <p className="text-sm font-bold text-on-surface">
                  Week {botProfile.pregnancy_week}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {botProfile.due_date
                    ? `Due ${new Date(botProfile.due_date).toLocaleDateString()}`
                    : "No due date set"}
                </p>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">Not set yet</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={syncLang}
            onChange={(e) => setSyncLang(e.target.value)}
            className="flex-1 bg-surface border border-surface-container rounded-full px-3 py-2 text-xs font-medium text-on-surface"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSync}
            disabled={syncing || !user.dueDate}
            className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Sync to Bot</span>
          </motion.button>
        </div>
      </section>

      {/* Live Vitals */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Live Readings
          </h2>
          <span className="text-xs text-on-surface-variant">
            {readingLoading ? "Loading..." : `Last reading ${timeAgo(reading?.timestamp)}`}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {vitals.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.key}
                className="rounded-3xl bg-surface-container-low p-4 shadow-sm border border-surface-container flex flex-col items-center text-center gap-1.5"
              >
                <div className="w-9 h-9 rounded-full bg-secondary-container/40 text-secondary flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-sm font-bold text-on-surface">{v.value}</p>
                <p className="text-[10px] text-on-surface-variant font-medium">{v.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reminders Manager */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Reminders
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowAddReminder((s) => !s)}
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {showAddReminder && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddReminder}
              className="rounded-3xl bg-surface-container-low p-4 shadow-sm border border-surface-container mb-3 flex flex-col gap-2.5 overflow-hidden"
            >
              <select
                value={newReminder.category}
                onChange={(e) => setNewReminder((r) => ({ ...r, category: e.target.value }))}
                className="bg-surface border border-surface-container rounded-full px-3 py-2 text-xs font-medium text-on-surface"
              >
                {REMINDER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {newReminder.category === "medicine" && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newReminder.medicine_name}
                    onChange={(e) =>
                      setNewReminder((r) => ({ ...r, medicine_name: e.target.value }))
                    }
                    placeholder="Medicine name"
                    className="bg-surface border border-surface-container rounded-full px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60"
                  />
                  <input
                    value={newReminder.dose}
                    onChange={(e) => setNewReminder((r) => ({ ...r, dose: e.target.value }))}
                    placeholder="Dose (e.g. 400mg)"
                    className="bg-surface border border-surface-container rounded-full px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60"
                  />
                </div>
              )}

              <input
                value={newReminder.message}
                onChange={(e) => setNewReminder((r) => ({ ...r, message: e.target.value }))}
                placeholder={
                  newReminder.category === "medicine"
                    ? "e.g. Take after breakfast"
                    : "What should the bot say?"
                }
                required
                className="bg-surface border border-surface-container rounded-full px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60"
              />

              {newReminder.category !== "medicine" && (
                <input
                  value={newReminder.interval_minutes}
                  onChange={(e) =>
                    setNewReminder((r) => ({ ...r, interval_minutes: e.target.value }))
                  }
                  type="number"
                  min={1}
                  placeholder="Repeat every N minutes (blank = one-off)"
                  className="bg-surface border border-surface-container rounded-full px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60"
                />
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={addingReminder}
                className="bg-primary text-on-primary py-2 rounded-full text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {addingReminder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Save Reminder</span>
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {remindersLoading ? (
            <p className="text-xs text-on-surface-variant px-1">Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <p className="text-xs text-on-surface-variant px-1">No active reminders yet.</p>
          ) : (
            reminders.map((r) => (
              <div
                key={`${r.category}-${r.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-container"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {r.category === "medicine" ? r.medicine_name : r.message}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {r.category === "medicine" ? `${r.dose || ""} · ${r.frequency || ""}` : r.category}
                    {r.next_due ? ` · next ${new Date(r.next_due).toLocaleString()}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeactivateReminder(r)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                  aria-label="Remove reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Symptom Log */}
      <section>
        <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">
          Symptom Log
        </h2>

        <form onSubmit={handleLogSymptom} className="flex items-center gap-2 mb-3">
          <input
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            placeholder="Log a symptom (e.g. mild back pain today)"
            className="flex-1 bg-surface-container-low border border-surface-container rounded-full px-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="submit"
            disabled={loggingSymptom || !symptomText.trim()}
            className="bg-secondary text-on-secondary px-4 py-2.5 rounded-full text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loggingSymptom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Log"}
          </motion.button>
        </form>

        <div className="flex flex-col gap-2">
          {symptomsLoading ? (
            <p className="text-xs text-on-surface-variant px-1">Loading symptom log...</p>
          ) : symptoms.length === 0 ? (
            <p className="text-xs text-on-surface-variant px-1">No symptoms logged yet.</p>
          ) : (
            symptoms.map((s) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 p-3 rounded-2xl border ${
                  s.red_flag
                    ? "bg-red-500/5 border-red-500/30"
                    : "bg-surface-container-low border-surface-container"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    s.red_flag
                      ? "bg-red-500/15 text-red-500"
                      : "bg-secondary-container/40 text-secondary"
                  }`}
                >
                  {s.red_flag ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface">{s.symptom_text}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {timeAgo(s.timestamp)}
                    {s.red_flag ? " · flagged — consider contacting your provider" : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
};
