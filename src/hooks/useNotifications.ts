import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { AppNotification } from "../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listener whenever auth changes.
      unsubscribeNotifications?.();
      unsubscribeNotifications = null;

      if (!user) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const q = query(
        collection(db, "notifications", user.uid, "items"),
        orderBy("createdAt", "desc"),
        limit(50),
      );

      unsubscribeNotifications = onSnapshot(
        q,
        (snap) => {
          setNotifications(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any),
            })),
          );

          setError("");
          setIsLoading(false);
        },
        (err) => {
          console.error("NOTIFICATION LISTENER ERROR:", err);
          setError(err.message || "Unable to load notifications.");
          setIsLoading(false);
        },
      );
    });

    return () => {
      unsubscribeNotifications?.();
      unsubscribeAuth();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await updateDoc(doc(db, "notifications", uid, "items", id), { read: true });
  };

  const markAllAsRead = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await Promise.all(
      notifications
        .filter((n) => !n.read)
        .map((n) =>
          updateDoc(doc(db, "notifications", uid, "items", n.id), {
            read: true,
          }),
        ),
    );
  };

  const clearNotification = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await deleteDoc(doc(db, "notifications", uid, "items", id));
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}
