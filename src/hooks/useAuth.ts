import { useEffect, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from "firebase/auth";
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile } from "../types";
import { generateUniqueMaa42Id } from "../utils/ids";

// Details collected on the sign-up form (AuthModal). Only one of
// dueDate / postpartumDay is present, depending on isPostpartum.
export interface SignUpDetails {
  fullName: string;
  isPostpartum: boolean;
  dueDate?: string;
  postpartumDay?: number;
}

const USERS_COLLECTION = "users";
const PUBLIC_PROFILES_COLLECTION = "publicProfiles";

// A full-term pregnancy is ~40 weeks. We derive the current week from the
// due date so the rest of the app never has to do this math itself.
function deriveWeekFromDueDate(dueDate: string): number {
  if (!dueDate) return 1;

  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksUntilDue = Math.round((due - now) / msPerWeek);

  const week = 40 - weeksUntilDue;

  return Math.min(42, Math.max(1, week));
}

function deriveTrimester(week: number): number {
  if (week >= 28) return 3;
  if (week >= 14) return 2;
  return 1;
}

function buildProfileFromSignUp(
  details: SignUpDetails,
): Omit<UserProfile, "maa42Id"> {
  if (details.isPostpartum) {
    return {
      name: details.fullName,
      week: 40,
      trimester: 3,
      postpartumDay: details.postpartumDay ?? 1,
      dueDate: "",
      isPostpartum: true,
    };
  }

  const week = deriveWeekFromDueDate(details.dueDate ?? "");

  return {
    name: details.fullName,
    week,
    trimester: deriveTrimester(week),
    postpartumDay: 0,
    dueDate: details.dueDate ?? "",
    isPostpartum: false,
  };
}

// Lowercased, de-duplicated words in a name, used for "search by any word".
function tokenizeName(name: string): string[] {
  return Array.from(
    new Set(name.trim().toLowerCase().split(/\s+/).filter(Boolean)),
  );
}

/**
 * Makes sure an authenticated user has:
 *
 * 1. A Maa42 ID in users/{uid}
 * 2. A corresponding publicProfiles/{uid} document
 *
 * This also repairs older accounts created before the Maa42 ID feature
 * existed.
 *
 * Priority:
 *   existing private ID -> existing public ID -> generate a new ID
 */
async function ensureUserIdentity(
  user: User,
  existingProfile: UserProfile,
): Promise<UserProfile> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const publicRef = doc(db, PUBLIC_PROFILES_COLLECTION, user.uid);

  const publicSnap = await getDoc(publicRef);

  const publicData = publicSnap.exists()
    ? (publicSnap.data() as Partial<{
        maa42Id: string;
        name: string;
        nameLower: string;
        nameTokens: string[];
      }>)
    : null;

  // Prefer the private profile's ID when it already exists.
  // Otherwise reuse an existing public ID.
  // Only generate a new one when neither exists.
  let maa42Id = existingProfile.maa42Id || publicData?.maa42Id;

  if (!maa42Id) {
    maa42Id = await generateUniqueMaa42Id();
  }

  const profileWithId: UserProfile = {
    ...existingProfile,
    maa42Id,
  };

  // Repair the private profile if it didn't have the ID.
  if (existingProfile.maa42Id !== maa42Id) {
    await updateDoc(userRef, {
      maa42Id,
    });
  }

  const name = existingProfile.name || user.displayName || "A Maa42 member";
  const nameLower = name.trim().toLowerCase();

  // Keep/create the public searchable profile in sync.
  const publicProfileData: Record<string, unknown> = {
    uid: user.uid,
    name,
    nameLower,
    nameTokens: tokenizeName(name),
    maa42Id,
    maa42IdLower: maa42Id.toLowerCase(),
  };

  // Only assign createdAt when this public profile is being created.
  if (!publicSnap.exists()) {
    publicProfileData.createdAt = serverTimestamp();
  }

  await setDoc(publicRef, publicProfileData, { merge: true });

  return profileWithId;
}

// Friendly copy for Firebase Auth errors.
export function firebaseErrorToMessage(code?: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";

    case "auth/invalid-email":
      return "That email address doesn’t look right.";

    case "auth/weak-password":
      return "Please choose a password with at least 6 characters.";

    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "We couldn’t find an account with those details.";

    case "auth/wrong-password":
      return "That password doesn’t match this account.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";

    case "auth/network-request-failed":
      return "Network error — please check your connection and try again.";

    default:
      return "Something went wrong. Please try again.";
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const snap = await getDoc(doc(db, USERS_COLLECTION, user.uid));

        if (snap.exists()) {
          const existingProfile = snap.data() as UserProfile;

          // This automatically repairs older accounts that don't yet have
          // a Maa42 ID and/or publicProfiles document.
          const repairedProfile = await ensureUserIdentity(
            user,
            existingProfile,
          );

          setProfile(repairedProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, details: SignUpDetails) => {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateFirebaseProfile(credential.user, {
        displayName: details.fullName,
      });

      // Generate the user's permanent shareable Maa42 ID.
      const maa42Id = await generateUniqueMaa42Id();

      const nameLower = details.fullName.trim().toLowerCase();

      const baseProfile = buildProfileFromSignUp(details);

      const newProfile: UserProfile = {
        ...baseProfile,
        maa42Id,
      };

      // Private profile.
      await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
      });

      // Public searchable profile.
      await setDoc(doc(db, PUBLIC_PROFILES_COLLECTION, credential.user.uid), {
        uid: credential.user.uid,
        name: details.fullName,
        nameLower,
        nameTokens: tokenizeName(details.fullName),
        maa42Id,
        maa42IdLower: maa42Id.toLowerCase(),
        createdAt: serverTimestamp(),
      });

      setProfile(newProfile);

      return credential;
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    const snap = await getDoc(doc(db, USERS_COLLECTION, credential.user.uid));

    if (snap.exists()) {
      const existingProfile = snap.data() as UserProfile;

      // Ensures legacy users get a Maa42 ID automatically on sign-in.
      const repairedProfile = await ensureUserIdentity(
        credential.user,
        existingProfile,
      );

      setProfile(repairedProfile);
    } else {
      setProfile(null);
    }

    return credential;
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  // Merges a partial profile update into both local state and Firestore.
  // Used by ProfileModal for edits made after sign-up.
  const persistProfile = useCallback(async (updated: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));

    if (!auth.currentUser) return;

    await updateDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), updated);

    if (updated.name) {
      await updateDoc(
        doc(db, PUBLIC_PROFILES_COLLECTION, auth.currentUser.uid),
        {
          name: updated.name,
          nameLower: updated.name.trim().toLowerCase(),
          nameTokens: tokenizeName(updated.name),
        },
      ).catch(() => {
        // The auth flow will recreate a missing public profile next time
        // the user signs in.
      });
    }
  }, []);

  // Appends a kick-counter session to the user's document.
  const logKickSession = useCallback(
    async (kicks: number, durationMinutes: number) => {
      if (!auth.currentUser) return;

      await updateDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), {
        kickSessions: arrayUnion({
          kicks,
          durationMinutes,
          loggedAt: new Date().toISOString(),
        }),
      });
    },
    [],
  );

  // Appends a mood log entry.
  const logMood = useCallback(
    async (mood: string, tags: string[], notes: string) => {
      if (!auth.currentUser) return;

      await updateDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), {
        moodLogs: arrayUnion({
          mood,
          tags,
          notes,
          loggedAt: new Date().toISOString(),
        }),
      });
    },
    [],
  );

  return {
    currentUser,
    profile,
    authLoading,
    signUp,
    signIn,
    signOutUser,
    persistProfile,
    logKickSession,
    logMood,
  };
}
