const COPY_SUFFIX_RE = /\s*\(copy(?:\s+\d+)?\)$/;

export function getBaseName(title: string): string {
  return title.replace(COPY_SUFFIX_RE, '');
}

export function generateCopyName(title: string, siblingTitles: string[]): string {
  const base = getBaseName(title);
  const taken = new Set(siblingTitles);

  const first = `${base} (copy)`;
  if (!taken.has(first)) return first;

  let n = 2;
  while (taken.has(`${base} (copy ${n})`)) n++;
  return `${base} (copy ${n})`;
}
