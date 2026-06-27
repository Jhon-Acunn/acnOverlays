let host = null;
let backdrop = null;
let dialogEl = null;
let titleEl = null;
let bodyEl = null;
let actionsEl = null;
let prevFocus = null;
let activeResolver = null;
let keyHandler = null;
let focusHandler = null;
let confirmBtnEl = null;

function focusableInDialog() {
  if (!dialogEl) return [];
  return Array.from(
    dialogEl.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

function handleKey(e) {
  if (!backdrop) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    teardown(false);
    return;
  }
  if (e.key === 'Enter' && confirmBtnEl) {
    e.preventDefault();
    e.stopPropagation();
    teardown(true);
  }
}

function handleFocusTrap(e) {
  if (!backdrop || e.key !== 'Tab') return;
  const items = focusableInDialog();
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !dialogEl.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function teardown(result) {
  if (!backdrop) return;
  if (prevFocus && typeof prevFocus.focus === 'function') {
    prevFocus.focus();
    prevFocus = null;
  }
  document.removeEventListener('keydown', keyHandler, true);
  document.removeEventListener('keydown', focusHandler, true);
  keyHandler = null;
  focusHandler = null;
  const node = backdrop;
  backdrop = null;
  dialogEl = null;
  titleEl = null;
  bodyEl = null;
  actionsEl = null;
  confirmBtnEl = null;
  if (node.parentNode) node.parentNode.removeChild(node);
  const resolver = activeResolver;
  activeResolver = null;
  if (resolver) resolver(result);
}

function buildShell(title) {
  prevFocus = document.activeElement;
  backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) teardown(false);
  });
  dialogEl = document.createElement('div');
  dialogEl.className = 'dialog';
  dialogEl.setAttribute('role', 'dialog');
  dialogEl.setAttribute('aria-modal', 'true');
  titleEl = document.createElement('h3');
  titleEl.className = 'dialog-title';
  titleEl.textContent = title;
  dialogEl.appendChild(titleEl);
  bodyEl = document.createElement('div');
  bodyEl.className = 'dialog-body';
  dialogEl.appendChild(bodyEl);
  actionsEl = document.createElement('div');
  actionsEl.className = 'dialog-actions';
  dialogEl.appendChild(actionsEl);
  backdrop.appendChild(dialogEl);
  host.appendChild(backdrop);
  keyHandler = handleKey;
  focusHandler = handleFocusTrap;
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('keydown', focusHandler, true);
}

export function initDialog() {
  if (host) return;
  host = document.createElement('div');
  host.className = 'dialog-host';
  document.body.appendChild(host);
}

export function confirmDialog({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'OK',
  cancelText = 'Cancel',
  danger = false,
} = {}) {
  if (!host) initDialog();
  return new Promise((resolve) => {
    buildShell(title);
    const msgEl = document.createElement('p');
    msgEl.className = 'dialog-message';
    msgEl.textContent = message;
    bodyEl.appendChild(msgEl);
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'dialog-btn';
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener('click', () => teardown(false));
    actionsEl.appendChild(cancelBtn);
    confirmBtnEl = document.createElement('button');
    confirmBtnEl.type = 'button';
    confirmBtnEl.className = `dialog-btn primary${danger ? ' danger' : ''}`;
    confirmBtnEl.textContent = confirmText;
    confirmBtnEl.addEventListener('click', () => teardown(true));
    actionsEl.appendChild(confirmBtnEl);
    setTimeout(() => cancelBtn.focus(), 0);
    activeResolver = resolve;
  });
}

export function showDialog({ title = '', content, dismissText = 'Close' } = {}) {
  if (!host) initDialog();
  return new Promise((resolve) => {
    buildShell(title);
    if (content instanceof HTMLElement) {
      bodyEl.appendChild(content);
    }
    confirmBtnEl = document.createElement('button');
    confirmBtnEl.type = 'button';
    confirmBtnEl.className = 'dialog-btn primary';
    confirmBtnEl.textContent = dismissText;
    confirmBtnEl.addEventListener('click', () => teardown(true));
    actionsEl.appendChild(confirmBtnEl);
    setTimeout(() => confirmBtnEl.focus(), 0);
    activeResolver = resolve;
  });
}
