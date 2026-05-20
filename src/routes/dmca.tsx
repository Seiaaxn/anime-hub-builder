import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert, Mail, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/dmca")({
  head: () => ({
    meta: [
      { title: "Kebijakan DMCA — Nexzhu" },
      { name: "description", content: "Kebijakan DMCA Nexzhu serta panduan pengajuan laporan pelanggaran hak cipta." },
    ],
  }),
  component: DmcaPage,
});

function DmcaPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 bg-background/90 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.history.back()} aria-label="Kembali" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-black tracking-wider">NEX<span className="text-primary">Z</span>HU</Link>
          <span className="ml-2 text-sm text-muted-foreground">/ DMCA</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-5">
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-10 w-10 grid place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Kebijakan DMCA</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nexzhu menghormati hak kekayaan intelektual dan berharap setiap
            pengguna kami melakukan hal yang sama. Perlu diketahui, kami
            <b className="text-foreground"> tidak menyimpan </b>
            satu pun berkas video, gambar, atau konten yang dapat diunduh di
            server kami. Seluruh konten ditampilkan melalui penyedia pihak
            ketiga sebagai agregator pranala.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-wider">Cara Mengajukan Laporan</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Jika Anda pemegang hak cipta yang sah dan meyakini ada konten di
            Nexzhu yang melanggar hak Anda, silakan kirim laporan resmi yang
            memuat informasi berikut secara lengkap:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1.5">
            <li>Identitas lengkap dan kontak yang dapat dihubungi.</li>
            <li>Bukti kepemilikan atau surat kuasa atas karya yang dimaksud.</li>
            <li>URL halaman Nexzhu yang menampilkan tautan terkait.</li>
            <li>URL sumber asli dari penyedia pihak ketiga (bila tersedia).</li>
            <li>Pernyataan tertulis bahwa informasi yang diberikan akurat.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-wider">Kontak Resmi</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kirim laporan ke{" "}
            <a className="text-primary font-bold underline" href="mailto:nexzhuimt@gmail.com">nexzhuimt@gmail.com</a>{" "}
            dengan subjek <code className="px-1.5 py-0.5 rounded bg-secondary text-xs">[DMCA] Nexzhu</code>.
            Permintaan yang lengkap akan kami proses dalam waktu wajar dengan
            menonaktifkan tautan terkait dari sisi kami.
          </p>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-2">© {new Date().getFullYear()} NEXZHU</p>
      </main>
    </div>
  );
}
