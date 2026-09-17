import { useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from 'firebase/auth';
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

// Details collected on the sign-up form (AuthModal). Only one of
// dueDate / postpartumDay is present, depending on isPostpartum.
export interface SignUpDetails {
  fullName: string;
  isPostpartum: boolean;
  dueDate?: string;
  postpartumDay?: number;
}

const USERS_COLLECTION = 'users';

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

function buildProfileFromSignUp(details: SignUpDetails): UserProfile {
  if (details.isPostpartum) {
    return {
      name: details.fullName,
      week: 40,
      trimester: 3,
      postpartumDay: details.postpartumDay ?? 1,
      dueDate: '',
      isPostpartum: true,
    };
  }
  const week = deriveWeekFromDueDate(details.dueDate ?? '');
  return {
    name: details.fullName,
    week,
    trimester: deriveTrimester(week),
    postpartumDay: 0,
    dueDate: details.dueDate ?? '',
    isPostpartum: false,
  };
}

// Friendly copy for the Firebase Auth error codes we're likely to hit.
export function firebaseErrorToMessage(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address doesn\u2019t look right.';
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'We couldn\u2019t find an account with those details.';
    case 'auth/wrong-password':
      return 'That password doesn\u2019t match this account.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error \u2014 please check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
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
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email: string, password: string, details: SignUpDetails) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateFirebaseProfile(credential.user, { displayName: details.fullName });

    const newProfile = buildProfileFromSignUp(details);
    await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
    setProfile(newProfile);
    return credential;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, USERS_COLLECTION, credential.user.uid));
    setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
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
  }, []);

  // Appends a kick-counter session to the user's document so KickCounterModal
  // has somewhere real to save to (previously unwired in App.tsx).
  const logKickSession = useCallback(async (kicks: number, durationMinutes: number) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), {
      kickSessions: arrayUnion({
        kicks,
        durationMinutes,
        loggedAt: new Date().toISOString(),
      }),
    });
  }, []);

  // Appends a mood log entry, mirroring logKickSession above for MoodModal.
  const logMood = useCallback(async (mood: string, tags: string[], notes: string) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), {
      moodLogs: arrayUnion({
        mood,
        tags,
        notes,
        loggedAt: new Date().toISOString(),
      }),
    });
  }, []);

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
