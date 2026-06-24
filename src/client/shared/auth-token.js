let cached = undefined;

export async function getAuthToken() {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    cached = cfg.authToken || '';
  } catch {
    cached = '';
  }
  return cached;
}
