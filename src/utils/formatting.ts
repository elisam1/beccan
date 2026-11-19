export function formatDisplayDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(
    isoOrDate.length === 10 ? `${isoOrDate}T00:00:00Z` : isoOrDate,
  );
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  if (!startTime && !endTime) return 'Time to be confirmed';
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime || endTime || '';
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function toDatetimeLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}
