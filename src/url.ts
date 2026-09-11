/**
 * True only for an absolute http or https URL.
 *
 * Station data carries source URLs, and since it became a fetched dataset rather than a
 * compiled-in fixture those URLs cross a trust boundary on their way into an `href`.
 * `javascript:` and `data:` are the reason this is a scheme allowlist and not a
 * substring check.
 *
 * Shared by `src/data/schema.ts`, which rejects a dataset containing anything else, and
 * by `safeUrl` in `src/ui.ts`, which refuses to emit one.
 */
export function isSafeUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
