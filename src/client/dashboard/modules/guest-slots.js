import { loadJSON, saveJSON, onStorageSave } from './storage.js';

const LONG_PRESS_MS = 2000;

export function createGuestSlots({ gridId, storageKey, getCurrent, applyData, formatTitle, applyPreview }) {
  const grid = document.getElementById(gridId);
  if (!grid) return null;
  let data = loadJSON(storageKey, {});
  let activeSlot = null;

  function markActive(slot) {
    grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
    if (slot !== null) {
      const btn = grid.querySelector(`.guest-btn[data-slot="${slot}"]`);
      if (btn) btn.classList.add('active-slot');
    }
    activeSlot = slot;
  }

  function refresh() {
    data = loadJSON(storageKey, {});
    grid.querySelectorAll('.guest-btn').forEach((btn) => {
      const i = Number(btn.dataset.slot);
      const filled = !!data[i];
      btn.classList.toggle('filled', filled);
      btn.title = filled ? formatTitle(data[i]) : 'Slot vacío — clic der. para guardar';
    });
  }

  onStorageSave(storageKey, refresh);

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (data[i] ? ' filled' : '');
    btn.dataset.slot = String(i);
    btn.textContent = String(i);
    btn.title = data[i] ? formatTitle(data[i]) : 'Slot vacío — clic der. para guardar';

    let pressTimer = null;
    let progressInterval = null;
    const originalText = String(i);

    function startLongPress() {
      if (!data[i]) return;
      let elapsed = 0;
      const step = 100;
      btn.style.opacity = '1';
      progressInterval = setInterval(() => {
        elapsed += step;
        const progress = elapsed / LONG_PRESS_MS;
        btn.style.opacity = String(1 - progress * 0.7);
        btn.textContent = Math.ceil((LONG_PRESS_MS - elapsed) / 1000) + 's';
        if (elapsed >= LONG_PRESS_MS) {
          clearInterval(progressInterval);
          delete data[i];
          saveJSON(storageKey, data);
          markActive(activeSlot === i ? null : activeSlot);
          refresh();
          btn.style.opacity = '1';
          btn.textContent = originalText;
        }
      }, step);
    }

    function cancelLongPress() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      btn.style.opacity = '1';
      btn.textContent = originalText;
    }

    btn.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        pressTimer = setTimeout(() => {
          startLongPress();
        }, 200);
      }
    });

    btn.addEventListener('mouseup', cancelLongPress);
    btn.addEventListener('mouseleave', cancelLongPress);
    btn.addEventListener('contextmenu', cancelLongPress);

    btn.addEventListener('click', (e) => {
      if (e.shiftKey) {
        delete data[i];
        saveJSON(storageKey, data);
        markActive(activeSlot === i ? null : activeSlot);
        refresh();
        return;
      }
      data = loadJSON(storageKey, {});
      if (!data[i]) return;
      applyData(data[i]);
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
      btn.title = formatTitle(current);
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
