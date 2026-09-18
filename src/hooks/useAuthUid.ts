import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// Reactive uid: updates when Firebase finishes restoring the session or the
// user signs in/out. Reading auth.currentUser once at mount can return null
// (auth not ready yet) and leave listeners permanently unsubscribed.
export function useAuthUid(): string | null {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
  }, []);

  return uid;
}
