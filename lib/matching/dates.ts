const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

export function isoDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    return null;
  }
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return `${year}-${monthText}-${dayText}`;
}

export function findDates(text: string) {
  const found: string[] = [];
  for (const match of text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
    const date = isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
    if (date) found.push(date);
  }
  const written =
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/gi;
  for (const match of text.matchAll(written)) {
    const month = MONTHS[match[1].toLowerCase()];
    const date = isoDate(Number(match[3]), month, Number(match[2]));
    if (date) found.push(date);
  }
  return [...new Set(found)];
}

export function inclusiveDays(start: string, end: string) {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1;
}

export function billedMonths(start: string, end: string) {
  const days = inclusiveDays(start, end);
  if (!days) return null;
  return Math.max(1, Math.round(days / 30));
}

export function hoursBetween(startDate: string, endDate: string, arrival: string, departure: string) {
  const start = Date.parse(`${startDate}T${arrival}:00Z`);
  const end = Date.parse(`${endDate}T${departure}:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.max(1, Math.ceil((end - start) / 3_600_000));
}

export function covers(windowStart: string, windowEnd: string, start: string, end: string) {
  return windowStart <= start && windowEnd >= end;
}

export function sundayWithin(start: string, end: string) {
  let cursor = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(cursor) || Number.isNaN(last) || last < cursor) return null;
  while (cursor <= last) {
    if (new Date(cursor).getUTCDay() === 0) {
      return new Date(cursor).toISOString().slice(0, 10);
    }
    cursor += 86_400_000;
  }
  return null;
}
