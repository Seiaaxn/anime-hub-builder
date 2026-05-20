import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  svPopular, svOngoing, svCompleted, svMovies, svHome, svToCard,
} from "@/lib/sankavollerei";
import type { AnimeCard } from "@/lib/anime-types";
import { PortraitGrid } from "@/components/AnimeBlocks";

const META: Record<string, { title: string; supportsPaging: boolean; fetcher: (page: number) => Promise<AnimeCard[]> }> = {
  ongoing:   { title: "Sedang Tayang", supportsPaging: true,  fetcher: async (p) => (await svOngoing(p)).map(svToCard) },
  completed: { title: "Selesai",       supportsPaging: true,  fetcher: async (p) => (await svCompleted(p)).map(svToCard) },
  popular:   { title: "Populer",       supportsPaging: true,  fetcher: async (p) => (await svPopular(p)).map(svToCard) },
  movies:    { title: "Movies",        supportsPaging: true,  fetcher: async (p) => (await svMovies(p)).map(svToCard) },
  latest:    { title: "Episode Terbaru", supportsPaging: false, fetcher: async () => (await svHome()).recent.map(svToCard) },
};

export const Route = createFileRoute("/list/$listId")({
  component: ListPage,
});

function ListPage() {
  const { listId } = Route.useParams();
  const meta = META[listId];
  const router = useRouter();
  const nav = useNavigate();
  const [items, setItems] = useState<AnimeCard[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const loadMore = async () => {
    if (!meta || loading || done) return;
    setLoading(true);
    try {
      const cards = await meta.fetcher(page);
      if (!cards.length) setDone(true);
      else {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...cards.filter((c) => !seen.has(c.id))];
        });
        if (!meta.supportsPaging) setDone(true);
        else setPage((p) => p + 1);
      }
    } catch {
      toast.error("Gagal memuat daftar.");
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMore(); /* eslint-disable-next-line */ }, [listId]);

  useEffect(() => {
    if (!meta?.supportsPaging) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line
  }, [page, loading, done]);

  const watchAnime = (a: AnimeCard) => {
    const id = a.id.startsWith("sv-") ? a.id.slice(3) : a.id;
    nav({ to: "/anime/$animeId", params: { animeId: id } });
  };

  if (!meta) {
    return (
      <div className="min-h-screen grid place-items-center text-center p-6">
        <div>
          <p className="font-bold text-destructive">Daftar tidak ditemukan.</p>
          <Link to="/home" className="mt-3 inline-block text-primary underline">Kembali ke Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} aria-label="Kembali" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-black tracking-wider">NEX<span className="text-primary">Z</span>HU</Link>
          <span className="ml-2 text-sm text-muted-foreground">/ {meta.title}</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <h1 className="text-2xl font-black mb-5 uppercase tracking-wider flex items-center gap-3">
          <span className="h-6 w-1.5 rounded-full bg-primary" /> {meta.title}
        </h1>
        {items.length > 0 && <PortraitGrid items={items} onClick={watchAnime} />}
        <div className="py-10 grid place-items-center">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {!loading && done && items.length > 0 && <p className="text-xs text-muted-foreground">Sudah sampai akhir.</p>}
          {!loading && done && items.length === 0 && <p className="text-xs text-muted-foreground">Tidak ada data.</p>}
        </div>
      </main>
    </div>
  );
}
