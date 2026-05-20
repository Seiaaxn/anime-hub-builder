import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, Loader2, Camera, Pencil, Check, X, History, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import {
  useProfile,
  useFollowing,
  useFollowers,
  follow,
  unfollow,
  isMutual,
  upsertProfile,
  updateOwnProfile,
  useXp,
  useWatchHistory,
  fileToCompressedDataUrl,
} from "@/lib/social";
import { ensureKeypair } from "@/lib/crypto";
import { RoleBadge } from "@/components/Badges";

export const Route = createFileRoute("/u/$uid")({
  component: ProfilePage,
});

function formatWatchDate(ts: unknown): string {
  const n = typeof ts === "number" ? ts : typeof ts === "string" ? Number(ts) : NaN;
  if (!n || !Number.isFinite(n) || n <= 0) return "Baru saja";
  const d = new Date(n);
  if (isNaN(d.getTime())) return "Baru saja";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ProfilePage() {
  const { uid } = Route.useParams();
  const router = useRouter();
  const nav = useNavigate();
  const { user } = useAuth();
  const profile = useProfile(uid);
  const following = useFollowing(uid);
  const followers = useFollowers(uid);
  const myFollowing = useFollowing(user?.uid);
  const { xp, level, current, needed, progress } = useXp(uid);
  const history = useWatchHistory(uid);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Self profile sync (only fills missing fields — won't overwrite custom photo/name).
  useEffect(() => {
    if (!user) return;
    (async () => {
      const publicKey = await ensureKeypair(user.uid).catch(() => null);
      await upsertProfile({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        publicKey: publicKey ?? undefined,
      }).catch(() => {});
    })();
  }, [user]);

  const isMe = user?.uid === uid;
  const iFollow = !!user && myFollowing.includes(uid);

  const onToggleFollow = async () => {
    if (!user) { toast.error("Login dulu."); return; }
    if (isMe) return;
    setBusy(true);
    try {
      if (iFollow) {
        await unfollow(user.uid, uid);
        toast.success("Tidak mengikuti lagi.");
      } else {
        await follow(user.uid, uid);
        toast.success("Mengikuti.");
      }
    } finally {
      setBusy(false);
    }
  };

  const onChat = async () => {
    if (!user) { toast.error("Login dulu."); return; }
    if (isMe) return;
    const mutual = await isMutual(user.uid, uid);
    if (!mutual) {
      toast.error("Kalian harus saling follow dulu untuk chat.");
      return;
    }
    nav({ to: "/chat/$peerId", params: { peerId: uid } });
  };

  const onPickPhoto = () => fileRef.current?.click();

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    if (!f.type.startsWith("image/")) { toast.error("File harus gambar."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Maksimal 10MB."); return; }
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(f, 384, 0.82);
      await updateOwnProfile(user.uid, { photoURL: dataUrl });
      toast.success("Foto profil diperbarui.");
    } catch (err) {
      toast.error("Gagal mengubah foto: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const startEditName = () => {
    setNameDraft(profile?.displayName || "");
    setEditingName(true);
  };

  const saveName = async () => {
    if (!user) return;
    const v = nameDraft.trim();
    if (!v) { toast.error("Nama tidak boleh kosong."); return; }
    if (v.length > 40) { toast.error("Maksimal 40 karakter."); return; }
    try {
      await updateOwnProfile(user.uid, { displayName: v });
      setEditingName(false);
      toast.success("Nama diperbarui.");
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  const startEditBio = () => {
    setBioDraft(profile?.bio || "");
    setEditingBio(true);
  };

  const saveBio = async () => {
    if (!user) return;
    const v = bioDraft.trim().slice(0, 200);
    try {
      await updateOwnProfile(user.uid, { bio: v || null });
      setEditingBio(false);
      toast.success("Bio diperbarui.");
    } catch (err) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} aria-label="Kembali" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-black tracking-wider">NEX<span className="text-primary">Z</span>HU</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        <div className="rounded-2xl border border-border bg-card/60 p-6 text-center">
          {/* Avatar with optional edit */}
          <div className="relative inline-block">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="mx-auto h-24 w-24 rounded-full border-2 border-primary object-cover" />
            ) : (
              <div className="mx-auto h-24 w-24 rounded-full bg-secondary grid place-items-center text-primary font-black text-3xl">
                {(profile.displayName || "U")[0]}
              </div>
            )}
            {isMe && (
              <>
                <button
                  type="button"
                  onClick={onPickPhoto}
                  disabled={uploading}
                  aria-label="Ubah foto profil"
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center border-2 border-background disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  onChange={onPhotoChange}
                />
              </>
            )}
          </div>

          {/* Name with optional edit */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            {editingName ? (
              <>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={40}
                  autoFocus
                  className="bg-secondary rounded-lg px-3 h-9 text-center font-bold outline-none border border-border focus:border-primary"
                />
                <button onClick={saveName} aria-label="Simpan" className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingName(false)} aria-label="Batal" className="h-9 w-9 grid place-items-center rounded-lg bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black">{profile.displayName || "Pengguna"}</h1>
                <RoleBadge email={profile.email} uid={uid} size="md" />
                {isMe && (
                  <button onClick={startEditName} aria-label="Ubah nama" className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>

          {/* Bio */}
          <div className="mt-4 max-w-md mx-auto">
            {editingBio ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  maxLength={200}
                  rows={3}
                  autoFocus
                  placeholder="Tulis sesuatu tentang dirimu..."
                  className="w-full bg-secondary rounded-lg p-3 text-sm outline-none border border-border focus:border-primary resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{bioDraft.length}/200</span>
                  <div className="flex gap-2">
                    <button onClick={saveBio} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                      <Check className="h-3.5 w-3.5" /> Simpan
                    </button>
                    <button onClick={() => setEditingBio(false)} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-secondary text-xs font-bold">
                      <X className="h-3.5 w-3.5" /> Batal
                    </button>
                  </div>
                </div>
              </div>
            ) : profile.bio ? (
              <div className="group relative rounded-lg bg-secondary/40 border border-border p-3 text-sm whitespace-pre-wrap">
                {profile.bio}
                {isMe && (
                  <button onClick={startEditBio} aria-label="Ubah bio" className="absolute top-1 right-1 h-7 w-7 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : isMe ? (
              <button onClick={startEditBio} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
                <FileText className="h-3.5 w-3.5" /> Tambah bio
              </button>
            ) : null}
          </div>

          {/* Level bar */}
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-primary">Level {level}</span>
              <span className="text-muted-foreground">{current}/{needed} XP</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Total {xp} XP</div>
          </div>

          {/* Counters */}
          <div className="mt-5 flex items-center justify-center gap-8 text-sm">
            <Link to="/u/$uid/followers" params={{ uid }} className="hover:text-primary">
              <b className="text-lg">{followers.length}</b>
              <div className="text-xs text-muted-foreground uppercase">Pengikut</div>
            </Link>
            <Link to="/u/$uid/following" params={{ uid }} className="hover:text-primary">
              <b className="text-lg">{following.length}</b>
              <div className="text-xs text-muted-foreground uppercase">Mengikuti</div>
            </Link>
            <div>
              <b className="text-lg">{history.length}</b>
              <div className="text-xs text-muted-foreground uppercase">Tontonan</div>
            </div>
          </div>

          {!isMe && (
            <div className="mt-5 flex justify-center gap-2">
              <button
                disabled={busy || !user}
                onClick={onToggleFollow}
                className={`inline-flex items-center gap-2 h-10 px-5 rounded-xl font-bold disabled:opacity-50 ${
                  iFollow
                    ? "bg-secondary border border-border"
                    : "bg-primary text-primary-foreground glow-primary"
                }`}
              >
                {iFollow ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {iFollow ? "Mengikuti" : "Ikuti"}
              </button>
              <button
                onClick={onChat}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-secondary border border-border font-bold"
              >
                <MessageCircle className="h-4 w-4" /> Chat
              </button>
            </div>
          )}
        </div>

        {/* Watch history */}
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">
            <History className="h-4 w-4" /> Riwayat Menonton
          </h2>
          {history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10 rounded-xl border border-dashed border-border">
              Belum ada riwayat tontonan.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {history.map((h) => (
                <Link
                  key={h.episodeId}
                  to="/watch/$episodeId"
                  params={{ episodeId: h.episodeId }}
                  className="group rounded-xl overflow-hidden border border-border bg-card/40 hover:border-primary transition-colors"
                >
                  <div className="aspect-video bg-secondary overflow-hidden">
                    {h.poster ? (
                      <img src={h.poster} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : null}
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-bold line-clamp-2">{h.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatWatchDate(h.ts)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
                  }
                    
