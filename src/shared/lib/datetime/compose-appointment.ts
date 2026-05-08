/**
 * Date/time helpers that respect the service-country timezone.
 *
 * See `docs/features/timezone-handling.md` for the convention.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function assertValidTimeZone(tz: string): void {
  if (!isValidTimeZone(tz)) {
    throw new Error(`Invalid IANA timezone: ${tz}`);
  }
}

/**
 * Returns the wall-clock representation of a UTC instant in the given
 * timezone, expressed as the UTC ms a Date with those numbers would have.
 * Used internally to compute the offset.
 */
function wallClockMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
}

/**
 * Build the UTC ISO string for a wall-clock (date + time) interpreted in
 * the given IANA timezone.
 *
 * Robust against DST: computes the actual offset of `timeZone` at the
 * target instant. Cero deps externas.
 */
export function composeAppointmentUtc(
  dateIso: string,
  timeHm: string,
  timeZone: string,
): string {
  if (!DATE_RE.test(dateIso)) {
    throw new Error(`Invalid date format (expected YYYY-MM-DD): ${dateIso}`);
  }
  if (!TIME_RE.test(timeHm)) {
    throw new Error(`Invalid time format (expected HH:MM): ${timeHm}`);
  }
  assertValidTimeZone(timeZone);

  const [y, m, d] = dateIso.split('-').map(Number);
  const [h, mn] = timeHm.split(':').map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, h, mn, 0);
  const tzWall = wallClockMs(new Date(wallAsUtc), timeZone);
  const offsetMs = tzWall - wallAsUtc;
  return new Date(wallAsUtc - offsetMs).toISOString();
}
