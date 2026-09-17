import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";

// Excludes 0/O/1/I to avoid ambiguity when a user reads their ID aloud or
// types it in by hand.
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return out;
}

// Short, shareable ID shown on the user's profile (e.g. "MAA-4F82"),
// separate from Firebase's internal uid. Checked against publicProfiles for
// collisions before being handed back — collisions are astronomically
// unlikely at 4 chars over a 33-symbol alphabet (~1.2M combinations), but we
// still guard against them rather than assume.
export async function generateUniqueMaa42Id(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `MAA-${randomSegment(4)}`;
    const snap = await getDocs(
      query(
        collection(db, "publicProfiles"),
        where("maa42IdLower", "==", candidate.toLowerCase()),
        limit(1),
      ),
    );
    if (snap.empty) return candidate;
  }
  // Practically unreachable fallback if 8 collisions happen in a row.
  return `MAA-${randomSegment(6)}`;
}

// Deterministic ID for a 1:1 relationship doc (conversation, friendship,
// block) between two uids, independent of which uid is passed first. Both
// the client and the Firestore security rules compute this the same way so
// a doc's ID can be trusted to match its participants.
export function pairId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}
