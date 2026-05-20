export function cleanTitle(s: string): string {
  if (!s) return "";
  return s
    .replace(/Episode\s*\d+.*$/i, "")
    .replace(/Subtitle\s*Indonesia.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
