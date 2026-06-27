import { loadJSON, saveJSON, onStorageSave } from './storage.js';
import { confirmDialog } from './dialog.js';
import { showToast } from './toast.js';

const LONG_PRESS_MS = 2000;

function showSlotToast(message, type) {
  if (typeof showToast === 'function') showToast(message, { type, duration: 2200 });
}

export function createGuestSlots({
  gridId,
  storageKey,
  getCurrent,
  applyData,
  formatTitle,
  applyPreview,
  applyDataLocal,
}) {
  const grid = document.getElementById(gridId);
  if (!grid) return null;
  let data = loadJSON(storageKey, {});
  let activeSlot = null;
  const applyLocal = applyDataLocal || applyData;

  function markActive(slot) {
    grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
    if (slot !== null) {
      const btn = grid.querySelector(`.guest-btn[data-slot="${slot}"]`);
      if (btn) btn.classList.add('active-slot');
    }
    activeSlot = slot;
  }

  function truncate(s, n = 60) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function tooltipFor(i) {
    if (data[i]) return truncate(formatTitle(data[i]), 60);
    return 'Empty Slot';
  }

  function refresh() {
    data = loadJSON(storageKey, {});
    grid.querySelectorAll('.guest-btn').forEach((btn) => {
      const i = Number(btn.dataset.slot);
      const filled = !!data[i];
      btn.classList.toggle('filled', filled);
      const tip = filled ? tooltipFor(i) : 'Empty Slot';
      btn.title = tip;
      btn.setAttribute('data-tooltip', tip);
    });
  }

  function deleteSlot(i) {
    delete data[i];
    saveJSON(storageKey, data);
    if (activeSlot === i) markActive(null);
    refresh();
  }

  onStorageSave(storageKey, refresh);

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (data[i] ? ' filled' : '');
    btn.dataset.slot = String(i);
    const label = document.createElement('span');
    label.className = 'guest-btn-label';
    label.textContent = String(i);
    btn.appendChild(label);
    const initialTip = data[i] ? tooltipFor(i) : 'Slot ' + i + ' — click to load';
    btn.title = data[i] ? initialTip : 'Empty slot — right-click to save';
    btn.setAttribute('data-tooltip', initialTip);
    btn.type = 'button';

    let pressTimer = null;
    let progressInterval = null;
    let longPressTriggered = false;
    const originalText = String(i);

    function clearProgress() {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      btn.style.opacity = '1';
      label.textContent = originalText;
    }

    async function startLongPress() {
      if (!data[i]) {
        clearProgress();
        return;
      }
      const ok = await confirmDialog({
        title: 'Delete Preset',
        message: 'Delete slot ' + i + '?',
        confirmText: 'Delete',
        danger: true,
      });
      if (!ok) {
        clearProgress();
        return;
      }
      longPressTriggered = true;
      deleteSlot(i);
      clearProgress();
    }

    function startPressDetection() {
      if (!data[i]) return;
      longPressTriggered = false;
      clearProgress();
      pressTimer = setTimeout(() => {
        pressTimer = null;
        let elapsed = 0;
        const step = 100;
        progressInterval = setInterval(() => {
          elapsed += step;
          const progress = elapsed / LONG_PRESS_MS;
          btn.style.opacity = String(1 - progress * 0.7);
          label.textContent = Math.ceil((LONG_PRESS_MS - elapsed) / 1000) + 's';
          if (elapsed >= LONG_PRESS_MS) {
            clearInterval(progressInterval);
            progressInterval = null;
            startLongPress();
          }
        }, step);
      }, 200);
    }

    btn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      startPressDetection();
    });
    btn.addEventListener('touchstart', () => startPressDetection(), { passive: true });

    btn.addEventListener('mouseup', clearProgress);
    btn.addEventListener('mouseleave', clearProgress);
    btn.addEventListener('touchend', clearProgress);
    btn.addEventListener('touchcancel', clearProgress);

    btn.addEventListener('click', (e) => {
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }
      if (e.shiftKey && e.altKey) {
        if (!data[i]) return;
        confirmDialog({
          title: 'Delete Preset',
          message: 'Delete slot ' + i + '?',
          confirmText: 'Delete',
          danger: true,
        }).then((ok) => {
          if (ok) deleteSlot(i);
        });
        return;
      }
      data = loadJSON(storageKey, {});
      if (!data[i]) return;
      if (e.altKey) {
        if (typeof applyLocal === 'function') applyLocal(data[i]);
        showSlotToast(`Slot ${i} loaded (not sent to air)`, 'info');
      } else {
        applyData(data[i]);
        showSlotToast(`Slot ${i} sent to air`, 'success');
      }
      markActive(i);
      if (applyPreview) applyPreview();
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const current = getCurrent();
      if (!current) return;
      data[i] = current;
      saveJSON(storageKey, data);
      btn.classList.add('filled');
      const tip = tooltipFor(i);
      btn.title = tip;
      btn.setAttribute('data-tooltip', tip);
      markActive(i);
      if (applyPreview) applyPreview();
    });

    grid.appendChild(btn);
  }

  return {
    loadInitial(slot = 1) {
      data = loadJSON(storageKey, {});
      if (data[slot]) {
        applyData(data[slot]);
        markActive(slot);
      }
    },
    get data() {
      return data;
    },
  };
}
