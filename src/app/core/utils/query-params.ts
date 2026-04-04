import { ActivatedRoute, Router } from '@angular/router';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate a single value is one of the allowed enum values. */
export function isValidEnum(value: string, allowed: readonly string[]): boolean {
  return allowed.includes(value);
}

/** Validate a string looks like a UUID v4. */
export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Parse a comma-separated query param into an array of valid enum values.
 * Invalid entries are silently dropped.
 */
export function parseEnumList(raw: string | null | undefined, allowed: readonly string[]): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(s => isValidEnum(s, allowed));
}

/**
 * Parse a comma-separated query param into an array of valid UUIDs.
 * Invalid entries are silently dropped.
 */
export function parseUUIDList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(isValidUUID);
}

/**
 * Parse a numeric query param and validate it against allowed values.
 * Returns the default if invalid.
 */
export function parseNumericOption(raw: string | null | undefined, allowed: readonly number[], fallback: number): number {
  if (!raw) return fallback;
  const num = parseInt(raw, 10);
  if (isNaN(num) || !allowed.includes(num)) return fallback;
  return num;
}

/**
 * Parse a search string from query params.
 * Trims whitespace, enforces max length, returns empty string if invalid.
 */
export function parseSearchString(raw: string | null | undefined, maxLength = 200): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.length > maxLength) return trimmed.substring(0, maxLength);
  return trimmed;
}

/**
 * Sync current filter state to URL query params without triggering navigation.
 * Empty/default values are removed from the URL to keep it clean.
 */
export function syncFiltersToUrl(
  router: Router,
  route: ActivatedRoute,
  params: Record<string, string | number | null | undefined>,
): void {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      cleaned[key] = String(value);
    }
  }
  router.navigate([], {
    relativeTo: route,
    queryParams: cleaned,
    replaceUrl: true,
  });
}
