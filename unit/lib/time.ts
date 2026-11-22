export function effectiveHour(
  offset: number,
  hour: number,
  minute: number,
  nowHour: number,
  nowMinute: number
): number {
  if (offset > 0) return hour;
  return hour * 60 + minute <= nowHour * 60 + nowMinute ? nowHour : hour;
}

export function hourlyIndex(
  times: string[] | null | undefined,
  date: string,
  hour: number,
  fallbackIndex: number
): number {
  if (Array.isArray(times)) {
    const target = date + 'T' + String(hour).padStart(2, '0') + ':00';
    const i = times.indexOf(target);
    if (i >= 0) return i;
  }
  return fallbackIndex;
}
