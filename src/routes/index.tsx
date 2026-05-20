import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImg from "@/assets/hero-anime.jpg";

export const Route = createFileRoute("/")({
  component: Welcome,
});

const TOP_SEARCHES = [
  "Attack on Titan",
  "Demon Slayer",
  "Jujutsu Kaisen",
  "Death Note",
  "My Hero Academia",
  "Hunter x Hunter",
  "One Punch Man",
  "Tokyo Ghoul",
  "Naruto",
  "One Piece",
];

const FAQS = [
  {
    q: "Apakah data pribadi saya aman di Nexzhu?",
    a: "Aman. Kami tidak pernah menjual atau membagikan data pribadimu ke pihak ketiga. Autentikasi ditangani oleh Firebase, dan pesan chat antar teman dienkripsi end-to-end di sisi perangkat.",
  },
  {
    q: "Apakah menonton anime di Nexzhu benar-benar gratis?",
    a: "Ya, seluruh koleksi anime dapat ditonton secara gratis tanpa batas. Kamu bisa mendukung kami melalui tombol Support Us atau berlangganan Premium langsung ke admin.",
  },
  {
    q: "Bisakah saya request judul anime baru?",
    a: "Maaf, kami belum bisa menerima request judul. Daftar anime mengikuti penyedia pihak ketiga yang kami gunakan sebagai sumber data.",
  },
  {
    q: "Kenapa video saya sering buffering atau lambat?",
    a: "Coba pindah ke server pemutar lain atau turunkan kualitas video. Pastikan koneksi internet stabil di kecepatan minimal 5 Mbps untuk kualitas HD yang lancar.",
  },
  {
    q: "Apakah Nexzhu aman dari iklan berbahaya dan malware?",
    a: "Kami berusaha menjaga situs tetap bersih dari iklan agresif. Hindari klik popup mencurigakan dan gunakan adblock terpercaya agar pengalaman menonton tetap nyaman.",
  },
];

function Logo() {
  return (
    <span className="text-xl font-extrabold tracking-wider text-foreground">
      NEXZ
      <span className="text-primary">!</span>
      HU
    </span>
  );
}

function Welcome() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");

  const goSearch = (q: string) => {
    const term = q.trim();
    if (!term) return;
    navigate({ to: "/search", search: { q: term } });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-5 py-4">
        <Logo />
        <Link
          to="/search"
          search={{ q: "" }}
          aria-label="Cari"
          className="rounded-lg p-2 text-foreground/80 hover:bg-secondary"
        >
          <Search className="h-5 w-5" />
        </Link>
      </header>

      <section className="mt-5 rounded-2xl border border-border bg-card/70 p-5">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src={heroImg}
            alt="Nexzhu hero"
            width={1024}
            height={768}
            className="h-auto w-full object-cover float-anim"
          />
        </div>

        <h1 className="mt-6 text-center text-4xl font-extrabold tracking-wider">
          NEX<span className="text-primary">Z</span>HU
        </h1>

        <p className="mt-4 text-center text-lg font-semibold text-primary">
          Selamat Datang Di Markas Besar Nexzhu!
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          Platform Streaming Anime Terbaik Dengan Koleksi Terlengkap Dan Server Super Cepat.
          Cari, Tonton, Dan Nikmati Petualanganmu!
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            goSearch(draft);
          }}
          className="mt-6 flex items-center gap-3"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ketik judul anime disini..."
            className="h-14 rounded-xl bg-input/60 text-base"
          />
          <Button
            type="submit"
            aria-label="Cari"
            className="h-14 w-14 rounded-xl glow-primary"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          <span className="font-bold tracking-wide text-primary">TOP SEARCH:</span>{" "}
          {TOP_SEARCHES.map((t, i) => (
            <span key={t}>
              <button
                type="button"
                onClick={() => goSearch(t)}
                className="hover:text-foreground hover:underline"
              >
                {t}
              </button>
              {i < TOP_SEARCHES.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>

        <div className="mt-7 space-y-3">
          <Button
            onClick={() => navigate({ to: "/home" })}
            className="h-14 w-full rounded-xl text-base font-bold tracking-wider glow-primary"
          >
            MULAI NONTON <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <a
            href="https://trakteer.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-sm font-bold tracking-wider text-destructive transition hover:bg-destructive/20"
          >
            <Heart className="h-5 w-5 fill-destructive" /> SUPPORT US
          </a>
          <a
            href="https://discord.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-sm font-bold tracking-wider text-primary transition hover:bg-primary/20"
          >
            <DiscordIcon /> DISCORD
          </a>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-card/70 px-5 py-4">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-6 w-1.5 rounded-full bg-primary" />
          <h2 className="text-base font-bold tracking-wider text-foreground">
            PAPAN INFORMASI (FAQ)
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-sm font-semibold">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="mt-10 pb-10 text-center text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Link to="/dmca" className="hover:text-primary">DMCA</Link>
          <span>·</span>
          <Link to="/tos" className="hover:text-primary">Terms of Service</Link>
        </div>
        <p>© {new Date().getFullYear()} NEXZHU</p>
      </footer>
    </main>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.95 13.95 0 0 0-.617 1.265 18.27 18.27 0 0 0-5.882 0A13.7 13.7 0 0 0 9.44 3a19.74 19.74 0 0 0-3.76 1.37C2.27 9.043 1.39 13.58 1.83 18.058a19.9 19.9 0 0 0 6.073 3.064 14.55 14.55 0 0 0 1.3-2.1 12.85 12.85 0 0 1-2.05-.98c.172-.126.34-.258.504-.394 3.927 1.81 8.18 1.81 12.06 0 .166.136.334.268.504.394-.654.39-1.34.717-2.052.98a14.4 14.4 0 0 0 1.3 2.1 19.86 19.86 0 0 0 6.075-3.063c.5-5.177-.838-9.674-3.227-13.69ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.42 0-1.336.953-2.42 2.157-2.42 1.21 0 2.18 1.094 2.157 2.42 0 1.335-.953 2.42-2.157 2.42Zm7.96 0c-1.18 0-2.157-1.085-2.157-2.42 0-1.336.954-2.42 2.158-2.42 1.21 0 2.18 1.094 2.157 2.42 0 1.335-.946 2.42-2.157 2.42Z" />
    </svg>
  );
}
