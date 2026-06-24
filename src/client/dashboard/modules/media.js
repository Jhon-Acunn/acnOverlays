import { copiarURL } from './utils.js';

async function cargarMedia() {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    grid.innerHTML = '';
    for (const f of files) {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img src="${f.url}" loading="lazy">
        <div class="name">${f.name}</div>
        <div class="actions">
          <button class="media-copy" data-url="${f.url}">Copiar URL</button>
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
  document.getElementById('media-upload-btn')?.addEventListener('click', () => {
    document.getElementById('media-file-input')?.click();
  });

  document.getElementById('media-file-input')?.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    for (const file of files) {
      const reader = new FileReader();
      const data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      try {
        await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, data }),
        });
      } catch {
        /* noop */
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
