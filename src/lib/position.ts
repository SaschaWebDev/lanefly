const DEFAULT_GAP = 1024;
const PRECISION_THRESHOLD = 0.001;

export function computePosition(
  leftPos: number | null,
  rightPos: number | null,
): number {
  if (leftPos !== null && rightPos !== null) {
    return (leftPos + rightPos) / 2;
  }
  if (leftPos !== null) {
    return leftPos + DEFAULT_GAP;
  }
  if (rightPos !== null) {
    return rightPos / 2;
  }
  return DEFAULT_GAP;
}

export function needsReindex(positions: number[]): boolean {
  for (let i = 1; i < positions.length; i++) {
    const current = positions[i];
    const previous = positions[i - 1];
    if (current === undefined || previous === undefined) continue;
    if (current - previous < PRECISION_THRESHOLD) {
      return true;
    }
  }
  return false;
}
