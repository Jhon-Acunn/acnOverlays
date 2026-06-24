import { loadJSON, saveJSON } from './storage.js';

export function createGuestSlots({ gridId, storageKey, getCurrent, applyData, formatTitle, applyPreview }) {
  const grid = document.getElementById(gridId);
  if (!grid) return null;
  const data = loadJSON(storageKey, {});
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
    grid.querySelectorAll('.guest-btn').forEach((btn) => {
      const i = Number(btn.dataset.slot);
      const filled = !!data[i];
      btn.classList.toggle('filled', filled);
      btn.title = filled ? formatTitle(data[i]) : 'Slot vacío — clic der. para guardar';
    });
  }

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (data[i] ? ' filled' : '');
    btn.dataset.slot = String(i);
    btn.textContent = String(i);
    btn.title = data[i] ? formatTitle(data[i]) : 'Slot vacío — clic der. para guardar';

    btn.addEventListener('click', (e) => {
      if (e.shiftKey) {
        delete data[i];
        saveJSON(storageKey, data);
        markActive(activeSlot === i ? null : activeSlot);
        refresh();
        return;
      }
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
