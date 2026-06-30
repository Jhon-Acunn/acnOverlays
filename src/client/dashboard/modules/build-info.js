import { getAuthToken } from '../../shared/auth-token.js';

function formatDate(iso) {
  if (!iso || iso === 'unknown') return 'unknown';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    // Colombia = America/Bogota = UTC-5 (no DST)
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch {
    return iso;
  }
}

export async function initBuildInfo() {
  const el = document.getElementById('build-info');
  if (!el) return;
  el.value = 'loading...';
  el.title = 'Last image build time (≈ last git push) — America/Bogota';
  try {
    const token = await getAuthToken();
    const headers = token ? { 'X-Auth-Token': token } : {};
    const res = await fetch('/api/build-info', { headers });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    el.value = formatDate(data.builtAt);
    el.title = 'Last image build: ' + el.value + ' (Bogotá)';
  } catch (err) {
    el.value = 'unavailable';
    el.title = 'Could not fetch build info: ' + (err.message || err);
  }
}
