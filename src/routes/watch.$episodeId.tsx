import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ChevronDown, Server, ExternalLink, PlayCircle, MessageCircle, MessagesSquare } from "lucide-react";
import { svEpisode, svServer } from "@/lib/sankavollerei";
import { toast } from "sonner";
import { CommentBox } from "@/components/CommentBox";
import { useAuth } from "@/lib/useAuth";
import { awardWatchXp, recordWatch } from "@/lib/social";
import { isCustomEpisodeId, parseCustomEpisodeId, useCustomAnime, makeCustomEpisodeId } from "@/lib/custom-anime";
import { GlobalChatPanel } from "@/components/GlobalChat";

export const Route = createFileRoute("/watch/$episodeId")({
  component: WatchPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="font-bold text-destructive">Gagal memuat episode.</p>
        <p className="text-xs text-muted-foreground mt-2">{(error as Error)?.message}</p>
        <Link to="/home" className="mt-4 inline-block text-primary underline">Kembali ke Home</Link>
      </div>
    </div>
  ),
});

function WatchPage() {
  const { episodeId } = Route.useParams();
  const router = useRouter();
  const nav = useNavigate();
  const { user } = useAuth();
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [activeServerLabel, setActiveServerLabel] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | undefined>();
  const [loadingServer, setLoadingServer] = useState(false);
  const [serverPickerOpen, setServerPickerOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [iframeFailed, setIframeFailed] = useState(false);
  const [chatTab, setChatTab] = useState<"episode" | "global">("episode");

  const isCustom = isCustomEpisodeId(episodeId);
  const parsed = isCustom ? parseCustomEpisodeId(episodeId) : null;
  const { data: customAnime } = useCustomAnime(parsed?.animeKey || "");

  const customEpisode = useMemo(() => {
    if (!parsed || !customAnime) return null;
    return customAnime.episodeList?.find((e) => e.id === parsed.epKey) || null;
  }, [parsed, customAnime]);

  const customData = useMemo(() => {
    if (!isCustom || !parsed || !customAnime || !customEpisode) return null;
    const eps = (customAnime.episodeList || []).slice().sort((a, b) => a.number - b.number);
    const idx = eps.findIndex((e) => e.id === parsed.epKey);
    return {
      title: `${customAnime.title} — ${customEpisode.title || `Episode ${customEpisode.number}`}`,
      poster: customAnime.cover,
      defaultStreamingUrl: customEpisode.videoUrl,
      servers: [] as { title: string; servers: { title: string; serverId: string }[] }[],
      prev: idx > 0 ? makeCustomEpisodeId(parsed.animeKey, eps[idx - 1].id) : undefined,
      next: idx >= 0 && idx < eps.length - 1 ? makeCustomEpisodeId(parsed.animeKey, eps[idx + 1].id) : undefined,
    };
  }, [isCustom, parsed, customAnime, customEpisode]);

  const { data: svData, isLoading: svLoading, isError, error } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => svEpisode(episodeId),
    enabled: !isCustom,
    staleTime: 5 * 60 * 1000,
  });

  const data = isCustom ? customData : svData;
  const isLoading = isCustom ? !customAnime : svLoading;
  const isCustomVideo = isCustom && !!customEpisode && /\.(mp4|webm|ogg)(\?|$)/i.test(customEpisode.videoUrl) || (customEpisode?.videoUrl || "").startsWith("data:video");

  // Reset when switching episodes
  useEffect(() => {
    setStreamUrl(undefined);
    setActiveServer(null);
    setActiveServerLabel(null);
    setIframeFailed(false);
  }, [episodeId]);

  useEffect(() => {
    if (data?.defaultStreamingUrl && !streamUrl) {
      setStreamUrl(data.defaultStreamingUrl);
      setActiveServerLabel("Default");
    }
    // Open all quality groups by default
    if (data?.servers?.length) {
      setOpenGroups((g) => {
        if (Object.keys(g).length) return g;
        const next: Record<string, boolean> = {};
        data.servers.forEach((s) => (next[s.title] = true));
        return next;
      });
    }
  }, [data, streamUrl]);

  // Award XP + record history when a stream actually plays
  useEffect(() => {
    if (!user || !episodeId || !streamUrl || !data) return;
    recordWatch(user.uid, {
      episodeId,
      title: data.title || episodeId,
      poster: data.poster,
    }).catch(() => {});
    const t = setTimeout(() => {
      awardWatchXp(user.uid, episodeId, 10)
        .then((ok) => { if (ok) toast.success("+10 XP"); })
        .catch(() => {});
    }, 30_000);
    return () => clearTimeout(t);
  }, [user, episodeId, streamUrl, data]);

  const pickServer = async (id: string, label: string) => {
    setLoadingServer(true);
    setActiveServer(id);
    setIframeFailed(false);
    try {
      const url = await svServer(id);
      if (!url) throw new Error("Server tidak mengembalikan URL.");
      setStreamUrl(url);
      setActiveServerLabel(label);
      toast.success(`Server ${label} aktif.`);
    } catch (e) {
      toast.error(`Gagal memuat server: ${(e as Error).message}`);
    } finally {
      setLoadingServer(false);
    }
  };

  const toggleGroup = (title: string) =>
    setOpenGroups((g) => ({ ...g, [title]: !g[title] }));

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.history.back()}
            aria-label="Kembali"
            className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-black tracking-wider">
            NEX<span className="text-primary">Z</span>HU
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-4">
        {isLoading && (
          <div className="aspect-video grid place-items-center bg-card rounded-xl border border-border">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {isError && (
          <p className="text-center text-destructive font-bold py-20">
            {(error as Error)?.message || "Gagal memuat data episode."}
          </p>
        )}
        {data && (
          <>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black relative">
              {streamUrl ? (
                isCustomVideo ? (
                  <video key={streamUrl} src={streamUrl} controls autoPlay className="w-full h-full" />
                ) : (
                  <iframe
                    key={streamUrl}
                    src={streamUrl}
                    title={data.title}
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                    onError={() => setIframeFailed(true)}
                    className="w-full h-full"
                  />
                )
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center text-muted-foreground text-sm p-6">
                  <div>
                    <PlayCircle className="h-10 w-10 mx-auto mb-2 text-primary" />
                    Pilih salah satu server di bawah untuk mulai menonton.
                  </div>
                </div>
              )}
              {loadingServer && (
                <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {streamUrl && (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  Sedang menonton via{" "}
                  <span className="text-primary font-bold">{activeServerLabel || "Default"}</span>
                </span>
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 h-8 rounded-md border border-border hover:border-primary hover:text-primary transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Buka di tab baru
                </a>
              </div>
            )}
            {iframeFailed && (
              <p className="mt-2 text-xs text-destructive">
                Server ini memblokir penyematan. Coba server lain atau buka di tab baru.
              </p>
            )}

            <h1 className="mt-4 text-lg sm:text-xl font-black">{data.title}</h1>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                disabled={!data.prev}
                onClick={() => data.prev && nav({ to: "/watch/$episodeId", params: { episodeId: data.prev } })}
                className="inline-flex items-center gap-1 h-10 px-4 rounded-lg bg-secondary border border-border text-sm font-bold disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition"
              >
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </button>
              <button
                disabled={!data.next}
                onClick={() => data.next && nav({ to: "/watch/$episodeId", params: { episodeId: data.next } })}
                className="inline-flex items-center gap-1 h-10 px-4 rounded-lg bg-secondary border border-border text-sm font-bold disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition"
              >
                Selanjutnya <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setServerPickerOpen((v) => !v)}
                className="ml-auto inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold glow-primary"
              >
                <Server className="h-4 w-4" />
                {serverPickerOpen ? "Tutup Server" : "Pilih Server"}
                <ChevronDown className={`h-4 w-4 transition ${serverPickerOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {serverPickerOpen && data.servers.length > 0 && (
              <section className="mt-4 rounded-2xl border border-border bg-card/70 p-5 animate-in fade-in slide-in-from-top-2">
                <h2 className="text-base font-black tracking-wider mb-3 uppercase flex items-center gap-3">
                  <span className="h-5 w-1.5 rounded-full bg-primary" />
                  Pilih Server
                </h2>
                <div className="space-y-3">
                  {data.servers.map((g) => {
                    const open = !!openGroups[g.title];
                    return (
                      <div key={g.title} className="rounded-xl border border-border overflow-hidden bg-secondary/40">
                        <button
                          onClick={() => toggleGroup(g.title)}
                          className="w-full flex items-center justify-between px-4 h-11 text-left"
                        >
                          <span className="text-xs font-black uppercase tracking-wider text-primary">{g.title}</span>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <div className="px-4 pb-3 flex flex-wrap gap-2">
                            {g.servers.map((s) => (
                              <button
                                key={s.serverId}
                                onClick={() => pickServer(s.serverId, `${g.title} • ${s.title}`)}
                                className={`px-3 h-9 rounded-lg text-xs font-bold border transition ${
                                  activeServer === s.serverId
                                    ? "bg-primary text-primary-foreground border-primary glow-primary"
                                    : "bg-background border-border hover:border-primary"
                                }`}
                              >
                                {s.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="mt-6 rounded-2xl border border-border bg-card/70 overflow-hidden">
              <div className="flex items-center gap-1 p-1 bg-background/40 border-b border-border">
                <button
                  onClick={() => setChatTab("episode")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-black uppercase tracking-wider transition ${chatTab === "episode" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <MessageCircle className="h-4 w-4" /> Komentar Episode
                </button>
                <button
                  onClick={() => setChatTab("global")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-black uppercase tracking-wider transition ${chatTab === "global" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <MessagesSquare className="h-4 w-4" /> Global Chat
                </button>
              </div>
              {chatTab === "episode" ? (
                <div className="p-1"><CommentBox scope={`ep:${episodeId}`} title="Komentar Episode" /></div>
              ) : (
                <GlobalChatPanel embedded title="Global Chat" maxHeight="h-[55vh]" />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
