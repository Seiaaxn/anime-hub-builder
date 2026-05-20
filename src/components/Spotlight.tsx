import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Tv, Subtitles } from "lucide-react";
import type { AnimeCard } from "@/lib/anime-types";

export const Spotlight = ({ items, onWatch }: { items: AnimeCard[]; onWatch: (a: AnimeCard) => void }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items || items.length === 0) return null;
  const safeIdx = idx % items.length;
  const a = items[safeIdx];
  const next = () => setIdx((safeIdx + 1) % items.length);
  const prev = () => setIdx((safeIdx - 1 + items.length) % items.length);

  return (
    <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border bg-card min-h-[420px] sm:min-h-[560px]">
      <div className="absolute inset-0">
        <img src={a.banner || a.cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative p-5 sm:p-12 max-w-2xl space-y-4 sm:space-y-5 pt-10 sm:pt-16">
        <p className="text-primary font-extrabold text-xs sm:text-sm tracking-wider">
          #{safeIdx + 1} Spotlight
        </p>
        <h2 className="text-3xl sm:text-6xl font-black leading-[1.05] line-clamp-3 drop-shadow">
          {a.title}
        </h2>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-sm">
          <span className="flex items-center gap-1.5 text-foreground/90"><Tv className="h-3.5 w-3.5" /> {a.type}</span>
          {a.episodes > 0 && (
            <span className="flex items-center gap-1.5 text-foreground/90">
              <Play className="h-3 w-3 fill-current" /> {a.episodes} Eps
            </span>
          )}
          <span className="text-foreground/90">📅 {a.year}</span>
          {a.rating && (
            <span className="px-2 py-0.5 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-black">
              {a.rating}
            </span>
          )}
          {a.sub != null && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-black flex items-center gap-1">
              <Subtitles className="h-3 w-3" /> {a.sub}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
          <button
            onClick={() => onWatch(a)}
            className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-primary text-primary-foreground font-extrabold text-xs sm:text-sm flex items-center gap-2 glow-primary hover:scale-[1.03] transition"
          >
            <Play className="h-4 w-4 fill-current" /> Watch Now
          </button>
          <button
            onClick={() => onWatch(a)}
            className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-card/80 text-foreground font-extrabold text-xs sm:text-sm flex items-center gap-2 hover:bg-card transition border border-border"
          >
            Detail <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button onClick={prev} aria-label="Prev" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-card/80 border border-border grid place-items-center hover:text-primary hover:border-primary transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} aria-label="Next" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-card/80 border border-border grid place-items-center hover:text-primary hover:border-primary transition">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === safeIdx ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground"}`}
          />
        ))}
      </div>
    </section>
  );
};
