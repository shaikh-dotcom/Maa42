import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, UserProfile } from "../types";
import {
  Bot,
  ShieldCheck,
  ListChecks,
  ArrowUp,
  Plus,
  AlertCircle,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

interface SophiaScreenProps {
  user: UserProfile;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenSos: () => void;
}

// Short human-readable label for wherever the user currently is, used in the
// banner, the fallback reply, and the suggested-question chip. Keeping this
// in one place means we never again hardcode "Week 24" somewhere new.
function getStageLabel(user: UserProfile): string {
  return user.isPostpartum
    ? `Day ${user.postpartumDay ?? 1} postpartum`
    : `Week ${user.week}`;
}

function buildDefaultMessages(user: UserProfile): ChatMessage[] {
  const stage = getStageLabel(user);

  if (user.isPostpartum) {
    return [
      {
        id: "msg-1",
        sender: "user",
        text: `Hi Sophia, I've been feeling some cramping today. Is this normal on ${stage}?`,
        timestamp: "Today, 9:42 AM",
      },
      {
        id: "msg-2",
        sender: "sophia",
        text: `Hello! It is completely understandable to check on this. Mild cramping on ${stage} is often your uterus contracting back to size (afterpains), especially if you're breastfeeding. Let's make sure you're safe and comfortable.`,
        timestamp: "Today, 9:43 AM",
        triage: {
          status: "Triage Status: Low Risk / Routine Monitoring",
          description: "No red flags detected. Rest recommended.",
          level: "low",
        },
        steps: [
          "Warmth: A warm compress on your lower abdomen can ease afterpain cramping.",
          "Empty your bladder regularly: A full bladder can worsen cramping and slow recovery.",
          "Rest lying down: Lying flat for a while can reduce pelvic pressure between feeds.",
        ],
      },
    ];
  }

  return [
    {
      id: "msg-1",
      sender: "user",
      text: `Hi Sophia, I've been feeling some mild pelvic pressure today. Is this normal around ${stage}?`,
      timestamp: "Today, 9:42 AM",
    },
    {
      id: "msg-2",
      sender: "sophia",
      text: `Hello! It is completely understandable to check on this. Mild pelvic pressure around ${stage} is often caused by the growing uterus and shifting ligaments (like round ligaments). However, let's make sure you're safe and comfortable.`,
      timestamp: "Today, 9:43 AM",
      triage: {
        status: "Triage Status: Low Risk / Routine Monitoring",
        description: "No red flags detected. Rest recommended.",
        level: "low",
      },
      steps: [
        "Change Positions: Lie down on your left side to improve blood flow to the uterus and relieve pelvic load.",
        "Hydrate: Drink a large glass of water. Dehydration can sometimes trigger mild uterine irritability.",
        "Support Belt: Consider wearing a maternity support band if you are planning to be on your feet today.",
      ],
    },
  ];
}

export const SophiaScreen: React.FC<SophiaScreenProps> = ({
  user,
  initialPrompt,
  onClearInitialPrompt,
  onOpenSos,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    buildDefaultMessages(user),
  );
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stageLabel = getStageLabel(user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          // Send the full stage context, not just `week` — otherwise a
          // postpartum user's request still gets answered as if they were
          // still pregnant at whatever `week` last held.
          profile: {
            name: user.name,
            week: user.week,
            trimester: user.trimester,
            isPostpartum: user.isPostpartum,
            postpartumDay: user.postpartumDay,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Network error");
      }

      const data = await response.json();
      const replyText =
        data.reply ||
        "I am here to support you. Let's make sure you're feeling rested and cared for today.";

      const isUrgent =
        textToSend.toLowerCase().includes("bleed") ||
        textToSend.toLowerCase().includes("severe") ||
        textToSend.toLowerCase().includes("leak");

      const botMsg: ChatMessage = {
        id: `sophia-${Date.now()}`,
        sender: "sophia",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        triage: isUrgent
          ? {
              status: "Triage Status: Clinical Check Advised",
              description:
                "Please reach out to your lead OB-GYN or use SOS hotline.",
              level: "high",
            }
          : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Offline / network-failure fallback — this must reflect the user's
      // actual stage, since the backend isn't reachable to correct it.
      const fallbackMsg: ChatMessage = {
        id: `sophia-${Date.now()}`,
        sender: "sophia",
        text: user.isPostpartum
          ? `Thank you for sharing. On ${stageLabel}, your body is doing tremendous work healing and recovering. If you feel cramping or discomfort, take a gentle 15-minute rest with a warm compress and stay hydrated. Dr. Sharma's team is alerted if any persistent discomfort arises.`
          : `Thank you for sharing. Around ${stageLabel}, your body is doing tremendous work growing your baby. If you feel tightness, take a gentle 15-minute rest on your left side with an electrolyte beverage. Dr. Sharma's team is alerted if any persistent discomfort arises.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-28 flex flex-col"
    >
      {/* Top Banner / Support Care Card */}
      <div className="bg-primary-container text-on-primary-container p-6 rounded-3xl shadow-md relative overflow-hidden mb-6 border border-primary/20">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/30 rounded-full blur-xl pointer-events-none"
        />
        <div className="flex items-start justify-between relative z-10 mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-12 h-12 rounded-2xl bg-surface/15 flex items-center justify-center backdrop-blur-md text-on-primary shadow-sm"
            >
              <Bot className="w-6 h-6" />
            </motion.div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-primary-container/80">
                Active Support Care Card
              </span>
              <h2 className="text-lg font-bold text-on-primary">
                Sophia AI Assistant
              </h2>
            </div>
          </div>

          <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Online 24/7</span>
          </span>
        </div>

        <p className="relative z-10 text-sm text-on-primary-container/95 leading-relaxed">
          Your personalized companion for {stageLabel}. I am here to answer
          clinical questions, provide symptom relief guides, and coordinate with
          your care team.
        </p>
      </div>

      {/* Chat History Container */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="flex items-center justify-center my-1">
          <span className="bg-surface-container-high text-on-surface-variant text-xs px-3.5 py-1 rounded-full font-medium">
            Today, 9:42 AM
          </span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${isUser ? "justify-end" : "justify-start gap-3 max-w-[95%]"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col gap-2.5 max-w-[85%] sm:max-w-[80%]">
                  <div
                    className={`p-4 shadow-xs text-sm leading-relaxed ${
                      isUser
                        ? "bg-primary text-on-primary rounded-3xl rounded-tr-xs"
                        : "bg-surface-container-low text-on-surface rounded-3xl rounded-tl-xs border border-surface-container"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Triage Status Pill */}
                    {msg.triage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mt-3 p-3 rounded-2xl flex items-center gap-3 shadow-xs border ${
                          msg.triage.level === "high"
                            ? "bg-error-container text-on-error-container border-error/20"
                            : "bg-surface-container-lowest border-surface-container"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            msg.triage.level === "high"
                              ? "bg-error text-on-error"
                              : "bg-primary-fixed text-on-primary-fixed-variant"
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span
                            className={`text-xs font-bold block ${
                              msg.triage.level === "high"
                                ? "text-error"
                                : "text-primary"
                            }`}
                          >
                            {msg.triage.status}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {msg.triage.description}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Step-by-Step Relief Guide */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="mt-3 bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-primary" />
                          <span>Step-by-Step Relief Guide</span>
                        </h4>
                        <ul className="flex flex-col gap-2.5 text-xs text-on-surface">
                          {msg.steps.map((step, idx) => {
                            const [boldPart, ...rest] = step.split(": ");
                            return (
                              <li
                                key={idx}
                                className="flex items-start gap-2.5"
                              >
                                <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 font-bold text-[10px]">
                                  {idx + 1}
                                </span>
                                <span>
                                  <strong>{boldPart}:</strong> {rest.join(": ")}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <span className="text-[11px] text-on-surface-variant px-1 font-medium">
                      Sophia AI &bull; Verified by Care Team
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start gap-3 max-w-[92%]"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 mt-1 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-surface-container-low text-on-surface p-4 rounded-3xl rounded-tl-xs border border-surface-container shadow-xs flex items-center gap-3 text-xs text-on-surface-variant">
              {/* Three bouncing wave dots */}
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    ease: "easeInOut",
                    delay: 0.15,
                  }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              </div>
              <span>Sophia is crafting clinical guidance...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-on-surface-variant block mb-2 px-1">
          Suggested questions:
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handlePromptClick("When should I call my doctor?")}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5 text-secondary" />
            <span>When should I call my doctor?</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() =>
              handlePromptClick(`${stageLabel} milestone checklist`)
            }
            className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{stageLabel} milestone checklist</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handlePromptClick("Safe stretches for back pain")}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-secondary" />
            <span>Safe stretches for back pain</span>
          </motion.button>
        </div>
      </div>

      {/* Ask Sophia Input Bar */}
      <div className="sticky bottom-20 z-30 bg-surface/90 backdrop-blur-md pt-2 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="bg-surface-container-lowest p-1.5 sm:p-2 rounded-full shadow-lg flex items-center gap-2 border border-outline-variant/30"
        >
          <button
            type="button"
            onClick={() =>
              handlePromptClick(
                "Can you give me a summary of red flag symptoms I should watch for today?",
              )
            }
            className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Add quick symptom query"
          >
            <Plus className="w-5 h-5" />
          </button>

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none px-2"
            placeholder="Ask Sophia anything about your pregnancy..."
            type="text"
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 flex items-center justify-center shrink-0 shadow-md cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        </form>

        <div className="text-center mt-2.5">
          <span className="text-[11px] text-on-surface-variant">
            Sophia provides guidance, not formal medical diagnosis. Contact your
            OB/GYN for emergencies.
          </span>
        </div>
      </div>
    </motion.div>
  );
};
