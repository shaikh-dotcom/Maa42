import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { pairId } from "../utils/ids";
import { FriendRequest, PublicProfile } from "../types";

export interface FriendEntry {
  uid: string;
  name: string;
}

export type Relation =
  | "friend"
  | "pending_outgoing"
  | "pending_incoming"
  | "blocked"
  | "none";

export interface SearchResult extends PublicProfile {
  relation: Relation;
}

// How many profiles we're willing to scan client-side for the fuzzy
// fallback below. Fine for a small/medium user base; a large one would
// need a dedicated search service (Algolia/Typesense) instead.
const MAX_FUZZY_CANDIDATES = 200;

// Classic edit-distance calculation, used to tolerate small typos in the
// fuzzy fallback (e.g. "Ayehsa" should still find "Ayesha").
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// A name counts as a "close" match to the typed term if the term appears
// anywhere in it (catches mid-name substrings a prefix query would miss),
// or if any single word in the name is within a small edit distance of the
// term (catches typos).
function isCloseNameMatch(nameLower: string, term: string): boolean {
  if (nameLower.includes(term)) return true;
  const maxDistance = term.length <= 3 ? 1 : 2;
  return nameLower
    .split(/\s+/)
    .some((word) => levenshtein(word, term) <= maxDistance);
}

// Friends, incoming/outgoing friend requests, and blocks, all kept live via
// onSnapshot so badges/buttons across the app stay in sync without manual
// refetching.
//
// Search combines four Firestore-native queries — exact name, exact ID,
// "starts with" prefix, and "any word in the name" — with a bounded,
// client-side fuzzy fallback (substring + edit-distance) so typos and
// mid-name matches ("close related names") still surface results, since
// Firestore has no native fuzzy/substring search.
export function useFriends() {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [blocked, setBlocked] = useState<FriendEntry[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubFriendships = onSnapshot(
      query(
        collection(db, "friendships"),
        where("participants", "array-contains", uid),
      ),
      (snap) => {
        const list: FriendEntry[] = snap.docs.map((d) => {
          const data = d.data() as {
            participants: string[];
            participantNames?: Record<string, string>;
          };
          const otherUid = data.participants.find((p) => p !== uid) ?? "";
          return {
            uid: otherUid,
            name: data.participantNames?.[otherUid] ?? "Care Circle Member",
          };
        });
        setFriends(list);
      },
    );

    const unsubIncoming = onSnapshot(
      query(
        collection(db, "friendRequests"),
        where("toUid", "==", uid),
        where("status", "==", "pending"),
      ),
      (snap) => {
        setIncomingRequests(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        );
      },
    );

    const unsubOutgoing = onSnapshot(
      query(
        collection(db, "friendRequests"),
        where("fromUid", "==", uid),
        where("status", "==", "pending"),
      ),
      (snap) => {
        setOutgoingRequests(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        );
      },
    );

    const unsubBlocked = onSnapshot(
      query(collection(db, "blocks"), where("blockerUid", "==", uid)),
      (snap) => {
        setBlocked(
          snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              uid: data.blockedUid as string,
              name: (data.blockedName as string) || "Blocked member",
            };
          }),
        );
      },
    );

    return () => {
      unsubFriendships();
      unsubIncoming();
      unsubOutgoing();
      unsubBlocked();
    };
  }, []);

  const blockedUids = blocked.map((b) => b.uid);

  const searchPeople = useCallback(
    async (term: string): Promise<SearchResult[]> => {
      const uid = auth.currentUser?.uid;
      const trimmed = term.trim();
      if (!uid || !trimmed) return [];
      const lower = trimmed.toLowerCase();

      const results = new Map<string, PublicProfile>();

      const [exactNameSnap, exactIdSnap, prefixSnap, tokenSnap] =
        await Promise.all([
          getDocs(
            query(
              collection(db, "publicProfiles"),
              where("nameLower", "==", lower),
              limit(10),
            ),
          ),
          getDocs(
            query(
              collection(db, "publicProfiles"),
              where("maa42IdLower", "==", lower),
              limit(1),
            ),
          ),
          getDocs(
            query(
              collection(db, "publicProfiles"),
              where("nameLower", ">=", lower),
              where("nameLower", "<=", lower + "\uf8ff"),
              limit(15),
            ),
          ),
          // Matches a middle/last name even when it isn't a prefix of the
          // full name string, e.g. searching "khan" for "Ayesha Khan".
          getDocs(
            query(
              collection(db, "publicProfiles"),
              where("nameTokens", "array-contains", lower),
              limit(15),
            ),
          ),
        ]);

      [exactNameSnap, exactIdSnap, prefixSnap, tokenSnap].forEach((snap) => {
        snap.forEach((d) => results.set(d.id, d.data() as PublicProfile));
      });

      // The targeted queries above only catch exact words/prefixes. If they
      // came up thin, fall back to a bounded scan + client-side fuzzy match
      // so typos and mid-word substrings ("close related names") still show
      // up. Profiles created before nameTokens existed are also only
      // reachable through this fallback until their owner edits their name.
      if (results.size < 5 && lower.length >= 2) {
        const browseSnap = await getDocs(
          query(
            collection(db, "publicProfiles"),
            orderBy("nameLower"),
            limit(MAX_FUZZY_CANDIDATES),
          ),
        );
        browseSnap.forEach((d) => {
          if (results.has(d.id)) return;
          const data = d.data() as PublicProfile;
          if (isCloseNameMatch(data.nameLower, lower)) {
            results.set(d.id, data);
          }
        });
      }

      const outgoingUids = new Set(outgoingRequests.map((r) => r.toUid));
      const incomingUids = new Set(incomingRequests.map((r) => r.fromUid));
      const friendUids = new Set(friends.map((f) => f.uid));
      const blockedSet = new Set(blockedUids);

      return Array.from(results.values())
        .filter((p) => p.uid !== uid)
        .map((p) => ({
          ...p,
          relation: (blockedSet.has(p.uid)
            ? "blocked"
            : friendUids.has(p.uid)
              ? "friend"
              : outgoingUids.has(p.uid)
                ? "pending_outgoing"
                : incomingUids.has(p.uid)
                  ? "pending_incoming"
                  : "none") as Relation,
        }));
    },
    [friends, outgoingRequests, incomingRequests, blockedUids.join(",")],
  );

  const sendFriendRequest = useCallback(
    async (toUid: string, toName: string) => {
      const me = auth.currentUser;
      if (!me) return;

      const requestId = `${me.uid}__${toUid}`;

      await setDoc(doc(db, "friendRequests", requestId), {
        fromUid: me.uid,
        toUid,
        fromName: me.displayName || "A Maa42 member",
        toName,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      try {
        await addDoc(collection(db, "notifications", toUid, "items"), {
          type: "friend_request",
          fromUid: me.uid,
          fromName: me.displayName || "A Maa42 member",
          requestId,
          read: false,
          createdAt: serverTimestamp(),
        });

        console.log("Notification created successfully");
      } catch (error) {
        console.error("FAILED TO CREATE NOTIFICATION:", error);
      }
    },
    [],
  );

  const cancelFriendRequest = useCallback(async (requestId: string) => {
    await deleteDoc(doc(db, "friendRequests", requestId));
  }, []);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    await deleteDoc(doc(db, "friendRequests", requestId));
  }, []);

  const acceptFriendRequest = useCallback(async (request: FriendRequest) => {
    const me = auth.currentUser;
    if (!me) return;
    await deleteDoc(doc(db, "friendRequests", request.id));

    const fid = pairId(request.fromUid, request.toUid);
    await setDoc(doc(db, "friendships", fid), {
      participants: [request.fromUid, request.toUid],
      participantNames: {
        [request.fromUid]: request.fromName,
        [request.toUid]: request.toName,
      },
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications", request.fromUid, "items"), {
      type: "friend_accept",
      fromUid: me.uid,
      fromName: request.toName,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, []);

  const removeFriend = useCallback(async (otherUid: string) => {
    const me = auth.currentUser;
    if (!me) return;
    await deleteDoc(doc(db, "friendships", pairId(me.uid, otherUid)));
  }, []);

  // Blocking removes any existing friendship and records the block. The
  // conversation itself isn't deleted, but useConversations() filters out
  // any conversation whose other participant is blocked, so it disappears
  // from both people's Messages list as if it never existed.
  const blockUser = useCallback(async (otherUid: string, otherName: string) => {
    const me = auth.currentUser;
    if (!me) return;
    await deleteDoc(doc(db, "friendships", pairId(me.uid, otherUid))).catch(
      () => {},
    );
    await setDoc(doc(db, "blocks", pairId(me.uid, otherUid)), {
      blockerUid: me.uid,
      blockedUid: otherUid,
      blockedName: otherName,
      participants: [me.uid, otherUid],
      createdAt: serverTimestamp(),
    });
  }, []);

  const unblockUser = useCallback(async (otherUid: string) => {
    const me = auth.currentUser;
    if (!me) return;
    await deleteDoc(doc(db, "blocks", pairId(me.uid, otherUid)));
  }, []);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    blocked,
    blockedUids,
    searchPeople,
    sendFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    acceptFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
  };
}
