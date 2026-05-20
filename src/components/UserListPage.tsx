import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useFollowers, useFollowing, useProfile } from "@/lib/social";

function Row({ uid }: { uid: string }) {
  const p = useProfile(uid);
  return (
    <Link
      to="/u/$uid"
      params={{ uid }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary border border-border bg-card/40"
    >
      {p?.photoURL ? (
        <img src={p.photoURL} alt="" className="h-10 w-10 rounded-full" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-primary font-black">
          {(p?.displayName || "U")[0]}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-bold truncate">{p?.displayName || "Pengguna"}</div>
        <div className="text-xs text-muted-foreground truncate">{p?.email || uid}</div>
      </div>
    </Link>
  );
}

export function UserListPage({ uid, mode }: { uid: string; mode: "followers" | "following" }) {
  const router = useRouter();
  const followers = useFollowers(mode === "followers" ? uid : undefined);
  const following = useFollowing(mode === "following" ? uid : undefined);
  const ids = mode === "followers" ? followers : following;
  const title = mode === "followers" ? "Pengikut" : "Mengikuti";

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.history.back()}
            aria-label="Kembali"
            className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-black">{title}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 mt-4 space-y-2">
        {ids.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Belum ada {title.toLowerCase()}.</p>
        ) : (
          ids.map((id) => <Row key={id} uid={id} />)
        )}
      </main>
    </div>
  );
}
