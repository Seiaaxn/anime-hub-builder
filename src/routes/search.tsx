import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { ArrowLeft, Search, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { svSearch } from "@/lib/sankavollerei";
import { cleanTitle } from "@/lib/title";
import { useCustomAnimes } from "@/lib/custom-anime";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Cari Anime — Nexzhu" },
      { name: "description", content: "Cari Anime Favorit Kamu Hanya Di Nexzhu." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const router = useRouter();
  const [draft, setDraft] = useState(q);

  const { data: svData, isLoading, isError } = useQuery({
    queryKey: ["sv-search", q],
    enabled: q.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () => svSearch(q),
  });

  const { list: customList } = useCustomAnimes();
  const customMatches = q.trim()
    ? customList
        .filter((a) => a.title.toLowerCase().includes(q.trim().toLowerCase()))
        .map((a) => ({
          animeId: `custom-${a.id}`,
          title: a.title,
          poster: a.cover,
          type: a.type,
          status: a.category || a.status,
          score: a.rating,
          source: "custom" as const,
        }))
    : [];

  const data = q.trim().length > 0
    ? [...customMatches, ...(svData || []).map((s) => ({ ...s, source: "sv" as const }))]
    : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: draft.trim() } });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.history.back()}
          aria-label="Kembali"
          className="rounded-lg p-2 hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/" className="text-lg font-extrabold tracking-wider">
          NEX<span className="text-primary">Z</span>HU
        </Link>
      </header>

      <form onSubmit={submit} className="flex items-center gap-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ketik judul anime..."
          className="h-14 rounded-xl bg-input/60 text-base"
          autoFocus
        />
        <Button type="submit" aria-label="Cari" className="h-14 w-14 rounded-xl glow-primary">
          <Search className="h-5 w-5" />
        </Button>
      </form>

      <section className="mt-6">
        {q.trim() === "" && (
          <p className="text-sm text-muted-foreground">Ketik judul anime untuk mencari.</p>
        )}

        {q.trim() !== "" && (
          <h1 className="mb-4 text-lg font-bold">
            Hasil untuk: <span className="text-primary">"{q}"</span>
          </h1>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-card/60" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Gagal memuat hasil. Coba lagi sebentar.
          </p>
        )}

        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Tidak ada hasil ditemukan.</p>
        )}

        {data && data.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.map((a) => (
              <li key={a.animeId}>
                <Link
                  to="/anime/$animeId"
                  params={{ animeId: a.animeId }}
                  className="group block overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur transition hover:border-primary/60"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                    {a.poster ? (
                      <img
                        src={a.poster}
                        alt={a.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No Image</div>
                    )}
                    <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/90 glow-primary">
                        <Play className="h-6 w-6 text-primary-foreground fill-current" />
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">{cleanTitle(a.title)}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {a.score && (
                        <span className="flex items-center gap-1 text-primary">
                          <Star className="h-3 w-3 fill-primary" /> {a.score}
                        </span>
                      )}
                      {a.type && <span>{a.type}</span>}
                      {a.status && <span>· {a.status}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 pb-10 text-center text-xs text-muted-foreground">
        Data Anime via Samehadaku
      </footer>
    </main>
  );
}
