import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Menu, Shuffle, Film, Star, Tv, Home as HomeIcon, Search as SearchIcon,
  Heart, MessageSquare, LogIn, LogOut, Tag, User as UserIcon, Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/lib/social";
import { isAdmin } from "@/lib/roles";
import { toast } from "sonner";

const GENRES: { label: string; id: string }[] = [
  { label: "Action", id: "action" },
  { label: "Adventure", id: "adventure" },
  { label: "Comedy", id: "comedy" },
  { label: "Drama", id: "drama" },
  { label: "Fantasy", id: "fantasy" },
  { label: "Isekai", id: "isekai" },
  { label: "Romance", id: "romance" },
  { label: "Sci-Fi", id: "sci-fi" },
  { label: "Slice of Life", id: "slice-of-life" },
  { label: "Thriller", id: "thriller" },
];

export function SideMenu({
  trigger,
  onRandom,
  onMovies,
  onPopular,
  onGenre,
}: {
  trigger?: React.ReactNode;
  onRandom?: () => void;
  onMovies?: () => void;
  onPopular?: () => void;
  onGenre?: (g: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { user, signInGoogle, logout } = useAuth();
  const profile = useProfile(user?.uid);
  const photoURL = profile?.photoURL || user?.photoURL || null;
  const displayName = profile?.displayName || user?.displayName || "Pengguna";

  const close = () => setOpen(false);
  const handle = (fn?: () => void) => () => { fn?.(); close(); };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <button aria-label="Menu" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-[340px] bg-background border-border overflow-y-auto p-0">
        <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>

        <div className="px-5 py-4 flex items-center gap-2 border-b border-border">
          <span className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-black">N</span>
          <span className="text-lg font-black tracking-wider">NEX<span className="text-primary">Z</span>HU</span>
        </div>

        <div className="p-4 m-4 rounded-2xl border border-border bg-card text-center">
          {user ? (
            <>
              <Link
                to="/u/$uid"
                params={{ uid: user.uid }}
                onClick={close}
                className="block group"
                aria-label="Lihat profil saya"
              >
                {photoURL ? (
                  <img src={photoURL} alt="" className="mx-auto h-16 w-16 rounded-full border-2 border-primary object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="mx-auto h-16 w-16 rounded-full bg-secondary grid place-items-center text-primary font-black text-xl">
                    {displayName[0]}
                  </div>
                )}
                <p className="mt-3 font-bold group-hover:text-primary">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <p className="text-[10px] uppercase tracking-wider text-primary mt-1 opacity-80 group-hover:opacity-100">Lihat profil →</p>
              </Link>
              <button
                onClick={async () => { await logout(); toast.success("Berhasil logout."); close(); }}
                className="mt-4 w-full h-11 rounded-xl bg-secondary border border-border font-bold flex items-center justify-center gap-2 hover:bg-secondary/80"
              >
                <LogOut className="h-4 w-4" /> LOGOUT
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto h-16 w-16 rounded-full bg-secondary grid place-items-center text-primary">
                <LogIn className="h-7 w-7" />
              </div>
              <p className="mt-3 font-bold">Guest User</p>
              <p className="text-xs text-muted-foreground">Login untuk akses fitur kelas Yonko!</p>
              <button
                onClick={async () => {
                  try { await signInGoogle(); toast.success("Berhasil login!"); close(); }
                  catch { toast.error("Login dibatalkan."); }
                }}
                className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 glow-primary"
              >
                <LogIn className="h-4 w-4" /> LOGIN SEKARANG
              </button>
            </>
          )}
        </div>

        <div className="px-4 grid grid-cols-2 gap-3">
          <button onClick={handle(onRandom)} className="h-24 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-1.5 text-primary font-bold uppercase text-xs tracking-wider hover:border-primary">
            <Shuffle className="h-6 w-6" /> Random
          </button>
          <button onClick={handle(onMovies)} className="h-24 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-1.5 text-primary font-bold uppercase text-xs tracking-wider hover:border-primary">
            <Film className="h-6 w-6" /> Movies
          </button>
        </div>

        <div className="mt-6 px-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4" /> Peta Genre
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={handle(() => onGenre?.(g.id))}
                className="h-10 rounded-xl border border-border bg-card text-sm font-bold hover:border-primary hover:text-primary"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 px-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-primary" /> Jalur Pelayaran
          </h3>
          <ul className="space-y-1">
            <li>
              <Link to="/home" onClick={close} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                <HomeIcon className="h-5 w-5 text-muted-foreground" /> Home Base
              </Link>
            </li>
            <li>
              <button onClick={handle(onPopular)} className="w-full text-left flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                <Star className="h-5 w-5 text-muted-foreground" /> Most Popular
              </button>
            </li>
            <li>
              <Link to="/search" search={{ q: "" }} onClick={close} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                <SearchIcon className="h-5 w-5 text-muted-foreground" /> Cari Anime
              </Link>
            </li>
            {user && (
              <li>
                <Link to="/u/$uid" params={{ uid: user.uid }} onClick={close} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                  <UserIcon className="h-5 w-5 text-muted-foreground" /> Profil Saya
                </Link>
              </li>
            )}
            {isAdmin(user?.email) && (
              <>
                <li>
                  <Link to="/admin" onClick={close} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                    <Shield className="h-5 w-5 text-destructive" /> Admin Panel
                  </Link>
                </li>
                <li>
                  <Link to="/admin/upload-anime" onClick={close} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                    <Film className="h-5 w-5 text-primary" /> Upload Anime
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to="/" onClick={close} className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                <Tv className="h-5 w-5 text-muted-foreground" /> Welcome
              </Link>
            </li>
            <li>
              <a href="https://trakteer.id/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                <Heart className="h-5 w-5 text-destructive" /> Support Us
              </a>
            </li>
            <li>
              <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 h-11 px-3 rounded-xl hover:bg-secondary">
                <MessageSquare className="h-5 w-5 text-[#7d8af0]" /> Discord
              </a>
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground py-6">© {new Date().getFullYear()} NEXZHU</p>
      </SheetContent>
    </Sheet>
  );
            }
                  
