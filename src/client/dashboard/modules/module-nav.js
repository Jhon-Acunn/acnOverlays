import { MODULES, loadVisibility } from './settings-panel.js';
import { ajustarEscalas } from './utils.js';

let currentIndex = 0;
let visibleModules = [];
let qpSyncToggles = null;

function getTabContentEl(moduleId) {
  return document.querySelector(`.tab-content[data-tab-content="${moduleId}"]`);
}

function moveSectionsToContainer() {
  const container = document.getElementById('module-container');
  if (!container) return;
  for (const m of MODULES) {
    const section = getTabContentEl(m.id);
    if (section && section.parentElement !== container) {
      section.removeAttribute('style');
      section.hidden = true;
      container.appendChild(section);
    }
  }
}

function showModule(index) {
  if (index < 0 || index >= visibleModules.length) return;
  currentIndex = index;
  const m = visibleModules[index];

  for (const mod of MODULES) {
    const section = getTabContentEl(mod.id);
    if (section) section.hidden = true;
  }
  const activeSection = getTabContentEl(m.id);
  if (activeSection) activeSection.hidden = false;

  // Update tabs
  document.querySelectorAll('.module-tab').forEach((tab) => {
    const tabModuleId = tab.dataset.moduleId;
    tab.classList.toggle('active', tabModuleId === m.id);
  });

  // Scale previews after the section is visible
  setTimeout(ajustarEscalas, 50);
}

function renderTabs() {
  const tabsContainer = document.getElementById('module-tabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = '';
  visibleModules.forEach((m, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'module-tab' + (i === currentIndex ? ' active' : '');
    tab.dataset.moduleId = m.id;
    tab.textContent = m.name;
    tab.addEventListener('click', () => showModule(i));
    tabsContainer.appendChild(tab);
  });
}

function updateVisibleModules() {
  const visibility = loadVisibility();
  visibleModules = MODULES.filter((m) => visibility[m.id]);
  if (currentIndex >= visibleModules.length) currentIndex = Math.max(0, visibleModules.length - 1);

  renderTabs();

  if (visibleModules.length > 0) showModule(currentIndex);
  else {
    const container = document.getElementById('module-container');
    if (container)
      container.innerHTML =
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No modules active. Enable at least one in Settings.</p>';
  }
}

export function initModuleNav({ syncToggles }) {
  qpSyncToggles = syncToggles;
  moveSectionsToContainer();
  updateVisibleModules();

  window.addEventListener('resize', () => setTimeout(ajustarEscalas, 50));
}

export function navigateToModule(moduleId) {
  const idx = visibleModules.findIndex((m) => m.id === moduleId);
  if (idx >= 0) showModule(idx);
}

export function onModuleVisibilityChanged() {
  updateVisibleModules();
  if (qpSyncToggles) qpSyncToggles();
}
