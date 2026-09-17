import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, X, UserPlus, Clock, MessageSquare } from "lucide-react";
import { useFriends, SearchResult } from "../hooks/useFriends";

interface FindPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (otherUid: string, otherName: string) => void;
}

export const FindPeopleModal: React.FC<FindPeopleModalProps> = ({
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const {
    searchPeople,
    sendFriendRequest,
    cancelFriendRequest,
    outgoingRequests,
  } = useFriends();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [justSent, setJustSent] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const runSearch = async (value: string) => {
    setTerm(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const found = await searchPeople(value);
      setResults(found.filter((r) => r.relation !== "blocked"));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (r: SearchResult) => {
    setJustSent((prev) => new Set(prev).add(r.uid));
    await sendFriendRequest(r.uid, r.name);
  };

  const handleCancel = async (r: SearchResult) => {
    const req = outgoingRequests.find((o) => o.toUid === r.uid);
    if (req) await cancelFriendRequest(req.id);
    setJustSent((prev) => {
      const next = new Set(prev);
      next.delete(r.uid);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-surface-container relative animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-on-surface mb-1">
          Find Others
        </h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Search by exact name or Maa42 ID, or type a few letters to browse
          close matches.
        </p>

        <div className="relative flex items-center mb-4 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 text-outline pointer-events-none" />
          <input
            value={term}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search by name or Maa42 ID..."
            className="w-full bg-surface-container-low pl-10 pr-4 py-3 rounded-xl text-sm text-on-surface placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-primary border border-surface-container"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {loading && (
            <p className="text-xs text-on-surface-variant text-center py-4">
              Searching...
            </p>
          )}
          {!loading && term.trim() && results.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-4">
              No one found matching &ldquo;{term}&rdquo;.
            </p>
          )}
          {results.map((r) => (
            <motion.div
              key={r.uid}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-container"
            >
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                {r.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">
                  {r.name}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {r.maa42Id}
                </p>
              </div>

              {r.relation === "friend" && (
                <button
                  onClick={() => onOpenChat(r.uid, r.name)}
                  className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                  title="Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}

              {r.relation === "pending_incoming" && (
                <span className="text-[11px] font-semibold text-secondary bg-secondary-container px-2.5 py-1.5 rounded-full shrink-0 text-center">
                  Check Notifications
                </span>
              )}

              {r.relation === "none" && !justSent.has(r.uid) && (
                <button
                  onClick={() => handleAdd(r)}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-on-primary px-3 py-1.5 rounded-full shrink-0 hover:opacity-90 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}

              {(r.relation === "pending_outgoing" || justSent.has(r.uid)) && (
                <button
                  onClick={() => handleCancel(r)}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-full shrink-0 hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer"
                  title="Cancel request"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Requested</span>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
