import { getAuthToken } from '../../shared/auth-token.js';

function formatDate(iso) {
  if (!iso || iso === 'unknown') return 'unknown';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear() + '-' +
      pad(d.getUTCMonth() + 1) + '-' +
      pad(d.getUTCDate()) + ' ' +
      pad(d.getUTCHours()) + ':' +
      pad(d.getUTCMinutes()) + ':' +
      pad(d.getUTCSeconds()) + ' UTC'
    );
  } catch {
    return iso;
  }
}

export async function initBuildInfo() {
  const el = document.getElementById('build-info');
  if (!el) return;
  el.value = 'loading...';
  el.title = 'Last image build time (≈ last git push)';
  try {
    const token = await getAuthToken();
    const headers = token ? { 'X-Auth-Token': token } : {};
    const res = await fetch('/api/build-info', { headers });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    el.value = formatDate(data.builtAt);
    el.title = 'Last image build: ' + el.value + ' (≈ last git push)';
  } catch (err) {
    el.value = 'unavailable';
    el.title = 'Could not fetch build info: ' + (err.message || err);
  }
}
