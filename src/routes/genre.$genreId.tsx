import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { svGenre, svToCard } from "@/lib/sankavollerei";
import type { AnimeCard } from "@/lib/anime-types";
import { PortraitGrid } from "@/components/AnimeBlocks";
import { useCustomAnimes, customAnimeToCard } from "@/lib/custom-anime";

export const Route = createFileRoute("/genre/$genreId")({
  component: GenrePage,
});

function GenrePage() {
  const { genreId } = Route.useParams();
  const router = useRouter();
  const nav = useNavigate();
  const [items, setItems] = useState<AnimeCard[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { list: customList } = useCustomAnimes();

  const customMatches = useMemo(() => {
    const g = genreId.toLowerCase();
    return customList
      .filter((a) => (a.genres || []).some((x) => x.toLowerCase() === g))
      .map(customAnimeToCard);
  }, [customList, genreId]);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const out: AnimeCard[] = [];
    for (const c of [...customMatches, ...items]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }, [customMatches, items]);

  const loadMore = async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const next = await svGenre(genreId, page);
      const cards = next.map(svToCard);
      if (!cards.length) setDone(true);
      else {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...cards.filter((c) => !seen.has(c.id))];
        });
        setPage((p) => p + 1);
      }
    } catch {
      toast.error("Gagal memuat genre.");
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setDone(false);
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreId]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        loadMore();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loading, done]);

  const watchAnime = (a: AnimeCard) => {
    const id = a.id.startsWith("sv-") ? a.id.slice(3) : a.id;
    nav({ to: "/anime/$animeId", params: { animeId: id } });
  };

  const label = genreId
    .split("-")
    .map((s: string) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} aria-label="Kembali" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-black tracking-wider">NEX<span className="text-primary">Z</span>HU</Link>
          <span className="ml-2 text-sm text-muted-foreground">/ Genre</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <h1 className="text-2xl font-black mb-5 uppercase tracking-wider flex items-center gap-3">
          <span className="h-6 w-1.5 rounded-full bg-primary" /> {label}
        </h1>
        {items.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">Tidak ada anime di genre ini.</p>
        )}
        {items.length > 0 && <PortraitGrid items={items} onClick={watchAnime} />}
        <div className="py-10 grid place-items-center">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {!loading && done && items.length > 0 && (
            <p className="text-xs text-muted-foreground">Sudah sampai akhir.</p>
          )}
        </div>
      </main>
    </div>
  );
}
