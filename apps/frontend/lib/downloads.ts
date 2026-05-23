/**
 * Client-side download and clipboard utilities.
 * All functions are browser-only; call only from event handlers or useEffect.
 */

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  triggerDownload(blob, filename);
}

export function downloadHTML(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/html' });
  triggerDownload(blob, filename);
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

/**
 * RFC 4180-compliant CSV download.
 * Escapes commas, double-quotes, and newlines inside cell values.
 */
export function downloadCSV(
  filename: string,
  rows: Record<string, string | number | boolean>[],
): void {
  if (rows.length === 0) return;

  function escapeCell(val: string | number | boolean): string {
    const str = String(val);
    // Needs quoting if contains comma, double-quote, newline, or carriage return
    if (/[,"\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const first = rows[0];
  if (!first) return;
  const headers = Object.keys(first);
  const headerLine = headers.map(escapeCell).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h] ?? '')).join(','),
  );
  const csv = [headerLine, ...dataLines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  triggerDownload(blob, filename);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
