import { loadJSON, saveJSON } from './storage.js';

const COMBO_SETTINGS_KEY = 'combo_settings';

function saveComboSettings() {
  saveJSON(COMBO_SETTINGS_KEY, {
    comboToggle: document.getElementById('comboToggle')?.checked ?? false,
  });
}

function loadComboSettings() {
  const s = loadJSON(COMBO_SETTINGS_KEY, {});
  if (s.comboToggle !== undefined) {
    const el = document.getElementById('comboToggle');
    if (el) el.checked = s.comboToggle;
  }
}

export function initCombo() {
  loadComboSettings();
  if (document.getElementById('comboToggle')?.checked) {
    flipAll(true);
  }
  const ids = ['dualBothToggle', 'sponsorToggle', 'tkrToggle', 'livebugToggle'];
  function flipAll(on) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const shouldBe = on;
      if (el.checked !== shouldBe) {
        el.checked = shouldBe;
        el.dispatchEvent(new Event('change'));
      }
    });
  }
  document.getElementById('comboToggle')?.addEventListener('change', function () {
    flipAll(this.checked);
    saveComboSettings();
  });
}
