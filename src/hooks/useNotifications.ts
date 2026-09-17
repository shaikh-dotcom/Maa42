import { useEffect, useState } from "react";
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

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
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
      },
    );
    return unsub;
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
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}
