import { useEffect, useState } from "react";
import {
  ref,
  push,
  onValue,
  serverTimestamp,
  query,
  limitToLast,
  set,
  remove,
} from "firebase/database";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/Badges";
import { isAdmin } from "@/lib/roles";
import { useUserFlags } from "@/lib/social";

type Reply = {
  id: string;
  uid: string;
  name: string;
  email?: string | null;
  photo?: string | null;
  text: string;
  ts: number;
};

type Comment = {
  id: string;
  uid: string;
  name: string;
  email?: string | null;
  photo?: string | null;
  text: string;
  ts: number;
  likes?: Record<string, true>;
  replies?: Record<string, Omit<Reply, "id">>;
};

const fmtTime = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return sameDay
    ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export function CommentBox({
  scope = "global",
  title = "Komentar",
}: {
  scope?: string;
  title?: string;
} = {}) {
  const { user, signInGoogle, logout } = useAuth();
  const path = `comments/${scope}`;
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const viewerIsAdmin = isAdmin(user?.email);
  const myFlags = useUserFlags(user?.uid);
  const banned = !!myFlags.banned;

  useEffect(() => {
    const q = query(ref(db, path), limitToLast(50));
    const unsub = onValue(q, (snap) => {
      const list: Comment[] = [];
      snap.forEach((c) => {
        list.push({ id: c.key!, ...(c.val() as Omit<Comment, "id">) });
      });
      setComments(list.reverse());
    });
    return () => unsub();
  }, [path]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Login dulu untuk berkomentar.");
      return signInGoogle();
    }
    if (banned) {
      toast.error("Akun Anda telah dibanned dan tidak bisa berkomentar.");
      return;
    }
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      await push(ref(db, path), {
        uid: user.uid,
        name: user.displayName ?? "Anon",
        email: user.email ?? null,
        photo: user.photoURL ?? null,
        text: value.slice(0, 500),
        ts: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      toast.error("Gagal mengirim: " + (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (c: Comment) => {
    if (!user) {
      toast.error("Login dulu untuk menyukai komentar.");
      return signInGoogle();
    }
    const liked = c.likes?.[user.uid];
    const likeRef = ref(db, `${path}/${c.id}/likes/${user.uid}`);
    if (liked) await remove(likeRef);
    else await set(likeRef, true);
  };

  const sendReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;
    if (banned) {
      toast.error("Akun Anda telah dibanned.");
      return;
    }
    try {
      await push(ref(db, `${path}/${commentId}/replies`), {
        uid: user.uid,
        name: user.displayName ?? "Anon",
        email: user.email ?? null,
        photo: user.photoURL ?? null,
        text: replyText.trim().slice(0, 500),
        ts: serverTimestamp(),
      });
      setReplyText("");
      setOpenReply(null);
    } catch (err) {
      toast.error("Gagal mengirim balasan: " + (err as Error).message);
    }
  };

  const deleteComment = async (c: Comment) => {
    if (!user) return;
    if (!viewerIsAdmin && c.uid !== user.uid) return;
    if (!confirm("Hapus komentar ini?")) return;
    await remove(ref(db, `${path}/${c.id}`));
    toast.success("Komentar dihapus.");
  };

  const deleteReply = async (commentId: string, reply: Reply) => {
    if (!user) return;
    if (!viewerIsAdmin && reply.uid !== user.uid) return;
    if (!confirm("Hapus balasan ini?")) return;
    await remove(ref(db, `${path}/${commentId}/replies/${reply.id}`));
  };

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        {user ? (
          <div className="flex items-center gap-2 text-sm">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
            )}
            <span className="text-muted-foreground hidden sm:inline">{user.displayName}</span>
            <RoleBadge email={user.email} uid={user.uid} />
            <Button size="sm" variant="ghost" onClick={() => logout()}>
              Keluar
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => signInGoogle()}>
            Masuk dengan Google
          </Button>
        )}
      </div>

      {banned && (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Akun Anda telah dibanned oleh admin dan tidak dapat berkomentar.
        </p>
      )}

      <form onSubmit={send} className="mb-4 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            user
              ? banned
                ? "Anda dibanned dan tidak bisa berkomentar"
                : "Tulis komentar..."
              : "Login dulu untuk berkomentar..."
          }
          maxLength={500}
          disabled={banned || sending}
        />
        <Button type="submit" disabled={banned || sending || !text.trim()}>
          {sending ? "Mengirim..." : "Kirim"}
        </Button>
      </form>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-muted-foreground">
            Belum ada komentar. Jadilah yang pertama!
          </li>
        )}
        {comments.map((c) => {
          const likeCount = c.likes ? Object.keys(c.likes).length : 0;
          const liked = !!(user && c.likes?.[user.uid]);
          const replies: Reply[] = c.replies
            ? Object.entries(c.replies)
                .map(([id, r]) => ({ id, ...r }))
                .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
            : [];
          const canDelete = !!user && (viewerIsAdmin || c.uid === user.uid);

          return (
            <li key={c.id} className="rounded-lg bg-background/60 p-3">
              <div className="flex gap-3">
                <Link
                  to="/u/$uid"
                  params={{ uid: c.uid }}
                  className="shrink-0"
                  aria-label={`Lihat profil ${c.name}`}
                >
                  {c.photo ? (
                    <img src={c.photo} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/30 grid place-items-center text-xs font-black text-primary">
                      {c.name?.[0] ?? "U"}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to="/u/$uid"
                      params={{ uid: c.uid }}
                      className="text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    <RoleBadge email={c.email} uid={c.uid} />
                    <span className="text-[10px] text-muted-foreground">
                      {fmtTime(c.ts)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => deleteComment(c)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground break-words mt-0.5">
                    {c.text}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      onClick={() => toggleLike(c)}
                      className={`flex items-center gap-1 transition ${
                        liked ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-destructive" : ""}`} />
                      {likeCount}
                    </button>
                    <button
                      onClick={() => {
                        if (!user) {
                          toast.error("Login dulu untuk membalas.");
                          return signInGoogle();
                        }
                        setOpenReply(openReply === c.id ? null : c.id);
                        setReplyText("");
                      }}
                      className="flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
                    >
                      <MessageCircle className="h-4 w-4" /> Balas
                    </button>
                  </div>

                  {openReply === c.id && user && !banned && (
                    <form onSubmit={(e) => sendReply(e, c.id)} className="mt-2 flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Balas ke ${c.name}...`}
                        maxLength={500}
                        autoFocus
                      />
                      <Button type="submit" size="sm">
                        Kirim
                      </Button>
                    </form>
                  )}

                  {replies.length > 0 && (
                    <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
                      {replies.map((r) => {
                        const canDelReply =
                          !!user && (viewerIsAdmin || r.uid === user.uid);
                        return (
                          <li key={r.id} className="flex gap-2">
                            <Link
                              to="/u/$uid"
                              params={{ uid: r.uid }}
                              className="shrink-0"
                            >
                              {r.photo ? (
                                <img src={r.photo} alt="" className="h-6 w-6 rounded-full" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-primary/30 grid place-items-center text-[10px] font-black text-primary">
                                  {r.name?.[0] ?? "U"}
                                </div>
                              )}
                            </Link>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold flex items-center gap-1.5 flex-wrap">
                                <Link
                                  to="/u/$uid"
                                  params={{ uid: r.uid }}
                                  className="hover:text-primary"
                                >
                                  {r.name}
                                </Link>
                                <RoleBadge email={r.email} uid={r.uid} />
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  {fmtTime(r.ts)}
                                </span>
                                {canDelReply && (
                                  <button
                                    onClick={() => deleteReply(c.id, r)}
                                    className="ml-auto text-muted-foreground hover:text-destructive"
                                    aria-label="Hapus balasan"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground break-words">
                                {r.text}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
