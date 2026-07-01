import { copiarURL } from './utils.js';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
const VALID_EXT = /\.(png|jpg|jpeg|gif|svg|webp)$/i;

async function cargarMedia() {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    grid.innerHTML = '';
    if (!files.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;grid-column:1/-1;padding:1rem;">No images uploaded yet. Click "+ Upload Images" to add some.</p>';
      return;
    }
    for (const f of files) {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img src="${f.url}" loading="lazy" alt="${f.name}">
        <div class="name">${f.name}</div>
        <div class="actions">
          <button class="media-copy" data-url="${f.url}">Copy URL</button>
          <button class="media-del" data-name="${f.name}">×</button>
        </div>
      `;
      grid.appendChild(card);
    }
  } catch {
    /* noop */
  }
}

export function initMedia() {
  // Load media on init so the grid is ready when the user first opens the
  // tab. Also refresh on tab click in case uploads happened while hidden.
  cargarMedia();

  document.getElementById('media-upload-btn')?.addEventListener('click', () => {
    document.getElementById('media-file-input')?.click();
  });

  document.getElementById('media-file-input')?.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const rejected = [];
    for (const file of files) {
      // Reject anything that is not an image at the client. The server
      // does the same check as a second line of defense.
      if (!VALID_TYPES.includes(file.type) && !VALID_EXT.test(file.name)) {
        rejected.push(file.name);
        continue;
      }
      const reader = new FileReader();
      const data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      try {
        const resp = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, data }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          rejected.push(`${file.name} (${err.error || resp.status})`);
        }
      } catch {
        rejected.push(file.name);
      }
    }
    if (rejected.length) {
      // Surface a small notice via the dashboard toast if available
      const toast = window.__acnToast;
      if (typeof toast === 'function') {
        toast(`Skipped non-image files: ${rejected.join(', ')}`, { type: 'error', duration: 4000 });
      } else {
        console.warn('[MEDIA] Skipped files:', rejected);
      }
    }
    e.target.value = '';
    cargarMedia();
  });

  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.media-copy');
    if (copyBtn) {
      const url = window.location.origin + copyBtn.dataset.url;
      try {
        await copiarURL(url);
      } catch {
        /* noop */
      }
      return;
    }
    const delBtn = e.target.closest('.media-del');
    if (delBtn) {
      try {
        await fetch('/api/media/' + encodeURIComponent(delBtn.dataset.name), {
          method: 'DELETE',
        });
        cargarMedia();
      } catch {
        /* noop */
      }
    }
  });

  document.querySelector('[data-tab="media"]')?.addEventListener('click', () => {
    setTimeout(cargarMedia, 100);
  });
}
