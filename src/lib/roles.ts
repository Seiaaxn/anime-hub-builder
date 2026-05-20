// Centralized role logic.
export const ADMIN_EMAILS = ["ryu694602@gmail.com", "zeoxaeon@gmail.com"];
// Admins are automatically considered premium too.
export const PREMIUM_EMAILS = [...ADMIN_EMAILS];

export const isAdmin = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export const isPremium = (email?: string | null) =>
  !!email && PREMIUM_EMAILS.includes(email.toLowerCase());

export type RoleBadge = "admin" | "premium" | null;

export const roleBadge = (email?: string | null): RoleBadge => {
  if (isAdmin(email)) return "admin";
  if (isPremium(email)) return "premium";
  return null;
};
