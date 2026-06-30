import { setVal, bindFontPicker } from './utils.js';
import { createGuestSlots } from './guest-slots.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON, SERVER_SETTINGS_EVENT, isApplyingRemote } from './storage.js';

const TIPO = 'SPONSORS';
const TAB = 'sponsors';
const PREVIEW_TIPO = 'PREVIEW_SPONSORS';
const TOGGLE_ID = 'sponsorToggle';

let spSaveTimer;

function saveSponsorsSettings() {
  const sponsorItems = [];
  document.querySelectorAll('.sponsor-item').forEach((item) => {
    const nameEl = item.querySelector('.sp-name');
    const urlEl = item.querySelector('.sp-logo-url');
    sponsorItems.push({
      name: nameEl ? nameEl.value : '',
      url: urlEl ? urlEl.value : '',
    });
  });
  saveJSON('sponsors_settings', {
    spBarText: document.getElementById('spBarText').value,
    spBarHeight: document.getElementById('spBarHeight').value,
    spRotationSpeed: document.getElementById('spRotationSpeed').value,
    spBarColor: document.getElementById('spBarColor').value,
    spBarTextColor: document.getElementById('spBarTextColor').value,
    spBgTop: document.getElementById('spBgTop').value,
    spBgBottom: document.getElementById('spBgBottom').value,
    spFont: document.getElementById('spFont').value,
    spScale: document.getElementById('spScale').value,
    spPosX: document.getElementById('spPosX').value,
    spPosY: document.getElementById('spPosY').value,
    sponsorToggle: document.getElementById('sponsorToggle').checked,
    sponsorItems,
  });
}

function loadSponsorsSettings() {
  const s = loadJSON('sponsors_settings', {});
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };
  set('spBarText', s.spBarText);
  set('spBarHeight', s.spBarHeight);
  set('spRotationSpeed', s.spRotationSpeed);
  set('spBarColor', s.spBarColor);
  set('spBarTextColor', s.spBarTextColor);
  set('spBgTop', s.spBgTop);
  set('spBgBottom', s.spBgBottom);
  set('spFont', s.spFont);
  set('spScale', s.spScale);
  set('spPosX', s.spPosX);
  set('spPosY', s.spPosY);
  const toggle = document.getElementById('sponsorToggle');
  if (toggle && s.sponsorToggle !== undefined) toggle.checked = s.sponsorToggle;
  if (s.sponsorItems && s.sponsorItems.length > 0) {
    const list = document.getElementById('sponsor-list');
    if (list) {
      list.innerHTML = '';
      s.sponsorItems.forEach((sp) => list.appendChild(crearSponsorItem(sp)));
    }
  }
}

function debouncedSaveSp() {
  if (isApplyingRemote()) return;
  clearTimeout(spSaveTimer);
  spSaveTimer = setTimeout(saveSponsorsSettings, 300);
}

function leerSponsorsCfg() {
  return {
    barText: document.getElementById('spBarText').value || 'PATROCINADO POR',
    barColor: document.getElementById('spBarColor').value || '#e53935',
    barTextColor: document.getElementById('spBarTextColor').value || '#ffffff',
    barHeight: parseInt(document.getElementById('spBarHeight').value, 10) || 44,
    bgGradientTop: document.getElementById('spBgTop').value || '#3a3a3a',
    bgGradientBottom: document.getElementById('spBgBottom').value || '#555555',
    rotationSpeed: parseInt(document.getElementById('spRotationSpeed').value, 10) || 5000,
    fontFamily: document.getElementById('spFont').value || 'Montserrat, sans-serif',
    escala: parseFloat(document.getElementById('spScale').value) || 1.0,
    posX: parseInt(document.getElementById('spPosX').value, 10) || 0,
    posY: parseInt(document.getElementById('spPosY').value, 10) || 0,
  };
}

function leerSponsors() {
  const items = document.querySelectorAll('.sponsor-item');
  const sponsors = [];
  items.forEach((item) => {
    const name = item.querySelector('.sp-name').value.trim();
    const logoUrl = item.querySelector('.sp-logo-url').value.trim() || null;
    if (name || logoUrl) sponsors.push({ name, logoUrl });
  });
  return sponsors;
}

function leerSponsorsData() {
  return { sponsors: leerSponsors(), config: leerSponsorsCfg() };
}

function sponsorsUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerSponsorsData,
    toggleId: TOGGLE_ID,
  });
}

function sponsorsEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerSponsorsData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

let spPickerTarget = null;
let spPickerPopup = null;

function ensurePickerPopup() {
  if (spPickerPopup) return spPickerPopup;
  const popup = document.createElement('div');
  popup.id = 'sp-logo-picker';
  popup.style.cssText =
    'position:fixed;z-index:999;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:0.5rem;max-height:200px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:0.4rem;width:260px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  document.body.appendChild(popup);
  popup.addEventListener('click', (e) => {
    const pickBtn = e.target.closest('[data-pick-url]');
    if (!pickBtn) return;
    if (spPickerTarget) spPickerTarget.value = pickBtn.dataset.pickUrl;
    popup.style.display = 'none';
    sponsorsUpdate();
    debouncedSaveSp();
  });
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !e.target.closest('.sp-pick-logo')) {
      popup.style.display = 'none';
    }
  });
  spPickerPopup = popup;
  return popup;
}

async function mostrarPicker(btn) {
  const item = btn.closest('.sponsor-item');
  spPickerTarget = item.querySelector('.sp-logo-url');
  const popup = ensurePickerPopup();
  const rect = btn.getBoundingClientRect();
  popup.style.top = rect.bottom + 4 + 'px';
  popup.style.left = Math.max(4, rect.left) + 'px';
  popup.style.display = 'flex';
  popup.innerHTML =
    '<div style="width:100%;font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem;">Select logo:</div>';
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    if (!files.length) {
      popup.innerHTML +=
        '<div style="font-size:0.7rem;color:var(--text-muted);width:100%;">Upload logos in the Media tab</div>';
      return;
    }
    const btnNinguno = document.createElement('button');
    btnNinguno.textContent = 'No Logo';
    btnNinguno.style.cssText =
      'font-size:0.7rem;padding:2px 6px;border-radius:4px;border:1px solid var(--border);background:var(--btn-bg);color:var(--text);cursor:pointer;';
    btnNinguno.dataset.pickUrl = '';
    popup.appendChild(btnNinguno);
    files.forEach((f) => {
      const b = document.createElement('button');
      b.style.cssText =
        'width:48px;height:36px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);cursor:pointer;overflow:hidden;padding:0;';
      b.innerHTML = `<img src="${f.url}" style="width:100%;height:100%;object-fit:contain;">`;
      b.dataset.pickUrl = f.url;
      b.title = f.name;
      popup.appendChild(b);
    });
  } catch {
    /* noop */
  }
}

function crearSponsorItem(sp) {
  const item = document.createElement('div');
  item.className = 'sponsor-item';
  item.style.cssText = 'display:flex;gap:0.3rem;align-items:center;width:100%;';
  const nameVal = sp?.name || '';
  const logoVal = sp?.logoUrl || '';
  item.innerHTML = `
    <input type="text" class="sp-name" placeholder="Name" value="${nameVal.replace(/"/g, '&quot;')}" style="flex:1;min-width:80px;font-size:0.8rem;">
    <input type="text" class="sp-logo-url" placeholder="Logo URL (optional)" value="${logoVal.replace(/"/g, '&quot;')}" style="flex:1.5;min-width:100px;font-size:0.8rem;">
    <button class="sp-pick-logo small" title="Select from Media" style="padding:0.3rem 0.4rem;font-size:0.8rem;">📁</button>
    <button class="sp-remove small danger" style="padding:0.3rem 0.4rem;font-size:0.8rem;">×</button>
  `;
  const nameInput = item.querySelector('.sp-name');
  const logoInput = item.querySelector('.sp-logo-url');
  nameInput.addEventListener('input', sponsorsUpdate);
  logoInput.addEventListener('input', sponsorsUpdate);
  item.querySelector('.sp-pick-logo').addEventListener('click', function () {
    mostrarPicker(this);
  });
  item.querySelector('.sp-remove').addEventListener('click', () => {
    item.remove();
    sponsorsUpdate();
    debouncedSaveSp();
  });
  return item;
}

function sponsorsAddItem() {
  const list = document.getElementById('sponsor-list');
  const item = crearSponsorItem();
  list.appendChild(item);
  setTimeout(() => item.querySelector('.sp-name').focus(), 50);
  sponsorsUpdate();
  debouncedSaveSp();
}

export function initSponsors() {
  loadSponsorsSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === 'sponsors_settings' && e.newValue) {
      loadSponsorsSettings();
      const container = document.querySelector('[data-tab-content="sponsors"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  window.addEventListener(SERVER_SETTINGS_EVENT, (e) => {
    if (e.detail && e.detail.key === 'sponsors_settings') {
      loadSponsorsSettings();
      const container = document.querySelector('[data-tab-content="sponsors"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  const list = document.getElementById('sponsor-list');
  if (list && !list.children.length) {
    for (let i = 1; i <= 3; i++) {
      const item = document.createElement('div');
      item.className = 'sponsor-item';
      item.style.cssText = 'display:flex;gap:0.3rem;align-items:center;width:100%;';
      item.innerHTML = `
        <input type="text" class="sp-name" placeholder="Name" value="Sponsor ${String.fromCharCode(64 + i)}" style="flex:1;min-width:80px;font-size:0.8rem;">
        <input type="text" class="sp-logo-url" placeholder="Logo URL (optional)" style="flex:1.5;min-width:100px;font-size:0.8rem;">
        <button class="sp-pick-logo small" title="Select from Media" style="padding:0.3rem 0.4rem;font-size:0.8rem;">📁</button>
        <button class="sp-remove small danger" style="padding:0.3rem 0.4rem;font-size:0.8rem;">×</button>
      `;
      item.querySelector('.sp-name').addEventListener('input', sponsorsUpdate);
      item.querySelector('.sp-logo-url').addEventListener('input', sponsorsUpdate);
      item.querySelector('.sp-pick-logo').addEventListener('click', function () {
        mostrarPicker(this);
      });
      item.querySelector('.sp-remove').addEventListener('click', () => {
        item.remove();
        sponsorsUpdate();
        debouncedSaveSp();
      });
      list.appendChild(item);
    }
  }

  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) sponsorsUpdate();
  }, 500);

  document.getElementById('sponsor-add')?.addEventListener('click', sponsorsAddItem);

  document.getElementById('sponsorToggle')?.addEventListener('change', function () {
    sponsorsEmit(this.checked ? 'SHOW' : 'HIDE');
  });

  bindFontPicker('spFontDropdownBtn', 'spFont');

  for (const id of [
    'spBarText',
    'spBarColor',
    'spBarTextColor',
    'spBgTop',
    'spBgBottom',
    'spFont',
    'spScale',
    'spPosX',
    'spPosY',
  ]) {
    document.getElementById(id)?.addEventListener('input', sponsorsUpdate);
    document.getElementById(id)?.addEventListener('input', debouncedSaveSp);
  }
  for (const id of ['spBarHeight', 'spRotationSpeed']) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', () => {
      const val = document.getElementById('valSp' + id.slice(2));
      if (val) {
        val.textContent =
          id === 'spRotationSpeed'
            ? (parseInt(el.value, 10) / 1000).toFixed(1) + 's'
            : el.value + 'px';
      }
      sponsorsUpdate();
      debouncedSaveSp();
    });
  }
  }
  ['spBarHeight', 'spRotationSpeed'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = document.getElementById('valSp' + id.slice(2));
    if (val) {
      val.textContent =
        id === 'spRotationSpeed'
          ? (parseInt(el.value, 10) / 1000).toFixed(1) + 's'
          : el.value + 'px';
    }
  });

  document.getElementById('spResetStyle')?.addEventListener('click', () => {
    document.getElementById('spBarText').value = 'PATROCINADO POR';
    document.getElementById('spBarColor').value = '#e53935';
    document.getElementById('spBarTextColor').value = '#ffffff';
    document.getElementById('spBarHeight').value = '44';
    document.getElementById('spBgTop').value = '#3a3a3a';
    document.getElementById('spBgBottom').value = '#555555';
    document.getElementById('spRotationSpeed').value = '5000';
    document.getElementById('spFont').value = 'Montserrat, sans-serif';
    document.getElementById('spScale').value = '1.0';
    document.getElementById('spPosX').value = '0';
    document.getElementById('spPosY').value = '0';
    setVal('valSpBarHeight', '44px');
    setVal('valSpRotationSpeed', '5.0s');
    sponsorsUpdate();
    debouncedSaveSp();
  });

  createGuestSlots({
    gridId: 'sponsor-guest-grid',
    storageKey: 'sponsor_guests',
    getCurrent: () => {
      const sponsors = leerSponsors();
      if (!sponsors.length) return null;
      return { sponsors, config: leerSponsorsCfg() };
    },
    applyData: (data) => {
      const list = document.getElementById('sponsor-list');
      if (!list) return;
      list.innerHTML = '';
      if (data.sponsors) {
        data.sponsors.forEach((sp) => list.appendChild(crearSponsorItem(sp)));
      }
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      if (data.config) {
        set('spBarText', data.config.barText);
        set('spBarColor', data.config.barColor);
        set('spBarTextColor', data.config.barTextColor);
        set('spBarHeight', data.config.barHeight);
        set('spBgTop', data.config.bgGradientTop);
        set('spBgBottom', data.config.bgGradientBottom);
        set('spRotationSpeed', data.config.rotationSpeed);
        set('spFont', data.config.fontFamily);
        set('spScale', data.config.escala);
        set('spPosX', data.config.posX);
        set('spPosY', data.config.posY);
        setVal('valSpBarHeight', document.getElementById('spBarHeight').value + 'px');
        setVal(
          'valSpRotationSpeed',
          (parseInt(document.getElementById('spRotationSpeed').value, 10) / 1000).toFixed(1) + 's'
        );
      }
      sponsorsUpdate();
    },
    formatTitle: (d) => d.sponsors?.[0]?.name || 'Config',
    applyPreview: sponsorsUpdate,
  })?.loadInitial(1);

  const spContainer = document.querySelector('[data-tab-content="sponsors"]');
  if (spContainer) {
    spContainer.addEventListener('input', debouncedSaveSp);
    spContainer.addEventListener('change', debouncedSaveSp);
  }
}
