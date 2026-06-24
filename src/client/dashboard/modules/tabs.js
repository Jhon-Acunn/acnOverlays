import { ajustarEscalas } from './utils.js';

const scrollPositions = {};

export function initTabs(onTabChange) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const prevTab = document.querySelector('.tab-content.active');
      if (prevTab) {
        scrollPositions[prevTab.dataset.tabContent] = {
          top: window.scrollY,
          left: window.scrollX,
        };
      }
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.querySelector(`[data-tab-content="${tab.dataset.tab}"]`);
      if (target) target.classList.add('active');
      const saved = scrollPositions[tab.dataset.tab];
      if (saved) {
        requestAnimationFrame(() => window.scrollTo(saved.left || 0, saved.top || 0));
      } else {
        requestAnimationFrame(() => window.scrollTo(0, 0));
      }
      requestAnimationFrame(ajustarEscalas);
      if (typeof onTabChange === 'function') onTabChange(tab.dataset.tab);
    });
  });
  window.addEventListener('resize', ajustarEscalas);
  requestAnimationFrame(ajustarEscalas);
}
