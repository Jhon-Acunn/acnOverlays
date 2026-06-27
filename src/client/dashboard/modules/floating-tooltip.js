let portal = null;

function ensurePortal() {
  if (portal) return portal;
  portal = document.createElement('div');
  portal.className = 'floating-tooltip-portal';
  document.body.appendChild(portal);
  return portal;
}

function show(btn) {
  const tip = btn.getAttribute('data-tooltip') || btn.getAttribute('title') || '';
  if (!tip) return;
  const p = ensurePortal();
  const tipEl = document.createElement('div');
  tipEl.className = 'floating-tooltip';
  tipEl.textContent = tip;
  p.appendChild(tipEl);

  const rect = btn.getBoundingClientRect();
  const tipRect = tipEl.getBoundingClientRect();
  const margin = 6;
  let top = rect.top - tipRect.height - margin;
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  if (top < 4) top = rect.bottom + margin;
  if (left < 4) left = 4;
  if (left + tipRect.width > window.innerWidth - 4) {
    left = window.innerWidth - tipRect.width - 4;
  }
  tipEl.style.top = top + 'px';
  tipEl.style.left = left + 'px';
  tipEl.classList.add('visible');
}

function hide() {
  if (portal) portal.innerHTML = '';
}

export function attachFloatingTooltip(btn) {
  if (btn.__floatingTooltipBound) return;
  btn.__floatingTooltipBound = true;
  btn.addEventListener('mouseenter', () => show(btn));
  btn.addEventListener('mouseleave', hide);
  btn.addEventListener('focus', () => show(btn));
  btn.addEventListener('blur', hide);
}
