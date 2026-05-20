import { useEffect, useRef, useState } from "react";
import { ref, push, onValue, query, limitToLast, serverTimestamp, remove } from "firebase/database";
import { MessageCircle, Send, X, Loader2, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { isAdmin } from "@/lib/roles";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type GlobalMsg = {
  id: string;
  uid: string;
  name: string;
  photo?: string | null;
  text: string;
  ts: number;
};

const PATH = "globalChat";

export function useGlobalChat(max = 100) {
  const [messages, setMessages] = useState<GlobalMsg[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(ref(db, PATH), limitToLast(max));
    const unsub = onValue(q, (snap) => {
      const arr: GlobalMsg[] = [];
      snap.forEach((c) => {
        const v = c.val() as Omit<GlobalMsg, "id">;
        arr.push({ id: c.key!, ...v });
      });
      arr.sort((a, b) => a.ts - b.ts);
      setMessages(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [max]);
  return { messages, loading };
}

export async function sendGlobalMessage(opts: {
  uid: string;
  name: string;
  photo?: string | null;
  text: string;
}) {
  const text = opts.text.trim();
  if (!text) return;
  if (text.length > 500) throw new Error("Pesan terlalu panjang (max 500).");
  const r = push(ref(db, PATH));
  await Promise.resolve(
    (await import("firebase/database")).set(r, {
      uid: opts.uid,
      name: opts.name,
      photo: opts.photo ?? null,
      text,
      ts: serverTimestamp(),
    }),
  );
}

const fmt = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function GlobalChatPanel({
  embedded = false,
  className = "",
  title = "Global Chat",
  maxHeight = "h-[60vh]",
}: {
  embedded?: boolean;
  className?: string;
  title?: string;
  maxHeight?: string;
}) {
  const { user } = useAuth();
  const { messages, loading } = useGlobalChat();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const admin = isAdmin(user?.email);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Login dulu untuk chat.");
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendGlobalMessage({
        uid: user.uid,
        name: user.displayName || user.email || "Anon",
        photo: user.photoURL,
        text: draft,
      });
      setDraft("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const del = async (id: string) => {
    try {
      await remove(ref(db, `${PATH}/${id}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className={`flex flex-col ${embedded ? "" : "rounded-2xl border border-border bg-card/90 backdrop-blur-xl"} ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-wider">{title}</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{messages.length} pesan</span>
      </div>
      <div ref={scrollRef} className={`${maxHeight} overflow-y-auto p-3 space-y-2`}>
        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10">Belum ada pesan. Sapa yang lain!</p>
        ) : (
          messages.map((m) => {
            const mine = user?.uid === m.uid;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <Link to="/u/$uid" params={{ uid: m.uid }} className="shrink-0">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="h-7 w-7 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-secondary border border-border grid place-items-center text-[10px] font-bold">
                      {m.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </Link>
                <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-bold">{mine ? "Kamu" : m.name}</span>
                    <span>{fmt(m.ts)}</span>
                    {(mine || admin) && (
                      <button onClick={() => del(m.id)} className="hover:text-destructive" aria-label="Hapus">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className={`mt-0.5 px-3 py-1.5 rounded-2xl text-sm break-words ${mine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-border">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? "Tulis pesan global..." : "Login untuk chat..."}
          disabled={!user || sending}
          maxLength={500}
          className="flex-1 h-10 rounded-lg bg-input/60 border border-border px-3 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button type="submit" disabled={!user || sending || !draft.trim()} className="h-10 w-10 grid place-items-center rounded-lg bg-primary text-primary-foreground glow-primary disabled:opacity-40">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

// Floating chat button + popup panel, intended for /home.
export function GlobalChatFloating() {
  const [open, setOpen] = useState(false);
  const { messages } = useGlobalChat(20);
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Global Chat"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xl glow-primary hover:scale-105 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black grid place-items-center border-2 border-background">
            {Math.min(messages.length, 99)}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[92vw] max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <GlobalChatPanel maxHeight="h-[55vh]" />
        </div>
      )}
    </>
  );
}
