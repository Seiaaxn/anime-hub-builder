import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Shield, Crown, Ban, Tag as TagIcon, Search, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import { isAdmin } from "@/lib/roles";
import { useAllProfiles, setUserFlags } from "@/lib/social";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/Badges";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

function AdminPanel() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const users = useAllProfiles();
  const [q, setQ] = useState("");
  const [tagDraft, setTagDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const allowed = isAdmin(user?.email);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = [...users].sort((a, b) =>
      (a.displayName || "").localeCompare(b.displayName || ""),
    );
    if (!s) return list;
    return list.filter(
      (u) =>
        (u.displayName || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        u.uid.toLowerCase().includes(s),
    );
  }, [users, q]);

  const togglePremium = async (uid: string, current?: boolean) => {
    setBusy(uid + ":premium");
    try {
      await setUserFlags(uid, { premium: !current });
      toast.success(current ? "Premium dicabut." : "Premium diberikan.");
    } catch (e) {
      toast.error("Gagal: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const toggleBan = async (uid: string, current?: boolean) => {
    if (!current && !confirm("Ban akun ini? Mereka tidak akan bisa berkomentar.")) return;
    setBusy(uid + ":ban");
    try {
      await setUserFlags(uid, { banned: !current });
      toast.success(current ? "Ban dicabut." : "Akun dibanned.");
    } catch (e) {
      toast.error("Gagal: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveTag = async (uid: string) => {
    const v = (tagDraft[uid] ?? "").trim().slice(0, 20);
    setBusy(uid + ":tag");
    try {
      await setUserFlags(uid, { tag: v || null });
      toast.success(v ? `Tag diset: ${v}` : "Tag dihapus.");
    } catch (e) {
      toast.error("Gagal: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center max-w-sm">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="mt-3 text-xl font-black">Akses Ditolak</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Halaman ini hanya untuk administrator.
          </p>
          <Link
            to="/home"
            className="mt-4 inline-block text-primary underline text-sm"
          >
            Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-black tracking-wider flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" /> ADMIN PANEL
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama / email / uid..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Total {users.length} pengguna terdaftar.
          </p>
        </div>

        <ul className="mt-4 space-y-3">
          {filtered.map((u) => {
            const f = u.flags || {};
            return (
              <li
                key={u.uid}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <Link to="/u/$uid" params={{ uid: u.uid }} className="shrink-0">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center font-black text-primary">
                        {(u.displayName || "U")[0]}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to="/u/$uid"
                        params={{ uid: u.uid }}
                        className="font-bold hover:text-primary truncate"
                      >
                        {u.displayName || "Pengguna"}
                      </Link>
                      <RoleBadge email={u.email} uid={u.uid} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {u.uid}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={f.premium ? "default" : "outline"}
                    disabled={busy === u.uid + ":premium"}
                    onClick={() => togglePremium(u.uid, f.premium)}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    {f.premium ? "Cabut Premium" : "Beri Premium"}
                  </Button>
                  <Button
                    size="sm"
                    variant={f.banned ? "destructive" : "outline"}
                    disabled={busy === u.uid + ":ban"}
                    onClick={() => toggleBan(u.uid, f.banned)}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    {f.banned ? "Cabut Ban" : "Ban Akun"}
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={f.tag || "Set tag/label (cth: OG, VIP, Mod)..."}
                    value={tagDraft[u.uid] ?? ""}
                    onChange={(e) =>
                      setTagDraft((p) => ({ ...p, [u.uid]: e.target.value }))
                    }
                    maxLength={20}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy === u.uid + ":tag"}
                    onClick={() => saveTag(u.uid)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="text-center text-sm text-muted-foreground py-10">
              Tidak ada pengguna.
            </li>
          )}
        </ul>
      </main>
    </div>
  );
                           }
            
