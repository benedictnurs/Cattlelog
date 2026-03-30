// rating helper utilities
export function parseRating(value: unknown): number | null {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function ratingBgColor(value: unknown): string {
  const n = parseRating(value);
  if (n == null) return "bg-[#b7bcc5]";
  const r = Number(n.toFixed(1));
  if (r >= 4) return "bg-rating_green";
  if (r >= 3) return "bg-rating_yellow";
  return "bg-rating_red";
}

export function displayRating(value: unknown, decimals: number = 1): string {
  const n = parseRating(value);
  if (n == null) return "--";
  return n.toFixed(decimals);
}
