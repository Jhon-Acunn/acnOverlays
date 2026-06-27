import { getSocket } from './socket.js';
import { saveJSON, loadJSON } from './storage.js';
import { showDialog } from './dialog.js';
import { showToast } from './toast.js';

const ALL_HIDE_TYPES = [
  'SCOREBOARD',
  'LOWER_THIRD',
  'LOWER_DUAL',
  'SPONSORS',
  'TICKER',
  'LIVEBUG',
  'WEATHER',
  'COUNTDOWN',
  'NOWPLAYING',
  'RESULTADOS',
  'COMBO',
];

const TAB_KEYS = [
  { key: '1', tab: 'lower-dual' },
  { key: '2', tab: 'ticker' },
  { key: '3', tab: 'sponsors' },
  { key: '4', tab: 'livebug' },
  { key: '5', tab: 'combo' },
  { key: '6', tab: 'lower' },
  { key: '7', tab: 'scoreboard' },
  { key: '8', tab: 'weather' },
  { key: '9', tab: 'countdown' },
];

const SHORTCUTS = [
  { keys: ['?'], desc: 'Show or hide this shortcuts help' },
  { keys: ['Ctrl', 'B'], desc: 'Collapse or expand quick panel' },
  { keys: ['Ctrl', 'H'], desc: 'Hide all overlays on screen' },
  { keys: ['Ctrl', 'Shift', 'H'], desc: 'Show combo on screen' },
  { keys: ['Esc'], desc: 'Hide combo (when no text field is active)' },
  { keys: ['1'], desc: 'Go to Lower Dual tab' },
  { keys: ['2'], desc: 'Go to Ticker tab' },
  { keys: ['3'], desc: 'Go to Sponsors tab' },
  { keys: ['4'], desc: 'Go to Live Bug tab' },
  { keys: ['5'], desc: 'Go to Combo tab' },
  { keys: ['6'], desc: 'Go to Lower Third tab' },
  { keys: ['7'], desc: 'Go to Scoreboard tab' },
  { keys: ['8'], desc: 'Go to Weather tab' },
  { keys: ['9'], desc: 'Go to Countdown tab' },
];

const QP_COLLAPSED_KEY = 'sidebar_collapsed';

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

function isInDialog(target) {
  return !!(target && target.closest && target.closest('.dialog-backdrop'));
}

function emitAccion(tipo, accion) {
  const socket = getSocket();
  if (!socket) return;
  socket.emit('update-graphic', { tipo, data: { accion } });
}

function hideAllOverlays() {
  ALL_HIDE_TYPES.forEach((tipo) => emitAccion(tipo, 'HIDE'));
  showToast('All overlays hidden', { type: 'info' });
}

function showComboOverlay() {
  emitAccion('COMBO', 'SHOW');
  showToast('Combo on air', { type: 'success' });
}

function hideComboOverlay() {
  emitAccion('COMBO', 'HIDE');
  showToast('Combo hidden', { type: 'info' });
}

function switchToTab(tabName) {
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (tab) tab.click();
}

function toggleQuickPanel() {
  const panel = document.getElementById('quick-panel');
  if (!panel) return;
  const collapsed = panel.classList.toggle('collapsed');
  saveJSON(QP_COLLAPSED_KEY, { collapsed });
}

function buildShortcutsContent() {
  const wrapper = document.createElement('div');
  wrapper.className = 'shortcuts-list';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '0.4rem';
  wrapper.style.maxHeight = '60vh';
  wrapper.style.overflowY = 'auto';

  SHORTCUTS.forEach(({ keys, desc }) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '0.6rem';
    row.style.padding = '0.25rem 0';
    row.style.borderBottom = '1px solid var(--border)';

    const keysEl = document.createElement('span');
    keysEl.className = 'shortcut-keys';
    keysEl.style.display = 'inline-flex';
    keysEl.style.gap = '0.25rem';
    keysEl.style.flexShrink = '0';
    keysEl.style.minWidth = '130px';
    keys.forEach((k) => {
      const kbd = document.createElement('kbd');
      kbd.textContent = k;
      kbd.style.fontFamily = 'monospace';
      kbd.style.fontSize = '0.7rem';
      kbd.style.padding = '0.15rem 0.4rem';
      kbd.style.background = 'var(--btn-bg)';
      kbd.style.border = '1px solid var(--border)';
      kbd.style.borderRadius = '4px';
      kbd.style.color = 'var(--text)';
      keysEl.appendChild(kbd);
    });

    const descEl = document.createElement('span');
    descEl.className = 'shortcut-desc';
    descEl.textContent = desc;
    descEl.style.fontSize = '0.8rem';
    descEl.style.color = 'var(--text)';
    descEl.style.flex = '1';

    row.appendChild(keysEl);
    row.appendChild(descEl);
    wrapper.appendChild(row);
  });

  return wrapper;
}

let helpOpen = false;
function showShortcutsHelp() {
  if (helpOpen) return;
  helpOpen = true;
  showDialog({
    title: 'Keyboard Shortcuts',
    content: buildShortcutsContent(),
    dismissText: 'Close',
  }).then(() => {
    helpOpen = false;
  });
}

function handleKeydown(e) {
  if (isInDialog(e.target)) return;

  if (e.key === 'Escape') {
    if (isTypingTarget(e.target)) return;
    if (getSocket() && getSocket().connected) {
      hideComboOverlay();
    }
    return;
  }

  if (isTypingTarget(e.target)) return;

  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    showShortcutsHelp();
    return;
  }

  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && !e.altKey) {
    const key = e.key.toLowerCase();
    if (key === 'b' && !e.shiftKey) {
      e.preventDefault();
      toggleQuickPanel();
      return;
    }
    if (key === 'h' && e.shiftKey) {
      e.preventDefault();
      showComboOverlay();
      return;
    }
    if (key === 'h' && !e.shiftKey) {
      e.preventDefault();
      hideAllOverlays();
      return;
    }
  }

  if (!ctrl && !e.altKey && !e.metaKey && !e.shiftKey) {
    const match = TAB_KEYS.find((t) => t.key === e.key);
    if (match) {
      e.preventDefault();
      switchToTab(match.tab);
    }
  }
}

function buildHintButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'shortcuts-hint-btn';
  btn.textContent = 'SHORTCUTS';
  btn.setAttribute('aria-label', 'Show keyboard shortcuts');
  btn.addEventListener('click', showShortcutsHelp);
  return btn;
}

export function initKeyboardShortcuts() {
  const panel = document.getElementById('quick-panel');
  if (panel) {
    const stored = loadJSON(QP_COLLAPSED_KEY, { collapsed: false });
    if (stored && stored.collapsed) panel.classList.add('collapsed');
  }
  document.addEventListener('keydown', handleKeydown);
  document.body.appendChild(buildHintButton());
}
