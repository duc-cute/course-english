export function initialsFromDisplayName(name: string): string {
  const safe = name.trim();
  if (!safe || safe === "bạn") return "HS";
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
