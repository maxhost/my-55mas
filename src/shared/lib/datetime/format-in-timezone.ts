import { isValidTimeZone } from './compose-appointment';

function assertValidTimeZone(tz: string): void {
  if (!isValidTimeZone(tz)) {
    throw new Error(`Invalid IANA timezone: ${tz}`);
  }
}

/** Format a UTC ISO instant as `HH:MM` in the given timezone (24h). */
export function formatTimeInTz(isoUtc: string, timeZone: string): string {
  assertValidTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(isoUtc));
}

/** Format a UTC ISO instant as a localized short date in the given timezone. */
export function formatDateInTz(
  isoUtc: string,
  timeZone: string,
  locale: string,
): string {
  assertValidTimeZone(timeZone);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoUtc));
}

/** Add minutes to a UTC ISO instant, returning a new UTC ISO string. */
export function addMinutesToIso(isoUtc: string, minutes: number): string {
  return new Date(new Date(isoUtc).getTime() + minutes * 60_000).toISOString();
}
