import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ---------------------------------------------------------------------------
// User stage context
// ---------------------------------------------------------------------------
// Mirrors the shape of `UserProfile` from useAuth.ts. The frontend must send
// this alongside the chat message so responses reflect the signed-in user's
// actual journey instead of an assumed Week 24 / 2nd trimester.
interface UserStageProfile {
  name?: string;
  week?: number;
  trimester?: number;
  isPostpartum?: boolean;
  postpartumDay?: number;
}

// Turns a raw profile into a plain-English description of where the user is
// right now, used both in the AI system prompt and in the canned fallbacks.
function describeStage(profile?: UserStageProfile): {
  label: string; // e.g. "Week 24 (2nd trimester)" or "Day 12 postpartum"
  contextLine: string; // one line for the fallback replies
} {
  if (!profile) {
    return {
      label: "an unspecified stage",
      contextLine:
        "I don't have your current week or postpartum day on file yet, so this is general guidance — let me know where you are in your journey for anything more specific.",
    };
  }

  if (profile.isPostpartum) {
    const day = profile.postpartumDay ?? 1;
    return {
      label: `Day ${day} postpartum`,
      contextLine: `You're on Day ${day} of your 42-day postpartum recovery.`,
    };
  }

  const week = profile.week ?? 1;
  const trimester = profile.trimester ?? (week >= 28 ? 3 : week >= 14 ? 2 : 1);
  const trimesterWord =
    trimester === 1 ? "1st" : trimester === 2 ? "2nd" : "3rd";
  return {
    label: `Week ${week} (${trimesterWord} trimester)`,
    contextLine: `You're currently at Week ${week}, in your ${trimesterWord} trimester.`,
  };
}

// Calls Groq's OpenAI-compatible chat completions endpoint.
// Returns the reply text, or null if no GROQ_API_KEY is configured.
async function callGroq(
  systemPrompt: string,
  userMessage: string,
): Promise<string | null> {
  if (!GROQ_API_KEY) return null;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "MedSophia Maa42 Backend" });
});

// Sophia AI Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, profile } = req.body as {
      message?: string;
      history?: unknown;
      profile?: UserStageProfile;
    };
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const stage = describeStage(profile);
    const name = profile?.name ? ` ${profile.name}` : "";

    const systemInstruction = `You are Sophia, an empathetic, supportive, clinical AI maternal companion for MedSophia Maa42.
The user${name} is currently at ${stage.label}${
      profile?.isPostpartum
        ? ", in their 42-day golden postpartum recovery (Maa42)"
        : ""
    }.
Your tone is deeply compassionate, clinically sound, reassuring, and gentle.
When answering:
1. Provide a warm, empathetic validation of how they are feeling.
2. Provide concise clinical context for exactly this stage (${stage.label}) — do not describe a different week, trimester, or postpartum day than the one given.
3. If relevant, classify the triage status: Low Risk / Routine Monitoring, Moderate, or Immediate Clinical Attention.
4. Give 2-3 clear, actionable comfort steps or relief tips appropriate to this stage.
5. Remind them gently that you provide supportive guidance, and to consult their lead OB-GYN (Dr. Ananya Sharma) for any sudden or severe changes.
Keep responses concise, beautifully structured, and avoid medical jargon without explanation.`;

    try {
      const replyText = await callGroq(
        systemInstruction,
        `User Question: ${message}\nContext: ${stage.contextLine}`,
      );
      if (replyText) {
        return res.json({ reply: replyText });
      }
    } catch (groqErr) {
      console.error("Groq API error, falling back to canned reply:", groqErr);
    }

    // Fallback replies used if GROQ_API_KEY is not configured or the call
    // failed. These now branch on the user's actual stage instead of
    // assuming Week 24.
    const lower = message.toLowerCase();
    const opener = `Hello${name}! It is completely understandable to check on this. ${stage.contextLine}`;
    let reply = `${opener} Every day brings its own changes, and it's great that you're staying tuned in to how you feel.`;

    if (
      lower.includes("pressure") ||
      lower.includes("pelvic") ||
      lower.includes("cramp")
    ) {
      reply = profile?.isPostpartum
        ? `${opener} Mild cramping or pelvic pressure this early in recovery is often your uterus contracting back down (afterpains) — this is normal, especially while breastfeeding.

**Triage Status**: Low Risk / Routine Monitoring (No red flags detected. Rest recommended).

**Step-by-Step Relief Guide**:
1. **Warmth**: A warm compress on your lower abdomen can ease afterpain cramping.
2. **Empty your bladder regularly**: A full bladder can worsen cramping and slow uterine recovery.
3. **Rest lying down**: Lying flat for a while can reduce pelvic pressure between feeds.`
        : `${opener} Pelvic pressure at this stage is often caused by the growing uterus and shifting ligaments (like round ligaments). Let's make sure you're safe and comfortable.

**Triage Status**: Low Risk / Routine Monitoring (No red flags detected. Rest recommended).

**Step-by-Step Relief Guide**:
1. **Change Positions**: Lie down on your left side to improve blood flow to the uterus and relieve pelvic load.
2. **Hydrate**: Drink a large glass of water. Dehydration can sometimes trigger mild uterine irritability.
3. **Support Belt**: Consider wearing a maternity support band if you're planning to be on your feet today.`;
    } else if (
      lower.includes("doctor") ||
      lower.includes("call") ||
      lower.includes("emergency") ||
      lower.includes("sos")
    ) {
      reply = `You should call Dr. Sharma or your on-call triage immediately if you experience:
${
  profile?.isPostpartum
    ? `• Heavy bleeding (soaking a pad in an hour) or large clots
• Fever over 100.4°F (38°C)
• Severe headache with visual disturbances
• Redness, warmth, or discharge from a C-section incision or perineal tear
• Thoughts of harming yourself or your baby`
    : `• Regular, painful contractions (more than 4-5 in an hour before 37 weeks)
• Any vaginal bleeding or fluid leakage
• Severe headache with visual disturbances (spots or blurry vision)
• Sudden severe swelling in face, hands, or feet
• Marked decrease in your baby's regular movement pattern`
}

You can use the **SOS Escalation** button at the top or in the Care Circle tab anytime for one-touch access to the 24/7 ${profile?.isPostpartum ? "postpartum" : "OB"} triage hotline.`;
    } else if (
      lower.includes("sleep") ||
      lower.includes("tired") ||
      lower.includes("rest")
    ) {
      reply = profile?.isPostpartum
        ? `${opener} Exhaustion is one of the most common things new mothers feel — your body is healing and adjusting to broken sleep from feeds.
Try to sleep whenever the baby sleeps rather than using that time for chores, and don't hesitate to hand off a feed to a partner or family member when you can.
Try our **Fourth Trimester Sleep & Nervous System Calm** audio guide in the Tracker tab before resting.`
        : `${opener} Sleep changes are very normal at this stage. Sleeping on your left side with a supportive pillow between your knees and under your bump can reduce vena cava compression and ease hip tension.
Try our **Fourth Trimester Sleep & Nervous System Calm** audio guide in the Tracker tab before bedtime.`;
    } else if (lower.includes("kick") || lower.includes("movement")) {
      reply = profile?.isPostpartum
        ? `${opener} Kick counting is a pregnancy-tracking feature, so it won't apply during postpartum recovery — but if you'd like, I can help you log feeding or mood patterns instead from your dashboard.`
        : `${opener} Baby's kicks and turns become more noticeable as pregnancy progresses. You can use our Quick Log **Kick Count** feature on your dashboard.
Most healthcare providers recommend noting when baby is typically active (often after meals or when you lie down to rest).`;
    } else {
      reply = profile?.isPostpartum
        ? `${opener} Your body is doing remarkable work recovering right now. Focus on hydration, gentle movement when you feel ready, and accepting help where you can get it.
If you'd like me to log any symptoms for Dr. Sharma's upcoming visit, just let me know!`
        : `${opener} Both you and your baby are reaching wonderful milestones at this stage.
Remember to stay well hydrated (6 to 8 glasses daily), take gentle postural breaks, and listen to your body. If you'd like me to log any symptoms for Dr. Sharma's upcoming visit, just let me know!`;
    }

    return res.json({ reply });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error?.message || "Unknown error",
    });
  }
});

// Telehealth Clinical Summary Generator API
app.post("/api/clinical-summary", async (req, res) => {
  try {
    const { bp, weightChange, symptoms, week, isPostpartum, postpartumDay } =
      req.body;

    const stageLabel = isPostpartum
      ? `Day ${postpartumDay ?? 1} postpartum`
      : `Week ${week || 1}`;

    // No invented defaults: if the patient hasn't logged vitals yet, say so
    // honestly rather than fabricating a BP/weight reading that never
    // happened. The frontend already disables this call until vitals exist,
    // but this endpoint may be hit directly too, so it stays defensive.
    if (!bp && !weightChange && !symptoms) {
      return res.json({
        summary:
          "No vitals logged yet for this period. Log blood pressure, weight change, and any symptoms from the Care Circle tab, then regenerate.",
        updatedAt: "Not generated",
      });
    }

    const systemPrompt =
      "You generate concise, clean clinical summaries for OB-GYN review, formatted as bullet points for a digital telehealth dashboard. Only use the vitals/symptoms actually provided — never invent numbers that weren't given.";
    const prompt = `Generate a concise clinical summary for OB-GYN review for a patient at ${stageLabel}.
BP: ${bp || "not logged"}
Weight change: ${weightChange || "not logged"}
Recent symptoms: ${symptoms || "none reported"}
Only include a bullet for a field if it was actually provided above — omit bullets for fields marked "not logged" or "none reported" rather than inventing a value.
Format as clean bullet points suitable for a digital telehealth dashboard.`;

    try {
      const summaryText = await callGroq(systemPrompt, prompt);
      if (summaryText) {
        return res.json({
          summary: summaryText,
          updatedAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    } catch (groqErr) {
      console.error("Groq API error, falling back to canned summary:", groqErr);
    }

    // Fallback (Groq unavailable) — reflects only what was actually logged.
    const fallbackLines = [
      bp ? `• BP: ${bp}` : null,
      weightChange ? `• Weight change: ${weightChange}` : null,
      symptoms ? `• Symptoms (${stageLabel}): ${symptoms}` : null,
    ].filter(Boolean);

    return res.json({
      summary: fallbackLines.join("\n"),
      updatedAt: "Just now",
    });
  } catch (err: any) {
    console.error("Error generating clinical summary:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// ---------------------------------------------------------------------------
// MaterniBot device proxy
// ---------------------------------------------------------------------------
// These are the only routes that ever talk to the MaterniBot FastAPI backend.
// MATERNIBOT_DEVICE_SECRET lives only here, server-side — it is never sent
// to the browser. The React app calls these /api/bot/* routes with plain
// relative fetches, exactly like it already does for /api/chat.
const MATERNIBOT_API_URL =
  process.env.MATERNIBOT_API_URL || "http://localhost:8000";
const MATERNIBOT_DEVICE_SECRET = process.env.MATERNIBOT_DEVICE_SECRET || "";

// Wraps fetch with the secret header and a timeout. Render's free tier
// spins MaterniBot down after ~15 minutes idle, and waking it back up can
// take 15-30+ seconds — so this needs to be generous enough that the FIRST
// request after a cold start has a real chance to succeed, not just fail
// fast. 6s was too short and caused every route to abort mid-wake-up.
async function callBot(
  path: string,
  init: RequestInit = {},
  timeoutMs = 20000,
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${MATERNIBOT_API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        secret: MATERNIBOT_DEVICE_SECRET,
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const detail = (data && data.detail) || res.statusText;
      throw new Error(`MaterniBot backend error (${res.status}): ${detail}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// Lightweight online/offline check — always returns 200 so the dashboard
// can render a status banner instead of treating "bot is off" as a crash.
app.get("/api/bot/status", async (_req, res) => {
  try {
    await callBot("/health", { method: "GET" }, 20000);
    res.json({ online: true });
  } catch (err: any) {
    res.json({ online: false, error: err?.message || "Bot unreachable" });
  }
});

app.get("/api/bot/profile", async (_req, res) => {
  try {
    res.json(await callBot("/profile", { method: "GET" }));
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.post("/api/bot/profile", async (req, res) => {
  try {
    const { due_date, preferred_lang } = req.body as {
      due_date?: string;
      preferred_lang?: string;
    };
    if (!due_date) {
      return res.status(400).json({ error: "due_date is required" });
    }
    const data = await callBot("/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        due_date,
        preferred_lang: preferred_lang || "en",
      }),
    });
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.get("/api/bot/sensors/latest", async (_req, res) => {
  try {
    res.json(await callBot("/sensors/latest", { method: "GET" }));
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.get("/api/bot/sensors/history", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await callBot(
      `/sensors/history?limit=${encodeURIComponent(limit)}`,
      { method: "GET" },
    );
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.get("/api/bot/reminders", async (_req, res) => {
  try {
    res.json(await callBot("/reminders/active", { method: "GET" }));
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.post("/api/bot/reminders", async (req, res) => {
  try {
    const data = await callBot("/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.patch("/api/bot/reminders/:id/deactivate", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    if (!category) {
      return res
        .status(400)
        .json({ error: "category query param is required" });
    }
    const data = await callBot(
      `/reminders/${encodeURIComponent(req.params.id)}/deactivate?category=${encodeURIComponent(category)}`,
      { method: "PATCH" },
    );
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.get("/api/bot/symptoms", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await callBot(`/symptoms?limit=${encodeURIComponent(limit)}`, {
      method: "GET",
    });
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

app.post("/api/bot/symptoms", async (req, res) => {
  try {
    const data = await callBot("/symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "Bot unreachable" });
  }
});

// ---------------------------------------------------------------------------
// MaterniBot keep-alive
// ---------------------------------------------------------------------------
// Render's free tier spins a service down after ~15 minutes with no
// incoming requests. A ping every 10 minutes is enough to keep MaterniBot
// from ever going idle long enough to fully spin down during normal usage
// hours, which is the other half of fixing the cold-start 502s alongside
// the wider callBot() timeout above. This does NOT guarantee MaterniBot is
// never asleep (e.g. right after a deploy, or if Render restarts it for
// other reasons) — the timeout increase is what covers that remaining case.
//
// Skipped when MATERNIBOT_API_URL still points at localhost (local dev),
// since there's nothing on Render to keep awake in that case.
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function startMaterniBotKeepAlive() {
  if (MATERNIBOT_API_URL.includes("localhost")) return;

  const ping = async () => {
    try {
      await callBot("/health", { method: "GET" }, 20000);
      console.log("MaterniBot keep-alive ping: ok");
    } catch (err: any) {
      // Expected occasionally (deploys, genuine outages) — logged but never
      // fatal, and never affects the medsophia-maa42 server's own health.
      console.warn("MaterniBot keep-alive ping failed:", err?.message || err);
    }
  };

  ping(); // once immediately on boot, then on the interval
  setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
}

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedSophia Maa42 server running on port ${PORT}`);
  });

  startMaterniBotKeepAlive();
}
console.log(
  "GROQ_API_KEY loaded:",
  GROQ_API_KEY ? `${GROQ_API_KEY.slice(0, 6)}...` : "MISSING",
);
console.log(
  "MaterniBot backend:",
  MATERNIBOT_API_URL,
  "| secret set:",
  MATERNIBOT_DEVICE_SECRET
    ? "yes"
    : "no (set MATERNIBOT_DEVICE_SECRET in .env)",
);
startServer();
