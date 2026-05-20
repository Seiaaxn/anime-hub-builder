import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, ScrollText, UserCheck, Lock, Link2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/tos")({
  head: () => ({
    meta: [
      { title: "Syarat & Ketentuan — Nexzhu" },
      { name: "description", content: "Syarat & Ketentuan penggunaan layanan Nexzhu." },
    ],
  }),
  component: TosPage,
});

const SECTIONS = [
  {
    icon: ScrollText,
    title: "1. Penggunaan Layanan",
    body: "Nexzhu adalah agregator yang menampilkan informasi dan tautan anime dari sumber pihak ketiga. Dengan mengakses layanan ini, Anda setuju untuk tidak menyalahgunakan situs, melakukan scraping berlebihan, maupun mengganggu kenyamanan pengguna lain.",
  },
  {
    icon: UserCheck,
    title: "2. Akun & Interaksi Sosial",
    body: "Akun digunakan untuk fitur komentar, follow, serta chat antar teman yang sudah saling follow. Anda bertanggung jawab penuh atas seluruh aktivitas akun Anda. Konten yang melanggar (SARA, kekerasan, NSFW ekstrem, atau doxxing) akan dihapus tanpa pemberitahuan.",
  },
  {
    icon: Lock,
    title: "3. Privasi & Enkripsi",
    body: "Pesan chat antar teman dienkripsi end-to-end langsung di perangkat menggunakan ECDH P-256 dan AES-GCM. Server kami hanya menyimpan ciphertext — admin sekalipun tidak dapat membaca isi pesan Anda.",
  },
  {
    icon: Link2,
    title: "4. Konten Pihak Ketiga",
    body: "Kami tidak meng-host berkas video. Seluruh stream berasal dari penyedia pihak ketiga dan tunduk pada kebijakan masing-masing penyedia. Untuk laporan hak cipta, silakan kunjungi halaman DMCA kami.",
  },
  {
    icon: AlertTriangle,
    title: "5. Penafian",
    body: 'Layanan disediakan "apa adanya" tanpa jaminan apa pun. Kami tidak menjamin ketersediaan tanpa gangguan dan tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan ini.',
  },
];

function TosPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 bg-background/90 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} aria-label="Kembali" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-black tracking-wider">NEX<span className="text-primary">Z</span>HU</Link>
          <span className="ml-2 text-sm text-muted-foreground">/ Terms</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Syarat & Ketentuan</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Mohon baca syarat berikut dengan saksama. Dengan terus menggunakan
            Nexzhu, Anda dianggap telah memahami dan menyetujui seluruh
            ketentuan di bawah ini.
          </p>
        </div>

        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border bg-card/70 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider">{s.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </section>
        ))}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Pertanyaan? Lihat{" "}
          <Link to="/dmca" className="text-primary underline">DMCA</Link>{" "}
          atau hubungi admin.
        </p>
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} NEXZHU</p>
      </main>
    </div>
  );
}
