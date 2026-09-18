import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { CareMember } from "../types";
import { DEFAULT_CARE_TEAM } from "../data";

function careTeamCollection(uid: string) {
  return collection(db, "users", uid, "careTeam");
}

// Seeds a brand-new user's careTeam subcollection with the app's default
// doctors/partner, but only if it's currently empty. This intentionally
// does NOT distinguish "never seeded" from "user deleted everyone" — if a
// user removes every member, the next reload will reseed the defaults. If
// you want removal to stick permanently instead, add a `seeded: true` flag
// on users/{uid} and check that here instead of getDocs().empty.
async function seedIfEmpty(uid: string) {
  const snap = await getDocs(careTeamCollection(uid));
  if (!snap.empty) return;

  await Promise.all(
    DEFAULT_CARE_TEAM.map((member) => {
      const { id, ...rest } = member;
      return setDoc(doc(careTeamCollection(uid), id), rest);
    }),
  );
}

export function useCareTeam() {
  const [careTeam, setCareTeam] = useState<CareMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setCareTeam([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    seedIfEmpty(uid).catch((err) => {
      console.error("Failed to seed default care team:", err);
    });

    const unsub = onSnapshot(
      query(careTeamCollection(uid), orderBy("name")),
      (snap) => {
        setCareTeam(
          snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Omit<CareMember, "id">) }),
          ),
        );
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return unsub;
  }, [uid]);

  const addMember = useCallback(async (member: Omit<CareMember, "id">) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    await setDoc(doc(careTeamCollection(currentUid)), member);
  }, []);

  const updateMember = useCallback(
    async (memberId: string, updates: Partial<Omit<CareMember, "id">>) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;
      await updateDoc(doc(careTeamCollection(currentUid), memberId), updates);
    },
    [],
  );

  const removeMember = useCallback(async (memberId: string) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    await deleteDoc(doc(careTeamCollection(currentUid), memberId));
  }, []);

  return { careTeam, isLoading, addMember, updateMember, removeMember };
}
