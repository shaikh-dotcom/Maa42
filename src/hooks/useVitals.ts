import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { VitalsEntry } from "../types";

function vitalsCollection(uid: string) {
  return collection(db, "users", uid, "vitalsLogs");
}

// Append-only log of manually entered vitals (BP + weight change aren't
// tracked by MaterniBot's sensors or anywhere else yet). Only the most
// recent entry is surfaced — that's what the clinical summary reads from.
export function useVitals() {
  const [latestVitals, setLatestVitals] = useState<VitalsEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setLatestVitals(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = onSnapshot(
      query(vitalsCollection(uid), orderBy("loggedAt", "desc"), limit(1)),
      (snap) => {
        const docSnap = snap.docs[0];
        setLatestVitals(
          docSnap
            ? ({ id: docSnap.id, ...(docSnap.data() as any) } as VitalsEntry)
            : null,
        );
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return unsub;
  }, [uid]);

  const logVitals = useCallback(
    async (bp: string, weightChange: string, symptoms: string) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;
      await addDoc(vitalsCollection(currentUid), {
        bp: bp.trim(),
        weightChange: weightChange.trim(),
        symptoms: symptoms.trim(),
        loggedAt: serverTimestamp(),
      });
    },
    [],
  );

  return { latestVitals, isLoading, logVitals };
}
