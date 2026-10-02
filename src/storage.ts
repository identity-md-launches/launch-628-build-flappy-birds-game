export type Entry = {
  id: string;
  username: string;
  score: number;
  date: string;
  duration: number;
};
export const ENTRY_PREFIX = "flappy-pepe:run:";
export const USER_KEY = "flappy-pepe:username";
export function validUsername(value: string): boolean {
  return /^[\p{L}\p{N}_ -]{2,18}$/u.test(value.trim());
}
export function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const e = value as Entry;
  return (
    typeof e.id === "string" &&
    typeof e.username === "string" &&
    validUsername(e.username) &&
    Number.isSafeInteger(e.score) &&
    e.score >= 0 &&
    typeof e.date === "string" &&
    Number.isFinite(Date.parse(e.date)) &&
    typeof e.duration === "number" &&
    Number.isFinite(e.duration) &&
    e.duration >= 0
  );
}
export function readEntries(storage: Storage): {
  entries: Entry[];
  damaged: boolean;
} {
  const entries: Entry[] = [];
  let damaged = false;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(ENTRY_PREFIX)) continue;
    try {
      const value: unknown = JSON.parse(storage.getItem(key) || "null");
      if (isEntry(value)) entries.push(value);
      else damaged = true;
    } catch {
      damaged = true;
    }
  }
  return { entries, damaged };
}
export function rankEntries(entries: Entry[], sort: string): Entry[] {
  return [...entries].sort((a, b) =>
    sort === "recent"
      ? b.date.localeCompare(a.date)
      : b.score - a.score ||
        a.date.localeCompare(b.date) ||
        a.id.localeCompare(b.id),
  );
}
export function toCSV(entries: Entry[]): string {
  const cell = (value: string) =>
    '"' +
    (/^[=+@\-]/.test(value) ? "'" : "") +
    value.replaceAll('"', '""') +
    '"';
  return [
    "Username,Score,Date,Duration (seconds)",
    ...rankEntries(entries, "score").map((e) =>
      [cell(e.username), e.score, cell(e.date), e.duration.toFixed(1)].join(
        ",",
      ),
    ),
  ].join("\r\n");
}
