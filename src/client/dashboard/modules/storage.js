const storageBus = new EventTarget();

export const SERVER_SETTINGS_EVENT = 'acn-settings-changed';

// Flag used to break the cross-device sync loop. When a remote settings update
// arrives, the client applies it to localStorage and dispatches synthetic
// input/change events so the display refreshes. Without this guard, those
// synthetic events would re-trigger the per-input listeners (lowerUpdate /
// debouncedSave) and the changes would be echoed back to the server, causing
// a continuous loop where settings bounce back and forth between devices.
let _applyingRemote = false;
export function setApplyingRemote(v) {
  _applyingRemote = !!v;
}
export function isApplyingRemote() {
  return _applyingRemote;
}

export function loadJSON(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  // Block local saves that originate from a remote-apply round-trip. The
  // dispatched synthetic input events would otherwise re-save what we just
  // received, producing an infinite ping-pong between clients.
  if (_applyingRemote) return;
  localStorage.setItem(key, JSON.stringify(value));
  storageBus.dispatchEvent(new CustomEvent('save', { detail: { key } }));
  storageBus.dispatchEvent(new CustomEvent('server-save', { detail: { key, value } }));
}

export function onStorageSave(key, callback) {
  const handler = (e) => {
    if (e.detail.key === key) callback();
  };
  storageBus.addEventListener('save', handler);
  return () => storageBus.removeEventListener('save', handler);
}

export function onServerSave(callback) {
  storageBus.addEventListener('server-save', callback);
  return () => storageBus.removeEventListener('server-save', callback);
}
