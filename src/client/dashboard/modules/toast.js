let container = null;
const toasts = new Set();
const MAX_TOASTS = 4;
const timers = new WeakMap();

function dismissToast(toast) {
  if (!toast || !toasts.has(toast)) return;
  toasts.delete(toast);
  const t = timers.get(toast);
  if (t) clearTimeout(t);
  timers.delete(toast);
  toast.classList.add('removing');
  toast.addEventListener(
    'animationend',
    () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    },
    { once: true }
  );
}

export function initToast() {
  if (container) return;
  container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
}

export function showToast(message, options = {}) {
  if (!container) initToast();
  const { type = 'info', duration = 3500, action } = options;

  if (toasts.size >= MAX_TOASTS) {
    const oldest = toasts.values().next().value;
    if (oldest) dismissToast(oldest);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const messageEl = document.createElement('div');
  messageEl.className = 'toast-message';
  messageEl.textContent = String(message ?? '');
  toast.appendChild(messageEl);

  if (action && action.label && typeof action.handler === 'function') {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast-action';
    actionBtn.type = 'button';
    actionBtn.textContent = action.label;
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        action.handler();
      } catch (err) {
        console.error('[TOAST] action error:', err);
      }
      dismissToast(toast);
    });
    toast.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissToast(toast);
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);
  toasts.add(toast);

  if (duration > 0) {
    const timer = setTimeout(() => dismissToast(toast), duration);
    timers.set(toast, timer);
  }

  return toast;
}
