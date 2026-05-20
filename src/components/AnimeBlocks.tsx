import type { AnimeCard } from "@/lib/anime-types";
import { Play, ChevronRight, Star } from "lucide-react";

export const SectionTitle = ({ title, onViewMore }: { title: string; onViewMore?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg sm:text-2xl font-black tracking-wider flex items-center gap-3 uppercase">
      <span className="h-6 w-1.5 rounded-full bg-primary" />
      {title}
    </h3>
    {onViewMore && (
      <button onClick={onViewMore} className="text-xs text-primary hover:underline flex items-center gap-1 font-bold uppercase tracking-wider">
        Lihat Semua <ChevronRight className="h-4 w-4" />
      </button>
    )}
  </div>
);

/* ============ TRENDING-style portrait card (no rank number) ============ */
export const TrendingCard = ({ a, onClick }: { a: AnimeCard; onClick: (a: AnimeCard) => void }) => (
  <button onClick={() => onClick(a)} className="group relative flex shrink-0 text-left">
    <div className="relative w-32 sm:w-40">
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-secondary border border-border">
        {a.cover ? (
          <img src={a.cover} alt={a.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-4">
          <span className="h-10 w-10 rounded-full bg-primary/90 grid place-items-center glow-primary">
            <Play className="h-5 w-5 text-primary-foreground fill-current" />
          </span>
        </div>
      </div>
      <p className="text-xs sm:text-sm font-semibold mt-2 line-clamp-2 group-hover:text-primary transition">{a.title}</p>
    </div>
  </button>
);

export const TrendingRow = ({ items, onClick }: { items: AnimeCard[]; onClick: (a: AnimeCard) => void }) => (
  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
    {items.map((a) => (
      <TrendingCard key={a.id} a={a} onClick={onClick} />
    ))}
  </div>
);

/* ============ PORTRAIT (3:4) ============ */
export const PortraitCard = ({ a, onClick }: { a: AnimeCard; onClick: (a: AnimeCard) => void }) => (
  <button onClick={() => onClick(a)} className="group text-left relative">
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary border border-border">
      {a.cover ? (
        <img src={a.cover} alt={a.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
      ) : (
        <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No Image</div>
      )}
      {a.rating && a.rating !== "HD" && (
        <span className="absolute right-1.5 top-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-primary flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5 fill-current" />{a.rating}
        </span>
      )}
      {a.episodes > 0 && (
        <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded bg-primary/90 text-[10px] font-black text-primary-foreground">
          EP {a.episodes}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-3">
        <Play className="h-8 w-8 text-primary fill-current" />
      </div>
    </div>
    <p className="text-xs sm:text-sm font-semibold mt-2 line-clamp-2 group-hover:text-primary transition">{a.title}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">
      {a.type}{a.episodes > 0 ? ` • ${a.episodes} Eps` : ""}
    </p>
  </button>
);

export const PortraitGrid = ({ items, onClick }: { items: AnimeCard[]; onClick: (a: AnimeCard) => void }) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
    {items.map((a) => <PortraitCard key={a.id} a={a} onClick={onClick} />)}
  </div>
);

/* ============ LANDSCAPE 16:9 ============ */
export const LandscapeCard = ({ a, onClick }: { a: AnimeCard; onClick: (a: AnimeCard) => void }) => (
  <button onClick={() => onClick(a)} className="group text-left relative w-full">
    <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary border border-border">
      {a.cover ? (
        <img src={a.cover} alt={a.title} loading="lazy" className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500" />
      ) : (
        <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No Image</div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
      {a.episodes > 0 && (
        <span className="absolute left-2 top-2 px-2 py-0.5 rounded-md bg-primary/95 text-[10px] font-black text-primary-foreground">EP {a.episodes}</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="text-xs sm:text-sm font-bold line-clamp-2 group-hover:text-primary transition leading-snug text-white drop-shadow">{a.title}</p>
        <p className="text-[10px] text-white/70 mt-0.5">{a.type}{a.episodes > 0 ? ` • ${a.episodes} Eps` : ""}</p>
      </div>
      <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
        <span className="h-12 w-12 rounded-full bg-primary/90 grid place-items-center glow-primary">
          <Play className="h-6 w-6 text-primary-foreground fill-current" />
        </span>
      </div>
    </div>
  </button>
);

export const LandscapeGrid = ({ items, onClick }: { items: AnimeCard[]; onClick: (a: AnimeCard) => void }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {items.map((a) => <LandscapeCard key={a.id} a={a} onClick={onClick} />)}
  </div>
);

/* ============ ROW LIST ============ */
export const RowList = ({ items, onClick }: { items: AnimeCard[]; onClick: (a: AnimeCard) => void }) => (
  <ul className="space-y-2.5">
    {items.map((a) => (
      <li key={a.id}>
        <button onClick={() => onClick(a)} className="flex items-center gap-3 w-full text-left group">
          {a.cover ? (
            <img src={a.cover} alt={a.title} loading="lazy" className="h-16 w-12 rounded-md object-cover border border-border shrink-0" />
          ) : (
            <div className="h-16 w-12 rounded-md bg-secondary shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition">{a.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span>{a.type}</span>
              {a.episodes > 0 && <><span>•</span><span>{a.episodes} Eps</span></>}
            </p>
          </div>
        </button>
      </li>
    ))}
  </ul>
);
    
