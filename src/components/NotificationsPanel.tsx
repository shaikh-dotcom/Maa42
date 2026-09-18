import React, { useState } from "react";
import { motion } from "motion/react";
import { X, UserPlus, MessageSquare, Heart, Check, Trash2 } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useFriends } from "../hooks/useFriends";
import { useAuthUid } from "../hooks/useAuthUid";
import { AppNotification } from "../types";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (
    conversationId: string,
    otherUid: string,
    otherName: string,
  ) => void;
}

function timeAgo(ts: any): string {
  if (!ts?.toDate) return "";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();
  const { acceptFriendRequestById, declineFriendRequest } = useFriends();
  const myUid = useAuthUid();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Request ids are deterministic (`${fromUid}__${toUid}`), so older
  // notifications without a stored requestId can still be resolved.
  const requestIdFor = (n: AppNotification): string | null =>
    n.requestId ?? (myUid ? `${n.fromUid}__${myUid}` : null);

  const handleClick = (n: AppNotification) => {
    if (!n.read) markAsRead(n.id).catch(() => {});
    if (n.type === "message" && n.conversationId) {
      onOpenChat(n.conversationId, n.fromUid, n.fromName);
      onClose();
    }
  };

  const handleAccept = async (n: AppNotification) => {
    const requestId = requestIdFor(n);
    if (!requestId || busyId) return;
    setBusyId(n.id);
    setActionError(null);
    try {
      // Returns false if the request was cancelled/handled already; either
      // way the notification is stale afterwards, so remove it.
      await acceptFriendRequestById(requestId);
      await clearNotification(n.id);
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      setActionError("Couldn't accept the request. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (n: AppNotification) => {
    const requestId = requestIdFor(n);
    if (!requestId || busyId) return;
    setBusyId(n.id);
    setActionError(null);
    try {
      try {
        await declineFriendRequest(requestId);
      } catch {
        // Request already gone (cancelled/handled) - nothing to decline.
      }
      await clearNotification(n.id);
    } catch (err) {
      console.error("Failed to decline friend request:", err);
      setActionError("Couldn't decline the request. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (n: AppNotification) => {
    clearNotification(n.id).catch((err) => {
      console.error("Failed to delete notification:", err);
      setActionError("Couldn't delete the notification.");
    });
  };

  const handleClearAll = () => {
    clearAllNotifications().catch((err) => {
      console.error("Failed to clear notifications:", err);
      setActionError("Couldn't clear notifications.");
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/30 flex items-start justify-end p-4 pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl shadow-2xl border border-surface-container w-full max-w-sm max-h-[75vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-container shrink-0">
          <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => markAllAsRead().catch(() => {})}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Mark all read
            </button>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-error hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {actionError && (
          <p className="text-[11px] text-error text-center py-2 px-4 border-b border-surface-container shrink-0">
            {actionError}
          </p>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-surface-container">
          {isLoading && (
            <p className="text-xs text-on-surface-variant text-center py-8">
              Loading notifications...
            </p>
          )}

          {!isLoading && error && (
            <p className="text-xs text-error text-center py-8 px-6">{error}</p>
          )}

          {!isLoading && !error && notifications.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-8">
              No notifications yet.
            </p>
          )}

          {!isLoading &&
            !error &&
            notifications.map((n) => {
              const icon =
                n.type === "friend_request" ? (
                  <UserPlus className="w-4 h-4" />
                ) : n.type === "friend_accept" ? (
                  <Heart className="w-4 h-4 fill-current" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                );

              const isBusy = busyId === n.id;

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-surface-container-low ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface leading-relaxed">
                      <span className="font-bold">{n.fromName}</span>
                      {n.type === "friend_request" &&
                        " sent you a friend request."}
                      {n.type === "friend_accept" &&
                        " accepted your friend request."}
                      {n.type === "message" && `: ${n.preview}`}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {timeAgo(n.createdAt)}
                    </p>

                    {n.type === "friend_request" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(n);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-on-primary px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>{isBusy ? "Working..." : "Accept"}</span>
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecline(n);
                          }}
                          className="text-[11px] font-semibold bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n);
                    }}
                    aria-label="Delete notification"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-error cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
        </div>
      </motion.div>
    </div>
  );
};
