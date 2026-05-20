// Helpers for "custom" anime uploaded by admins (stored in Firebase RTDB).
import { ref, onValue, get, push, set, remove, serverTimestamp } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { AnimeCard } from "@/lib/anime-types";

export type CustomCategory = "popular" | "ongoing" | "completed" | "movies";

export type CustomEpisode = {
  id: string;
  number: number;
  title?: string;
  videoUrl: string; // direct URL or data: URL
  thumbnail?: string;
  ts?: number;
};

export type CustomAnime = {
  id: string;
  title: string;
  type: "TV" | "MOVIE" | "ONA" | "OVA";
  year: number;
  episodes: number;
  cover: string;
  banner?: string;
  synopsis: string;
  genres?: string[];
  category?: CustomCategory;
  status?: string;
  rating?: string;
  uploadedBy?: string;
  ts?: number;
  episodeList?: CustomEpisode[];
};

const CUSTOM_PREFIX = "custom-";
const EP_PREFIX = "custom-ep-";

export const isCustomAnimeId = (id: string) => id.startsWith(CUSTOM_PREFIX);
export const customAnimeIdToKey = (id: string) =>
  id.startsWith(CUSTOM_PREFIX) ? id.slice(CUSTOM_PREFIX.length) : id;
export const customAnimeKeyToId = (key: string) => `${CUSTOM_PREFIX}${key}`;

export const isCustomEpisodeId = (id: string) => id.startsWith(EP_PREFIX);
// Episode id format: custom-ep-<animeKey>__<episodeKey>
export const makeCustomEpisodeId = (animeKey: string, epKey: string) =>
  `${EP_PREFIX}${animeKey}__${epKey}`;
export const parseCustomEpisodeId = (
  id: string,
): { animeKey: string; epKey: string } | null => {
  if (!isCustomEpisodeId(id)) return null;
  const rest = id.slice(EP_PREFIX.length);
  const idx = rest.indexOf("__");
  if (idx === -1) return null;
  return { animeKey: rest.slice(0, idx), epKey: rest.slice(idx + 2) };
};

function normalizeEpisodes(raw: any): CustomEpisode[] {
  if (!raw) return [];
  const arr: CustomEpisode[] = [];
  for (const [k, v] of Object.entries(raw)) {
    const e = v as any;
    arr.push({
      id: k,
      number: Number(e?.number ?? 0),
      title: e?.title || `Episode ${e?.number ?? ""}`,
      videoUrl: String(e?.videoUrl || ""),
      thumbnail: e?.thumbnail,
      ts: e?.ts,
    });
  }
  arr.sort((a, b) => a.number - b.number);
  return arr;
}

function normalizeAnime(id: string, v: any): CustomAnime {
  return {
    id,
    title: String(v?.title || ""),
    type: (v?.type || "TV") as CustomAnime["type"],
    year: Number(v?.year || new Date().getFullYear()),
    episodes: Number(v?.episodes || 0),
    cover: String(v?.cover || ""),
    banner: v?.banner,
    synopsis: String(v?.synopsis || ""),
    genres: Array.isArray(v?.genres) ? v.genres : [],
    category: (v?.category || undefined) as CustomCategory | undefined,
    status: v?.status,
    rating: v?.rating,
    uploadedBy: v?.uploadedBy,
    ts: v?.ts,
    episodeList: normalizeEpisodes(v?.episodes_list),
  };
}

export function useCustomAnimes() {
  const [list, setList] = useState<CustomAnime[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onValue(ref(db, "customAnimes"), (snap) => {
      const arr: CustomAnime[] = [];
      snap.forEach((c) => {
        arr.push(normalizeAnime(c.key!, c.val()));
      });
      arr.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
      setList(arr);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { list, loading };
}

export async function getCustomAnime(key: string): Promise<CustomAnime | null> {
  const snap = await get(ref(db, `customAnimes/${key}`));
  if (!snap.exists()) return null;
  return normalizeAnime(key, snap.val());
}

export function useCustomAnime(key: string) {
  const [data, setData] = useState<CustomAnime | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!key) return;
    setLoading(true);
    const unsub = onValue(ref(db, `customAnimes/${key}`), (snap) => {
      setData(snap.exists() ? normalizeAnime(key, snap.val()) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [key]);
  return { data, loading };
}

export function customAnimeToCard(a: CustomAnime): AnimeCard {
  return {
    id: customAnimeKeyToId(a.id),
    title: a.title,
    type: a.type,
    episodes: a.episodes,
    year: a.year,
    cover: a.cover,
    banner: a.banner || a.cover,
    synopsis: a.synopsis,
    genres: a.genres || [],
    rating: a.rating || "HD",
    sub: a.episodes || undefined,
  };
}

export async function addCustomEpisode(
  animeKey: string,
  ep: { number: number; title?: string; videoUrl: string; thumbnail?: string },
) {
  const newRef = push(ref(db, `customAnimes/${animeKey}/episodes_list`));
  await set(newRef, { ...ep, ts: serverTimestamp() });
  return newRef.key!;
}

export async function deleteCustomEpisode(animeKey: string, epKey: string) {
  await remove(ref(db, `customAnimes/${animeKey}/episodes_list/${epKey}`));
}

export function matchesCategory(a: CustomAnime, cat: CustomCategory): boolean {
  if (a.category === cat) return true;
  // Heuristic fallback by type/status
  if (cat === "movies" && a.type === "MOVIE") return true;
  if (cat === "ongoing" && (a.status || "").toLowerCase().includes("ongoing")) return true;
  if (cat === "completed" && (a.status || "").toLowerCase().includes("completed")) return true;
  return false;
}
