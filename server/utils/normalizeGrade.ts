export default function normalizeGrade(value: string | number): number {
  if (typeof value === "number") {
    if (Number.isNaN(value)) throw new Error(`Invalid grade: ${value}`);
    return value;
  }

  const s = String(value).trim().toLowerCase();

  if (s === "-1" || s === "prek" || s === "pre-k" || s === "pre-kindergarten") {
    return -1;
  }

  if (s === "0" || s === "k" || s === "kindergarten") {
    return 0;
  }

  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && ((n >= 1 && n <= 12) || n === 14)) {
    return n;
  }

  throw new Error(`Invalid grade: ${value}`);
}
