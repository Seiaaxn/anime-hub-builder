import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Loader2, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import {
  chatId, isMutual, useChatMessages, useProfile, sendChatMessage,
  getPublicKey, upsertProfile, type ChatMessage,
} from "@/lib/social";
import { ensureKeypair, encryptText, decryptText } from "@/lib/crypto";
import { RoleBadge } from "@/components/Badges";

export const Route = createFileRoute("/chat/$peerId")({
  component: ChatPage,
});

function ChatPage() {
  const { peerId } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();
  const peer = useProfile(peerId);
  const cid = user ? chatId(user.uid, peerId) : undefined;
  const msgs = useChatMessages(cid);
  const [text, setText] = useState("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [peerPub, setPeerPub] = useState<JsonWebKey | null>(null);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const endRef = useRef<HTMLDivElement>(null);

  // Make sure our own keypair is published.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const publicKey = await ensureKeypair(user.uid).catch(() => null);
      if (publicKey) {
        upsertProfile({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          publicKey,
        }).catch(() => {});
      }
    })();
  }, [user]);

  // Mutual check + fetch peer public key.
  useEffect(() => {
    if (!user) { setAllowed(false); return; }
    isMutual(user.uid, peerId).then(setAllowed).catch(() => setAllowed(false));
    getPublicKey(peerId).then(setPeerPub).catch(() => setPeerPub(null));
  }, [user, peerId]);

  // Decrypt incoming messages.
  useEffect(() => {
    if (!user || !peerPub) return;
    let alive = true;
    (async () => {
      const updates: Record<string, string> = {};
      for (const m of msgs) {
        if (decrypted[m.id] !== undefined) continue;
        if (m.iv && m.ct) {
          try {
            updates[m.id] = await decryptText(user.uid, peerPub, { iv: m.iv, ct: m.ct });
          } catch {
            updates[m.id] = "🔒 Pesan terenkripsi (tidak bisa dibuka di perangkat ini).";
          }
        } else if (m.text) {
          updates[m.id] = m.text;
        }
      }
      if (alive && Object.keys(updates).length) {
        setDecrypted((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => { alive = false; };
  }, [msgs, peerPub, user, decrypted]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const ready = useMemo(() => !!user && !!peerPub && allowed === true, [user, peerPub, allowed]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cid || !text.trim()) return;
    if (!allowed) { toast.error("Kalian belum saling follow."); return; }
    if (!peerPub) { toast.error("Kunci publik teman belum siap."); return; }
    const plain = text.trim().slice(0, 1000);
    try {
      const { iv, ct } = await encryptText(user.uid, peerPub, plain);
      await sendChatMessage(cid, {
        uid: user.uid,
        name: user.displayName ?? "Anon",
        iv,
        ct,
      } as Omit<ChatMessage, "id" | "ts">);
      setText("");
    } catch (err) {
      toast.error("Gagal mengenkripsi pesan.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} aria-label="Kembali" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {peer?.photoURL ? (
            <img src={peer.photoURL} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-secondary" />
          )}
          <Link to="/u/$uid" params={{ uid: peerId }} className="font-bold flex items-center gap-2">
            {peer?.displayName || "Pengguna"}
            <RoleBadge email={peer?.email} />
          </Link>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
            <Lock className="h-3 w-3" /> E2E
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 overflow-y-auto">
        <p className="text-center text-[11px] text-muted-foreground mb-4 inline-flex items-center gap-1 mx-auto w-full justify-center">
          <Lock className="h-3 w-3" /> Pesan dienkripsi end-to-end dengan ECDH P-256 + AES-GCM.
        </p>
        {!user ? (
          <p className="text-center text-sm text-muted-foreground py-20">Login dulu untuk chat.</p>
        ) : allowed === null ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !allowed ? (
          <p className="text-center text-sm text-destructive py-20">
            Kalian harus saling follow dulu untuk bisa chat.
          </p>
        ) : !peerPub ? (
          <p className="text-center text-sm text-muted-foreground py-20">
            Teman ini belum pernah membuka chat (kunci publik belum tersedia).
          </p>
        ) : (
          <ul className="space-y-2">
            {msgs.length === 0 && (
              <li className="text-center text-xs text-muted-foreground py-10">Belum ada pesan, sapa duluan!</li>
            )}
            {msgs.map((m) => {
              const mine = m.uid === user.uid;
              const body = decrypted[m.id] ?? "🔒 Mendekripsi…";
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary border border-border rounded-bl-sm"
                  }`}>
                    {!mine && <p className="text-[10px] font-bold opacity-70 mb-0.5">{m.name}</p>}
                    <p className="break-words whitespace-pre-wrap">{body}</p>
                  </div>
                </li>
              );
            })}
            <div ref={endRef} />
          </ul>
        )}
      </main>

      {ready && (
        <form onSubmit={send} className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border px-4 py-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis pesan terenkripsi..."
            maxLength={1000}
            className="flex-1 h-11 rounded-xl bg-input/60 border border-border px-4 text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" className="h-11 w-11 grid place-items-center rounded-xl bg-primary text-primary-foreground glow-primary">
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
