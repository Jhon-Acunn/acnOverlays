require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const ASSETS_DIR = path.resolve(__dirname, '../client/assets');
const LOGOS_DIR = path.join(ASSETS_DIR, 'logos');
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB por archivo

// ── Process-level crash protection ──
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use('/assets', express.static(ASSETS_DIR));
app.use(express.json({ limit: '50mb' }));

// Helper: ensure logos dir exists
function ensureLogosDir() {
  if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

// Helper: validate file stays within logos dir (prevents path traversal)
function safeDest(filename) {
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = path.join(LOGOS_DIR, safe);
  if (!dest.startsWith(LOGOS_DIR + path.sep)) return null; // safety check
  return dest;
}

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// API: listar archivos en /assets/logos/
app.get('/api/media', (_req, res) => {
  try {
    if (!fs.existsSync(LOGOS_DIR)) return res.json([]);
    const files = fs.readdirSync(LOGOS_DIR)
      .filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f))
      .map(f => ({ name: f, url: '/assets/logos/' + f }));
    res.json(files);
  } catch (err) {
    console.error('[API/media] Error listing:', err);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

// API: subir archivos (base64 via JSON)
app.post('/api/media/upload', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'name y data requeridos' });

    // Validate file size (base64 is ~37% larger than binary)
    const approxBytes = Buffer.byteLength(data, 'utf8') * 0.75;
    if (approxBytes > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: `Archivo demasiado grande (máx ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)` });
    }

    const dest = safeDest(name);
    if (!dest) return res.status(400).json({ error: 'Nombre de archivo inválido' });

    ensureLogosDir();
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(dest, buffer);
    res.json({ name: path.basename(dest), url: '/assets/logos/' + path.basename(dest) });
  } catch (err) {
    console.error('[API/media] Error uploading:', err);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

// API: eliminar archivo
app.delete('/api/media/:name', (req, res) => {
  try {
    const dest = safeDest(req.params.name);
    if (!dest) return res.status(400).json({ error: 'Nombre de archivo inválido' });
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    res.json({ ok: true });
  } catch (err) {
    console.error('[API/media] Error deleting:', err);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));

  app.get('/', (req, res) => {
    res.redirect('/dashboard/');
  });
}

// ── Socket.IO with basic rate limiting ──
const EMIT_INTERVAL_MS = 150; // minimum ms between emits per socket
const socketLastEmit = new Map();

io.on('connection', (socket) => {
  console.log(`[SOCKET] Conexión establecida id: ${socket.id}`);

  socket.on('update-graphic', (payload) => {
    const now = Date.now();
    const last = socketLastEmit.get(socket.id) || 0;
    if (now - last < EMIT_INTERVAL_MS) return; // rate limit
    socketLastEmit.set(socket.id, now);
    io.emit('render-graphic', payload);
  });

  socket.on('disconnect', () => {
    socketLastEmit.delete(socket.id);
    console.log(`[SOCKET] Cliente desconectado id: ${socket.id}`);
  });
});

http.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` SERVIDOR DE OVERLAYS LOCAL ACTIVO EN PUERTO: ${PORT}`);

  if (process.env.NODE_ENV === 'production') {
    console.log(` Abrir http://localhost:${PORT}`);
  } else {
    console.log(` Abrir http://localhost:5173 (Vite dev server)`);
    console.log(` Servidor Socket.IO en http://localhost:${PORT}`);
  }

  console.log(`====================================================`);
});
