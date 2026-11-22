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

export function effectiveMinute(
  offset: number,
  hour: number,
  minute: number,
  nowHour: number,
  nowMinute: number
): number {
  if (offset > 0) return minute;
  return hour * 60 + minute <= nowHour * 60 + nowMinute ? nowMinute : minute;
}

export interface TravelTime {
  date: string;
  hour: number;
  minute: number;
  offset: number;
}

function dateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function arrivalTime(
  date: string,
  hour: number,
  minute: number,
  durationSec: number | null | undefined,
  todayDate: string
): TravelTime {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = new Date(date + 'T' + pad(hour) + ':' + pad(minute) + ':00');
  const end = new Date(start.getTime() + (durationSec || 0) * 1000);
  const endDate = dateString(end);
  const dayMs = 86400000;
  const offset = Math.round(
    (new Date(endDate + 'T00:00:00').getTime() - new Date(todayDate + 'T00:00:00').getTime()) / dayMs
  );
  return { date: endDate, hour: end.getHours(), minute: end.getMinutes(), offset };
}
