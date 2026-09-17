import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Send, ShieldOff, Trash2, AlertTriangle } from "lucide-react";
import { useMessages } from "../hooks/useMessages";
import { useFriends } from "../hooks/useFriends";

interface ChatModalProps {
  conversationId: string | null;
  otherUid: string;
  otherName: string;
  onClose: () => void;
  onBlocked: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  conversationId,
  otherUid,
  otherName,
  onClose,
  onBlocked,
}) => {
  const { messages, sendMessage, deleteMessageForEveryone } =
    useMessages(conversationId);
  const { blockUser } = useFriends();
  const [text, setText] = useState("");
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conversationId) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const toSend = text;
    setText("");
    await sendMessage(toSend);
  };

  const handleBlock = async () => {
    await blockUser(otherUid, otherName);
    setConfirmBlock(false);
    onBlocked();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl w-full max-w-md shadow-2xl border border-surface-container relative flex flex-col h-[80vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-container shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
              {otherName.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-sm font-bold text-on-surface truncate">
              {otherName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setConfirmBlock(true)}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-colors cursor-pointer"
              title={`Block ${otherName}`}
            >
              <ShieldOff className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {messages.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-8">
              This is the beginning of your conversation with {otherName}.
            </p>
          )}
          {messages.map((m) => {
            const isMine = m.senderId !== otherUid;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
              >
                <div className="flex items-end gap-1.5 max-w-[80%]">
                  {isMine && !m.deletedForEveryone && (
                    <button
                      onClick={() => setConfirmDeleteId(m.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error cursor-pointer shrink-0"
                      title="Delete for everyone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      m.deletedForEveryone
                        ? "bg-surface-container text-on-surface-variant italic"
                        : isMine
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface border border-surface-container"
                    }`}
                  >
                    {m.deletedForEveryone ? "This message was deleted" : m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-surface-container flex items-center gap-2 shrink-0"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${otherName.split(" ")[0]}...`}
            className="flex-1 bg-surface-container-low text-sm text-on-surface px-4 py-3 rounded-full border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 hover:bg-primary-container cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Block confirm */}
        <AnimatePresence>
          {confirmBlock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="bg-surface rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-surface-container">
                <div className="flex items-center gap-2 mb-2 text-error">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Block {otherName}?</h4>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">
                  You will no longer be friends and this whole conversation will
                  disappear for both of you. You can unblock this person later
                  from your Profile.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleBlock}
                    className="flex-1 bg-error text-on-error py-2 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => setConfirmBlock(false)}
                    className="flex-1 bg-surface-container text-on-surface-variant py-2 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete-for-everyone confirm */}
        <AnimatePresence>
          {confirmDeleteId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="bg-surface rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-surface-container">
                <h4 className="text-sm font-bold text-on-surface mb-2">
                  Delete this message?
                </h4>
                <p className="text-xs text-on-surface-variant mb-4">
                  It will be removed for everyone in this conversation. This
                  can&apos;t be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await deleteMessageForEveryone(confirmDeleteId);
                      setConfirmDeleteId(null);
                    }}
                    className="flex-1 bg-error text-on-error py-2 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 bg-surface-container text-on-surface-variant py-2 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
