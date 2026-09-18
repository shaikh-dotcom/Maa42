import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { AppNotification } from "../types";
import { useAuthUid } from "./useAuthUid";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uid = useAuthUid();

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const unsub = onSnapshot(
      query(
        collection(db, "notifications", uid, "items"),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      (snap) => {
        setNotifications(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        );
        setIsLoading(false);
      },
      (err) => {
        console.error("useNotifications: listener failed", err);
        setNotifications([]);
        setError("Unable to load notifications right now.");
        setIsLoading(false);
      },
    );
    return unsub;
  }, [uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const itemRef = (id: string) => doc(db, "notifications", uid!, "items", id);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!uid) return;
      const batch = writeBatch(db);
      batch.update(itemRef(id), { read: true });
      await batch.commit();
    },
    [uid],
  );

  const markAllAsRead = useCallback(async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(itemRef(n.id), { read: true }));
    await batch.commit();
  }, [uid, notifications]);

  // Delete one notification.
  const clearNotification = useCallback(
    async (id: string) => {
      if (!uid) return;
      const batch = writeBatch(db);
      batch.delete(itemRef(id));
      await batch.commit();
    },
    [uid],
  );

  // Delete every notification currently loaded (up to 50).
  const clearAllNotifications = useCallback(async () => {
    if (!uid || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => batch.delete(itemRef(n.id)));
    await batch.commit();
  }, [uid, notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}
