export function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light') document.documentElement.setAttribute('data-theme', 'light');
  const toggle = document.getElementById('themeSwitch');
  if (toggle) {
    toggle.checked = stored === 'light';
    toggle.addEventListener('change', () => {
      const theme = toggle.checked ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }
}
