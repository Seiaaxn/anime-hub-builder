// Sankavollerei API client (samehadaku source).
const BASE = "https://www.sankavollerei.com/anime";

export type Source = "samehadaku";

export type SvAnime = {
  title: string;
  poster?: string;
  animeId: string;
  href?: string;
  type?: string;
  score?: string;
  status?: string;
  episodes?: string | number;
  releasedOn?: string;
  estimation?: string;
  source: Source;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    if ([404, 500, 502, 503].includes(res.status) && /[?&]page=\d+/.test(path)) {
      return { animeList: [] } as unknown as T;
    }
    throw new Error(`API ${path} → ${res.status}`);
  }
  const j: any = await res.json().catch(() => ({ status: "error" }));
  if (j.status !== "success") {
    if (/[?&]page=\d+/.test(path)) return { animeList: [] } as unknown as T;
    throw new Error(j.message || "API error");
  }
  return j.data as T;
}

const norm = (arr: any[] = []): SvAnime[] =>
  arr.map((x) => ({ ...x, source: "samehadaku" as Source }));

export async function svHome(): Promise<{ recent: SvAnime[]; popular: SvAnime[]; top10: SvAnime[] }> {
  const d = await get<any>(`/samehadaku/home`);
  return {
    recent: norm(d?.recent?.animeList || []),
    popular: norm(d?.popular?.animeList || []),
    top10: norm(d?.top10?.animeList || []),
  };
}
export async function svPopular(page = 1): Promise<SvAnime[]> {
  const d = await get<any>(`/samehadaku/popular?page=${page}`); return norm(d?.animeList || []);
}
export async function svOngoing(page = 1): Promise<SvAnime[]> {
  const d = await get<any>(`/samehadaku/ongoing?page=${page}`); return norm(d?.animeList || []);
}
export async function svCompleted(page = 1): Promise<SvAnime[]> {
  const d = await get<any>(`/samehadaku/completed?page=${page}`); return norm(d?.animeList || []);
}
export async function svMovies(page = 1): Promise<SvAnime[]> {
  const d = await get<any>(`/samehadaku/movies?page=${page}`); return norm(d?.animeList || []);
}
export async function svSchedule(): Promise<{ day: string; animeList: SvAnime[] }[]> {
  const d = await get<any>(`/samehadaku/schedule`);
  return (d?.days || []).map((x: any) => ({ day: x.day, animeList: norm(x.animeList || []) }));
}
export async function svGenres(): Promise<{ title: string; genreId: string }[]> {
  const d = await get<any>(`/samehadaku/genres`);
  return (d?.genreList || []).map((g: any) => ({ title: g.title, genreId: g.genreId }));
}
export async function svGenre(genreId: string, page = 1): Promise<SvAnime[]> {
  const d = await get<any>(`/samehadaku/genres/${genreId}?page=${page}`);
  return norm(d?.animeList || []);
}
export async function svSearch(q: string, page = 1): Promise<SvAnime[]> {
  const d = await get<any>(`/samehadaku/search?q=${encodeURIComponent(q)}&page=${page}`);
  return norm(d?.animeList || []);
}

export type SvEpisode = { title: string; episodeId: string; href?: string };
export type SvServer = { title: string; serverId: string };
export type SvDetail = {
  title: string;
  poster?: string;
  synopsis?: string;
  score?: string;
  status?: string;
  type?: string;
  episodes?: number | string;
  duration?: string;
  studios?: string;
  released?: string;
  genres?: { title: string; genreId: string }[];
  episodeList: SvEpisode[];
};

export async function svDetail(animeId: string): Promise<SvDetail> {
  const d = await get<any>(`/samehadaku/anime/${animeId}`);
  const synopsisRaw = d?.synopsis;
  const synopsis =
    typeof synopsisRaw === "string"
      ? synopsisRaw
      : Array.isArray(synopsisRaw?.paragraphs)
      ? synopsisRaw.paragraphs.join("\n\n")
      : "";
  return {
    title: (d?.title && String(d.title)) || d?.english || d?.japanese || animeId,
    poster: d?.poster,
    synopsis,
    score: d?.score?.value || (typeof d?.score === "string" ? d.score : undefined),
    status: d?.status,
    type: d?.type,
    episodes: d?.episodes,
    duration: d?.duration,
    studios: d?.studios,
    released: d?.aired || d?.released,
    genres: (d?.genreList || []).map((g: any) => ({ title: g.title, genreId: g.genreId })),
    episodeList: (d?.episodeList || []).map((e: any) => ({
      title: String(e.title ?? ""),
      episodeId: e.episodeId,
      href: e.href,
    })),
  };
}

export async function svEpisode(episodeId: string): Promise<{
  title: string;
  poster?: string;
  defaultStreamingUrl?: string;
  servers: { title: string; servers: SvServer[] }[];
  prev?: string;
  next?: string;
}> {
  const d = await get<any>(`/samehadaku/episode/${episodeId}`);
  const groups = d?.server?.qualities || [];
  return {
    title: d?.title || episodeId,
    poster: d?.poster,
    defaultStreamingUrl: d?.defaultStreamingUrl,
    servers: groups.map((g: any) => ({
      title: g.title,
      servers: (g.serverList || []).map((s: any) => ({ title: s.title, serverId: s.serverId })),
    })),
    prev: d?.hasPrevEpisode ? d?.prevEpisode?.episodeId : undefined,
    next: d?.hasNextEpisode ? d?.nextEpisode?.episodeId : undefined,
  };
}

export async function svServer(serverId: string): Promise<string | undefined> {
  const d = await get<any>(`/samehadaku/server/${serverId}`);
  return d?.url;
}

import { cleanTitle } from "@/lib/title";
import type { AnimeCard } from "@/lib/anime-types";
export function svToCard(a: SvAnime): AnimeCard {
  const epNum = typeof a.episodes === "string" ? parseInt(a.episodes) || 0 : (a.episodes || 0);
  const t = (a.type || "TV").toUpperCase();
  return {
    id: `sv-${a.animeId}`,
    title: cleanTitle(a.title),
    type: (["TV", "MOVIE", "ONA", "OVA"].includes(t) ? t : "TV") as "TV" | "MOVIE" | "ONA" | "OVA",
    episodes: epNum,
    year: new Date().getFullYear(),
    cover: a.poster || "",
    banner: a.poster || "",
    synopsis: "",
    genres: [],
    rating: a.score || "HD",
    sub: epNum || undefined,
  };
    }
                           
