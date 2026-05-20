import { Crown, Shield, Tag as TagIcon } from "lucide-react";
import { roleBadge, isAdmin, isPremium } from "@/lib/roles";
import { useUserFlags } from "@/lib/social";

export function RoleBadge({
  email,
  uid,
  size = "sm",
}: {
  email?: string | null;
  uid?: string;
  size?: "sm" | "md";
}) {
  const flags = useUserFlags(uid);
  const r = roleBadge(email);
  const dbPremium = !!flags.premium && !isAdmin(email);
  const dbBanned = !!flags.banned;
  const customTag = flags.tag?.trim();

  const cls =
    size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[9px]";

  const items: React.ReactNode[] = [];

  if (r === "admin") {
    items.push(
      <span
        key="adm"
        className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider ${cls} bg-destructive/20 text-destructive border border-destructive/40`}
        title="Administrator"
      >
        <Shield className="h-3 w-3" /> ADMIN
      </span>,
    );
  } else if (r === "premium" || dbPremium || (isPremium(email) && !isAdmin(email))) {
    items.push(
      <span
        key="prem"
        className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider ${cls} bg-primary/20 text-primary border border-primary/40`}
        title="Premium User"
      >
        <Crown className="h-3 w-3" /> PREMIUM
      </span>,
    );
  }

  if (dbBanned) {
    items.push(
      <span
        key="ban"
        className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider ${cls} bg-muted text-muted-foreground border border-border line-through`}
        title="Banned"
      >
        BANNED
      </span>,
    );
  }

  if (customTag) {
    items.push(
      <span
        key="tag"
        className={`inline-flex items-center gap-1 rounded-full font-bold ${cls} bg-accent text-accent-foreground border border-border`}
        title={customTag}
      >
        <TagIcon className="h-3 w-3" /> {customTag}
      </span>,
    );
  }

  if (items.length === 0) return null;
  return <span className="inline-flex items-center gap-1 flex-wrap">{items}</span>;
}
