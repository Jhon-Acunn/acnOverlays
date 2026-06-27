const storageBus = new EventTarget();

export function loadJSON(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
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
