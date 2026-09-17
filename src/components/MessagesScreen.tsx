import React from "react";
import { motion } from "motion/react";
import { MessageSquare, UserPlus } from "lucide-react";
import { useFriends } from "../hooks/useFriends";
import { useConversations } from "../hooks/useMessages";

interface MessagesScreenProps {
  onOpenChat: (otherUid: string, otherName: string) => void;
  onFindPeople: () => void;
}

function timeAgo(ts: any): string {
  if (!ts?.toDate) return "";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onOpenChat,
  onFindPeople,
}) => {
  const { friends, blockedUids } = useFriends();
  const conversations = useConversations(blockedUids);

  const conversationUids = new Set(conversations.map((c) => c.otherUid));
  const friendsWithoutConvo = friends.filter(
    (f) => !conversationUids.has(f.uid),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-28 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-on-surface">Messages</h2>
        <button
          onClick={onFindPeople}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Find Others</span>
        </button>
      </div>

      {conversations.length === 0 && friends.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-7 h-7" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            You have no conversations yet. Find other Maa42 members to connect
            with.
          </p>
          <button
            onClick={onFindPeople}
            className="text-xs font-semibold bg-primary text-on-primary px-4 py-2 rounded-full cursor-pointer"
          >
            Find Others
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map((c) => {
          const otherName = c.participantNames?.[c.otherUid] ?? "Maa42 Member";
          const preview = c.lastMessage
            ? c.lastMessage.deleted
              ? "Message deleted"
              : c.lastMessage.text
            : "Say hello!";
          return (
            <motion.button
              key={c.id}
              whileHover={{ x: 2 }}
              onClick={() => onOpenChat(c.otherUid, otherName)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-left border border-surface-container cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                {otherName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-on-surface truncate">
                  {otherName}
                </h4>
                <p className="text-xs text-on-surface-variant truncate italic">
                  {preview}
                </p>
              </div>
              <span className="text-[10px] text-outline shrink-0">
                {timeAgo(c.updatedAt)}
              </span>
            </motion.button>
          );
        })}

        {friendsWithoutConvo.length > 0 && (
          <>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mt-4 mb-1">
              Start a Conversation
            </h3>
            {friendsWithoutConvo.map((f) => (
              <motion.button
                key={f.uid}
                whileHover={{ x: 2 }}
                onClick={() => onOpenChat(f.uid, f.name)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-left border border-surface-container cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shrink-0">
                  {f.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">
                    {f.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Tap to message
                  </p>
                </div>
              </motion.button>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};
