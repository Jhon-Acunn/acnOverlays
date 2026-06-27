const MODULES = [
  { id: 'lower-dual', name: 'Lower Dual', tipos: ['LOWER_DUAL'] },
  { id: 'lower', name: 'Lower Third', tipos: ['LOWER_THIRD'] },
  { id: 'ticker', name: 'Ticker', tipos: ['TICKER'] },
  { id: 'sponsors', name: 'Patrocinadores', tipos: ['SPONSORS'] },
  { id: 'livebug', name: 'Live Bug', tipos: ['LIVEBUG'] },
  { id: 'weather', name: 'Clima', tipos: ['WEATHER'] },
  { id: 'scoreboard', name: 'Scoreboard', tipos: ['SCOREBOARD'] },
  { id: 'countdown', name: 'Cuenta atrás', tipos: ['COUNTDOWN'] },
  { id: 'nowplaying', name: 'Música', tipos: ['NOWPLAYING'] },
  { id: 'resultados', name: 'Resultados', tipos: ['RESULTADOS'] },
  { id: 'media', name: 'Media', tipos: [] },
];

const STORAGE_KEY = 'module_visibility';

function loadVisibility() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const result = {};
    for (const m of MODULES) {
      result[m.id] = stored[m.id] !== false;
    }
    return result;
  } catch {
    return MODULES.reduce((acc, m) => {
      acc[m.id] = true;
      return acc;
    }, {});
  }
}

function saveVisibility(visibility) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
}

function renderModuleList(visibility, onChange) {
  const list = document.getElementById('sp-module-list');
  if (!list) return;
  list.innerHTML = '';
  for (const m of MODULES) {
    const row = document.createElement('div');
    row.className = 'sp-module-row' + (visibility[m.id] ? '' : ' disabled');
    row.dataset.moduleId = m.id;
    row.innerHTML = `
      <span class="sp-module-name">${m.name}</span>
      <label class="switch">
        <input type="checkbox" ${visibility[m.id] ? 'checked' : ''} data-module-toggle="${m.id}">
        <span class="switch-slider"></span>
      </label>
    `;
    list.appendChild(row);
  }
  list.querySelectorAll('input[data-module-toggle]').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const moduleId = e.target.getAttribute('data-module-toggle');
      visibility[moduleId] = e.target.checked;
      saveVisibility(visibility);
      const row = e.target.closest('.sp-module-row');
      if (row) row.classList.toggle('disabled', !e.target.checked);
      onChange(moduleId, e.target.checked);
    });
  });
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const sw = document.getElementById('spThemeSwitch');
  if (sw) {
    sw.checked = saved === 'dark';
    sw.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }
}

export function initSettingsPanel({ onModuleVisibilityChange }) {
  initTheme();

  const visibility = loadVisibility();
  renderModuleList(visibility, (moduleId, isVisible) => {
    onModuleVisibilityChange(moduleId, isVisible);
  });

  // Initial visibility sync
  for (const m of MODULES) {
    onModuleVisibilityChange(m.id, visibility[m.id]);
  }

  // Connection info
  const connInfo = document.getElementById('sp-connection-info');
  if (connInfo) {
    function updateConnInfo() {
      const status = document.getElementById('conn-pill') || null;
      const label = status ? status.querySelector('.conn-label')?.textContent : '—';
      const latency = status ? status.querySelector('.conn-latency')?.textContent : '';
      connInfo.innerHTML = `
        <div class="sp-conn-info-row"><span>Status</span><span class="val">${label || '—'}</span></div>
        <div class="sp-conn-info-row"><span>Latency</span><span class="val">${latency || '—'}</span></div>
      `;
    }
    updateConnInfo();
    setInterval(updateConnInfo, 2000);
  }

  // Settings toggle
  const settingsToggle = document.getElementById('settings-toggle');
  const openSettingsBtn = document.getElementById('open-settings-btn');
  function toggleSettings(show) {
    if (typeof show === 'boolean') {
      document.body.classList.toggle('settings-hidden', !show);
    } else {
      document.body.classList.toggle('settings-hidden');
    }
    localStorage.setItem('settings_hidden', document.body.classList.contains('settings-hidden'));
  }
  if (settingsToggle) {
    settingsToggle.addEventListener('click', () => toggleSettings());
  }
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => toggleSettings());
  }
  if (localStorage.getItem('settings_hidden') === 'true') {
    document.body.classList.add('settings-hidden');
  }
}

export { MODULES, loadVisibility, saveVisibility };
