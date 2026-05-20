import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Shield, Loader2, Upload, Trash2, Film, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ref, push, set, onValue, remove, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { isAdmin } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fileToCompressedDataUrl } from "@/lib/social";
import { addCustomEpisode, deleteCustomEpisode, type CustomCategory } from "@/lib/custom-anime";

export const Route = createFileRoute("/admin/upload-anime")({
  component: AdminUploadAnime,
});

const GENRE_OPTIONS = [
  "action", "adventure", "comedy", "drama", "fantasy",
  "isekai", "romance", "sci-fi", "slice-of-life", "thriller",
];

const CATEGORIES: { value: CustomCategory; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "movies", label: "Movies" },
];

type EpRow = { id: string; number: number; title?: string; videoUrl: string; thumbnail?: string };
type AnimeRow = {
  id: string;
  title: string;
  type: string;
  year: number;
  episodes: number;
  cover?: string;
  banner?: string;
  synopsis?: string;
  genres?: string[];
  category?: CustomCategory;
  episodes_list?: Record<string, Omit<EpRow, "id">>;
  ts?: number;
};

function AdminUploadAnime() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const allowed = isAdmin(user?.email);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"TV" | "MOVIE" | "ONA" | "OVA">("TV");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [episodes, setEpisodes] = useState<number>(12);
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [category, setCategory] = useState<CustomCategory>("ongoing");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<AnimeRow[]>([]);
  const [expandedAnime, setExpandedAnime] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    const unsub = onValue(ref(db, "customAnimes"), (snap) => {
      const arr: AnimeRow[] = [];
      snap.forEach((c) => {
        arr.push({ id: c.key!, ...(c.val() as Omit<AnimeRow, "id">) });
      });
      arr.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
      setList(arr);
    });
    return () => unsub();
  }, [allowed]);

  const toggleGenre = (g: string) =>
    setGenres((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));

  const onPickImage = (setter: (v: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("File harus gambar.");
    if (f.size > 10 * 1024 * 1024) return toast.error("Maksimal 10MB.");
    try {
      const url = await fileToCompressedDataUrl(f, 720, 0.85);
      setter(url);
      toast.success("Gambar dimuat.");
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed || !user) return;
    if (!title.trim()) return toast.error("Judul wajib diisi.");
    if (!coverUrl) return toast.error("Cover wajib diisi.");
    setBusy(true);
    try {
      const newRef = push(ref(db, "customAnimes"));
      await set(newRef, {
        title: title.trim(),
        type, year, episodes,
        synopsis: synopsis.trim(),
        cover: coverUrl,
        banner: bannerUrl || coverUrl,
        genres,
        category,
        uploadedBy: user.uid,
        ts: serverTimestamp(),
      });
      toast.success("Anime diupload & langsung muncul di Home.");
      setTitle(""); setSynopsis(""); setCoverUrl(""); setBannerUrl(""); setGenres([]);
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus anime ini?")) return;
    try {
      await remove(ref(db, `customAnimes/${id}`));
      toast.success("Dihapus.");
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!allowed) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center max-w-sm">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="mt-3 text-xl font-black">Akses Ditolak</h1>
          <p className="text-sm text-muted-foreground mt-1">Halaman ini hanya untuk administrator.</p>
          <Link to="/home" className="mt-4 inline-block text-primary underline text-sm">Kembali ke Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-black tracking-wider flex items-center gap-2"><Film className="h-5 w-5 text-primary" /> UPLOAD ANIME</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Judul</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul anime" required />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Tipe</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm">
                <option value="TV">TV</option><option value="MOVIE">MOVIE</option>
                <option value="ONA">ONA</option><option value="OVA">OVA</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Kategori Home</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as CustomCategory)} className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Tahun</label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Jumlah Episode</label>
              <Input type="number" value={episodes} onChange={(e) => setEpisodes(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Sinopsis</label>
            <Textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={4} placeholder="Sinopsis anime..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Cover (wajib)</label>
              <div className="flex gap-2 items-start">
                <Input value={coverUrl.startsWith("data:") ? "" : coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL atau upload" />
                <label className="h-10 px-3 rounded-md bg-secondary border border-border grid place-items-center cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={onPickImage(setCoverUrl)} />
                </label>
              </div>
              {coverUrl && <img src={coverUrl} alt="" className="mt-2 h-32 rounded object-cover" />}
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Banner (opsional)</label>
              <div className="flex gap-2 items-start">
                <Input value={bannerUrl.startsWith("data:") ? "" : bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="URL atau upload" />
                <label className="h-10 px-3 rounded-md bg-secondary border border-border grid place-items-center cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={onPickImage(setBannerUrl)} />
                </label>
              </div>
              {bannerUrl && <img src={bannerUrl} alt="" className="mt-2 h-32 rounded object-cover" />}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button key={g} type="button" onClick={() => toggleGenre(g)} className={`text-xs px-3 h-8 rounded-full border ${genres.includes(g) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" /> Upload Anime</>}
          </Button>
        </form>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">Anime Terupload ({list.length})</h2>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 border border-dashed border-border rounded-xl">Belum ada anime.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((a) => {
                const eps = a.episodes_list
                  ? Object.entries(a.episodes_list).map(([id, v]) => ({ id, ...v })).sort((x, y) => x.number - y.number)
                  : [];
                const open = expandedAnime === a.id;
                return (
                  <li key={a.id} className="rounded-xl border border-border bg-card/40 overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className="h-16 w-12 rounded bg-secondary overflow-hidden shrink-0">
                        {a.cover && <img src={a.cover} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold line-clamp-1">{a.title}</div>
                        <div className="text-[10px] text-muted-foreground">{a.type} • {a.year} • {eps.length}/{a.episodes} eps • {a.category || "—"}</div>
                      </div>
                      <button onClick={() => setExpandedAnime(open ? null : a.id)} className="h-9 px-3 rounded-md bg-secondary border border-border text-xs font-bold inline-flex items-center gap-1">
                        Episode <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
                      </button>
                      <button onClick={() => del(a.id)} className="h-9 w-9 grid place-items-center rounded-md bg-destructive/10 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {open && (
                      <EpisodeManager animeKey={a.id} episodes={eps} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function EpisodeManager({ animeKey, episodes }: { animeKey: string; episodes: EpRow[] }) {
  const [number, setNumber] = useState<number>(episodes.length ? episodes[episodes.length - 1].number + 1 : 1);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const onPickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      return toast.error("File terlalu besar (max 25MB). Untuk file besar gunakan URL eksternal.");
    }
    try {
      const reader = new FileReader();
      reader.onload = () => setVideoUrl(String(reader.result));
      reader.readAsDataURL(f);
      toast.success("Video dimuat.");
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  const addEp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return toast.error("Video URL atau file wajib diisi.");
    if (!number || number < 1) return toast.error("Nomor episode tidak valid.");
    setBusy(true);
    try {
      await addCustomEpisode(animeKey, { number, title: title.trim() || `Episode ${number}`, videoUrl });
      toast.success(`Episode ${number} ditambahkan.`);
      setTitle(""); setVideoUrl(""); setNumber(number + 1);
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const delEp = async (epId: string) => {
    if (!confirm("Hapus episode ini?")) return;
    try {
      await deleteCustomEpisode(animeKey, epId);
      toast.success("Episode dihapus.");
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  return (
    <div className="border-t border-border p-3 space-y-3 bg-background/40">
      <form onSubmit={addEp} className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-3 sm:col-span-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">No.</label>
          <Input type="number" value={number} onChange={(e) => setNumber(Number(e.target.value))} className="h-9" />
        </div>
        <div className="col-span-9 sm:col-span-4">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Judul (opsional)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul episode" className="h-9" />
        </div>
        <div className="col-span-12 sm:col-span-5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Video (URL atau File ≤25MB)</label>
          <div className="flex gap-1">
            <Input value={videoUrl.startsWith("data:") ? "(file dipilih)" : videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="h-9" />
            <label className="h-9 px-3 rounded-md bg-secondary border border-border grid place-items-center cursor-pointer shrink-0">
              <Upload className="h-3.5 w-3.5" />
              <input type="file" accept="video/*" className="hidden" onChange={onPickVideo} />
            </label>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-1 flex sm:items-end">
          <Button type="submit" disabled={busy} className="h-9 w-full mt-4 sm:mt-0">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </form>

      {episodes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Belum ada episode.</p>
      ) : (
        <ul className="space-y-1">
          {episodes.map((e) => (
            <li key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/60 border border-border">
              <span className="text-xs font-black w-8 text-primary">{String(e.number).padStart(2, "0")}</span>
              <span className="text-xs flex-1 truncate">{e.title || `Episode ${e.number}`}</span>
              <button onClick={() => delEp(e.id)} className="h-7 w-7 grid place-items-center rounded text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
