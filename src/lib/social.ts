// Followers / following helpers backed by Firebase Realtime DB.
import { ref, set, remove, onValue, get, push, serverTimestamp, query, limitToLast, update, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

// ============= XP / Level System =============
// Stored at users/{uid}/xp (number). Level derived from XP.
// Curve: level n requires n * 100 cumulative XP (1->100, 2->300, 3->600...).
// Formula: level = floor((-1 + sqrt(1 + 8*xp/100)) / 2) + 1
export function levelFromXp(xp: number): { level: number; current: number; needed: number; progress: number } {
  const safe = Math.max(0, xp || 0);
  const level = Math.max(1, Math.floor((-1 + Math.sqrt(1 + (8 * safe) / 100)) / 2) + 1);
  const xpForLevel = (n: number) => (n * (n - 1) * 100) / 2; // cumulative xp needed to reach level n
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = safe - base;
  const needed = next - base;
  return { level, current, needed, progress: needed > 0 ? current / needed : 0 };
}

export async function addXp(uid: string, amount: number) {
  if (!uid || !amount) return;
  await runTransaction(ref(db, `users/${uid}/xp`), (v) => (typeof v === "number" ? v : 0) + amount);
  await update(ref(db, `users/${uid}`), { updatedAt: serverTimestamp() });
}

// Cooldown helper: only award XP for an episode once per user per 6h.
// Premium users (admin emails or flagged premium) earn 5x XP.
export async function awardWatchXp(uid: string, episodeId: string, amount = 10) {
  if (!uid || !episodeId) return false;
  const key = `xpLog/${uid}/${episodeId}`;
  const snap = await get(ref(db, key));
  const last = snap.exists() ? Number(snap.val()) : 0;
  const SIX_H = 6 * 60 * 60 * 1000;
  if (Date.now() - last < SIX_H) return false;
  // Check premium status (admin email or premium flag)
  const [userSnap, flagsSnap] = await Promise.all([
    get(ref(db, `users/${uid}/email`)),
    get(ref(db, `userFlags/${uid}/premium`)),
  ]);
  const email = userSnap.val() as string | null;
  const isPrem =
    flagsSnap.val() === true ||
    (email && ["ryu694602@gmail.com", "zeoxaeon@gmail.com"].includes(email.toLowerCase()));
  const final = isPrem ? amount * 5 : amount;
  await set(ref(db, key), Date.now());
  await addXp(uid, final);
  return true;
}

export function useXp(uid?: string) {
  const [xp, setXp] = useState<number>(0);
  useEffect(() => {
    if (!uid) { setXp(0); return; }
    const unsub = onValue(ref(db, `users/${uid}/xp`), (s) => setXp(Number(s.val() ?? 0)));
    return () => unsub();
  }, [uid]);
  return { xp, ...levelFromXp(xp) };
}

// Profiles: users/{uid} = { displayName, email, photoURL, publicKey, updatedAt }
// Following: follows/{uid}/{targetUid} = true
// Followers: followers/{uid}/{followerUid} = true

export type PublicProfile = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  bio?: string | null;
  publicKey?: JsonWebKey | null;
};

export async function upsertProfile(p: PublicProfile) {
  // Sync identity from Google login. Always refresh displayName/photoURL
  // from the auth provider UNLESS the user has manually customized them
  // (tracked via customDisplayName / customPhotoURL flags).
  const existing = (await get(ref(db, `users/${p.uid}`))).val() as
    | (Partial<PublicProfile> & { customDisplayName?: boolean; customPhotoURL?: boolean })
    | null;
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (p.displayName && !existing?.customDisplayName) patch.displayName = p.displayName;
  if (p.photoURL && !existing?.customPhotoURL) patch.photoURL = p.photoURL;
  if (p.email && existing?.email !== p.email) patch.email = p.email;
  if (p.publicKey !== undefined && !existing?.publicKey) patch.publicKey = p.publicKey;
  await update(ref(db, `users/${p.uid}`), patch);
}

// Explicit edits from the profile owner — overwrites the given fields
// and marks them as custom so future Google logins don't reset them.
export async function updateOwnProfile(
  uid: string,
  patch: { displayName?: string; photoURL?: string; bio?: string | null },
) {
  const out: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.displayName !== undefined) out.customDisplayName = true;
  if (patch.photoURL !== undefined) out.customPhotoURL = true;
  await update(ref(db, `users/${uid}`), out);
}

// ============= Watch history =============
export type WatchEntry = {
  episodeId: string;
  animeId?: string;
  title: string;
  poster?: string;
  ts: number;
};

export async function recordWatch(uid: string, entry: Omit<WatchEntry, "ts">) {
  if (!uid || !entry.episodeId) return;
  await set(ref(db, `history/${uid}/${entry.episodeId}`), {
    ...entry,
    ts: Date.now(),
  });
}

export function useWatchHistory(uid?: string, max = 24) {
  const [list, setList] = useState<WatchEntry[]>([]);
  useEffect(() => {
    if (!uid) { setList([]); return; }
    const unsub = onValue(ref(db, `history/${uid}`), (snap) => {
      const arr: WatchEntry[] = [];
      snap.forEach((c) => { arr.push(c.val() as WatchEntry); });
      arr.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
      setList(arr.slice(0, max));
    });
    return () => unsub();
  }, [uid, max]);
  return list;
}

// ============= Image helpers =============
// Resize + compress a file to a JPEG data URL suitable for RTDB storage.
export async function fileToCompressedDataUrl(
  file: File,
  maxSize = 384,
  quality = 0.82,
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia.");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function getPublicKey(uid: string): Promise<JsonWebKey | null> {
  const s = await get(ref(db, `users/${uid}/publicKey`));
  return s.exists() ? (s.val() as JsonWebKey) : null;
}

export async function follow(myUid: string, targetUid: string) {
  if (myUid === targetUid) return;
  await Promise.all([
    set(ref(db, `follows/${myUid}/${targetUid}`), true),
    set(ref(db, `followers/${targetUid}/${myUid}`), true),
  ]);
}

export async function unfollow(myUid: string, targetUid: string) {
  await Promise.all([
    remove(ref(db, `follows/${myUid}/${targetUid}`)),
    remove(ref(db, `followers/${targetUid}/${myUid}`)),
  ]);
}

export async function isMutual(a: string, b: string) {
  const [s1, s2] = await Promise.all([
    get(ref(db, `follows/${a}/${b}`)),
    get(ref(db, `follows/${b}/${a}`)),
  ]);
  return s1.exists() && s2.exists();
}

export function useFollowing(uid?: string) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    if (!uid) { setList([]); return; }
    const unsub = onValue(ref(db, `follows/${uid}`), (snap) => {
      const ids: string[] = [];
      snap.forEach((c) => { ids.push(c.key!); });
      setList(ids);
    });
    return () => unsub();
  }, [uid]);
  return list;
}

export function useFollowers(uid?: string) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    if (!uid) { setList([]); return; }
    const unsub = onValue(ref(db, `followers/${uid}`), (snap) => {
      const ids: string[] = [];
      snap.forEach((c) => { ids.push(c.key!); });
      setList(ids);
    });
    return () => unsub();
  }, [uid]);
  return list;
}

export function useProfile(uid?: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(uid ? { uid } : null);
  useEffect(() => {
    if (!uid) { setProfile(null); return; }
    // Seed with placeholder so UI never gets stuck on a loader if RTDB is slow / empty.
    setProfile((p) => (p && p.uid === uid ? p : { uid }));
    const unsub = onValue(
      ref(db, `users/${uid}`),
      (snap) => {
        const v = snap.val();
        setProfile(v ? { uid, ...v } : { uid });
      },
      // On permission/network errors keep the placeholder so the page still renders.
      () => setProfile((p) => p ?? { uid }),
    );
    return () => unsub();
  }, [uid]);
  return profile;
}

// Chat: chats/{chatId}/messages/{messageId} where chatId = sorted [a,b].join("_")
export const chatId = (a: string, b: string) => [a, b].sort().join("_");

export type ChatMessage = {
  id: string;
  uid: string;
  name: string;
  /** Plaintext (legacy/unencrypted messages only). */
  text?: string;
  /** Encrypted payload: base64 IV + base64 ciphertext. */
  iv?: string;
  ct?: string;
  ts: number;
};

export function useChatMessages(cid?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (!cid) { setMsgs([]); return; }
    const q = query(ref(db, `chats/${cid}/messages`), limitToLast(100));
    const unsub = onValue(q, (snap) => {
      const list: ChatMessage[] = [];
      snap.forEach((c) => { list.push({ id: c.key!, ...(c.val() as Omit<ChatMessage, "id">) }); });
      list.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
      setMsgs(list);
    });
    return () => unsub();
  }, [cid]);
  return msgs;
}

export async function sendChatMessage(cid: string, m: Omit<ChatMessage, "id" | "ts">) {
  await push(ref(db, `chats/${cid}/messages`), { ...m, ts: serverTimestamp() });
}

// ============= Admin: user flags (premium, banned, tag) =============
export type UserFlags = { premium?: boolean; banned?: boolean; tag?: string | null };

export function useUserFlags(uid?: string) {
  const [flags, setFlags] = useState<UserFlags>({});
  useEffect(() => {
    if (!uid) { setFlags({}); return; }
    const unsub = onValue(ref(db, `userFlags/${uid}`), (s) => {
      setFlags((s.val() as UserFlags) || {});
    });
    return () => unsub();
  }, [uid]);
  return flags;
}

export async function setUserFlags(uid: string, patch: Partial<UserFlags>) {
  await update(ref(db, `userFlags/${uid}`), { ...patch, updatedAt: serverTimestamp() });
}

export function useAllProfiles() {
  const [users, setUsers] = useState<Array<PublicProfile & { flags?: UserFlags }>>([]);
  useEffect(() => {
    const unsub = onValue(ref(db, `users`), async (snap) => {
      const flagsSnap = await get(ref(db, `userFlags`));
      const flagsMap = (flagsSnap.val() as Record<string, UserFlags>) || {};
      const arr: Array<PublicProfile & { flags?: UserFlags }> = [];
      snap.forEach((c) => {
        const uid = c.key!;
        arr.push({ ...(c.val() as PublicProfile), uid, flags: flagsMap[uid] });
      });
      setUsers(arr);
    });
    return () => unsub();
  }, []);
  return users;
      }
        
