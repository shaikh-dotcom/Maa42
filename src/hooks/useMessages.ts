import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { pairId } from "../utils/ids";
import { Conversation, DirectMessage } from "../types";

export interface ConversationSummary extends Conversation {
  id: string;
  otherUid: string;
}

// Live list of the current user's conversations, newest activity first.
// `blockedUids` (from useFriends) is used to filter out any conversation
// with someone who has been blocked — this is what makes a block "hide the
// conversation as if it never existed" for both sides, without needing to
// delete every message document.
export function useConversations(blockedUids: string[]): ConversationSummary[] {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const blockedKey = blockedUids.join(",");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(
      query(
        collection(db, "conversations"),
        where("participants", "array-contains", uid),
        orderBy("updatedAt", "desc"),
      ),
      (snap) => {
        const blockedSet = new Set(blockedKey ? blockedKey.split(",") : []);
        const list = snap.docs
          .map((d) => {
            const data = d.data() as Conversation;
            const otherUid = data.participants.find((p) => p !== uid) ?? "";
            return { id: d.id, ...data, otherUid };
          })
          .filter((c) => !blockedSet.has(c.otherUid));
        setConversations(list);
      },
    );
    return unsub;
  }, [blockedKey]);

  return conversations;
}

// Gets the existing conversation between me and otherUid, or creates it.
// Conversation IDs are deterministic (pairId) so this never creates dupes.
export async function openConversation(
  otherUid: string,
  otherName: string,
  myName: string,
): Promise<string> {
  const me = auth.currentUser;

  if (!me) {
    throw new Error("Not signed in");
  }

  const id = pairId(me.uid, otherUid);

  const ref = doc(db, "conversations", id);

  await setDoc(
    ref,
    {
      participants: [me.uid, otherUid],
      participantNames: {
        [me.uid]: myName,
        [otherUid]: otherName,
      },
      lastMessage: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return id;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    const unsub = onSnapshot(
      query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc"),
      ),
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      },
    );
    return unsub;
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const me = auth.currentUser;
      const trimmed = text.trim();
      if (!me || !conversationId || !trimmed) return;

      const newDoc = await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
          senderId: me.uid,
          text: trimmed,
          createdAt: serverTimestamp(),
          deletedForEveryone: false,
        },
      );

      const convoRef = doc(db, "conversations", conversationId);
      await updateDoc(convoRef, {
        lastMessage: {
          id: newDoc.id,
          text: trimmed,
          senderId: me.uid,
          deleted: false,
        },
        updatedAt: serverTimestamp(),
      });

      // Best-effort notification for the other participant — the message
      // has already been sent either way.
      try {
        const convoSnap = await getDoc(convoRef);
        const data = convoSnap.data() as Conversation | undefined;
        const otherUid = data?.participants.find((p) => p !== me.uid);
        if (otherUid) {
          await addDoc(collection(db, "notifications", otherUid, "items"), {
            type: "message",
            fromUid: me.uid,
            fromName: me.displayName || "A Maa42 member",
            conversationId,
            preview: trimmed.slice(0, 80),
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      } catch {
        /* notification is a nice-to-have */
      }
    },
    [conversationId],
  );

  // Deletes a message for everyone: the text is cleared and the message is
  // flagged so the UI can render "This message was deleted" in its place,
  // rather than removing the document (which the security rules don't
  // allow anyone but the original sender to touch anyway).
  const deleteMessageForEveryone = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      await updateDoc(
        doc(db, "conversations", conversationId, "messages", messageId),
        {
          deletedForEveryone: true,
          text: "",
        },
      );

      const convoRef = doc(db, "conversations", conversationId);
      const convoSnap = await getDoc(convoRef);
      const lastMessage = (convoSnap.data() as Conversation | undefined)
        ?.lastMessage;
      if (lastMessage?.id === messageId) {
        await updateDoc(convoRef, {
          lastMessage: { ...lastMessage, text: "", deleted: true },
        });
      }
    },
    [conversationId],
  );

  return { messages, sendMessage, deleteMessageForEveryone };
}
