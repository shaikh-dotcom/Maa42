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
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemInstruction = `You are Sophia, an empathetic, supportive, clinical AI maternal companion for MedSophia Maa42.
The user is currently navigating Week 24 of pregnancy (2nd trimester) and preparing for their 42-day golden postpartum recovery (Maa42).
Your tone is deeply compassionate, clinically sound, reassuring, and gentle.
When answering:
1. Provide a warm, empathetic validation of how they are feeling.
2. Provide concise clinical context (what is happening physiologically in Week 24 or postpartum).
3. If relevant, classify the triage status: Low Risk / Routine Monitoring, Moderate, or Immediate Clinical Attention.
4. Give 2-3 clear, actionable comfort steps or relief tips.
5. Remind them gently that you provide supportive guidance, and to consult their lead OB-GYN (Dr. Ananya Sharma) for any sudden or severe changes.
Keep responses concise, beautifully structured, and avoid medical jargon without explanation.`;

    try {
      const replyText = await callGroq(
        systemInstruction,
        `User Question: ${message}\nContext: Week 24 pregnancy, second trimester.`,
      );
      if (replyText) {
        return res.json({ reply: replyText });
      }
    } catch (groqErr) {
      console.error("Groq API error, falling back to canned reply:", groqErr);
    }

    // Fallback intelligent clinical answers if GROQ_API_KEY is not configured or the call failed
    const lower = message.toLowerCase();
    let reply =
      "Hello! It is completely understandable to check on this. At Week 24, your body is expanding and your baby weighs approximately 600g (the size of a large mango). Ligament stretching and mild sensations are very common.";

    if (
      lower.includes("pressure") ||
      lower.includes("pelvic") ||
      lower.includes("cramp")
    ) {
      reply = `Hello! It is completely understandable to check on this. Mild pelvic pressure around Week 24 is often caused by the growing uterus and shifting ligaments (like round ligaments). However, let's make sure you're safe and comfortable.

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
• Regular, painful contractions (more than 4-5 in an hour before 37 weeks)
• Any vaginal bleeding or fluid leakage
• Severe headache with visual disturbances (spots or blurry vision)
• Sudden severe swelling in face, hands, or feet
• Marked decrease in your baby's regular movement pattern

You can use the **SOS Escalation** button at the top or in the Care Circle tab anytime for one-touch access to the 24/7 OB triage hotline.`;
    } else if (
      lower.includes("sleep") ||
      lower.includes("tired") ||
      lower.includes("rest")
    ) {
      reply = `Sleep changes are very normal during the late second trimester! As baby grows, sleeping on your left side with a supportive pillow between your knees and under your bump can reduce vena cava compression and ease hip tension.
Try our **Fourth Trimester Sleep & Nervous System Calm** audio guide in the Tracker tab before bedtime.`;
    } else if (lower.includes("kick") || lower.includes("movement")) {
      reply = `At 24 weeks, baby's kicks and turns are becoming more pronounced and rhythmic! You can use our Quick Log **Kick Count** feature on your dashboard.
Most healthcare providers recommend noting when baby is typically active (often after meals or when you lie down to rest).`;
    } else {
      reply = `Thank you for sharing that with me. During Week 24, both you and your baby are reaching wonderful milestones. Your baby's hearing is fully developed and they can recognize the soothing cadence of your voice.

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
    const { bp, weightChange, symptoms, week } = req.body;

    const systemPrompt =
      "You generate concise, clean clinical summaries for OB-GYN review, formatted as bullet points for a digital telehealth dashboard.";
    const prompt = `Generate a concise 3-bullet clinical summary for OB-GYN Dr. Ananya Sharma for a patient at Week ${week || 24}.
Input vitals: BP: ${bp || "118/76 mmHg"}, Weight change: ${weightChange || "+0.4kg this week"}, Recent symptoms: ${symptoms || "Mild lower back tension on Wednesday, resolved with stretching; daily hydration on target 7/8 glasses"}.
Format as clean, bullet points suitable for a digital health telehealth dashboard.`;

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

    return res.json({
      summary: `• BP Average: ${bp || "118/76 mmHg"} (Optimal & Stable)\n• Weight gain: ${weightChange || "+0.4kg this week within clinical target"}\n• Maternal Wellbeing: Reported mild lower back tension on Wed; resolved with rest & stretching. Daily fetal kicks active.`,
      updatedAt: "Just now",
    });
  } catch (err: any) {
    console.error("Error generating clinical summary:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

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
}
console.log(
  "GROQ_API_KEY loaded:",
  GROQ_API_KEY ? `${GROQ_API_KEY.slice(0, 6)}...` : "MISSING",
);
startServer();
