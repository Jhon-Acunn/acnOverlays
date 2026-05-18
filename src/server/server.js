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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use('/assets', express.static(ASSETS_DIR));
app.use(express.json({ limit: '50mb' }));

// API: listar archivos en /assets/logos/
app.get('/api/media', (req, res) => {
  const logosDir = path.join(ASSETS_DIR, 'logos');
  if (!fs.existsSync(logosDir)) { fs.mkdirSync(logosDir, { recursive: true }); return res.json([]); }
  const files = fs.readdirSync(logosDir)
    .filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f))
    .map(f => ({ name: f, url: '/assets/logos/' + f }));
  res.json(files);
});

// API: subir archivos (base64 via JSON)
app.post('/api/media/upload', (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: 'name y data requeridos' });
  const safeName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = path.join(ASSETS_DIR, 'logos', safeName);
  const buffer = Buffer.from(data, 'base64');
  fs.writeFileSync(dest, buffer);
  res.json({ name: safeName, url: '/assets/logos/' + safeName });
});

// API: eliminar archivo
app.delete('/api/media/:name', (req, res) => {
  const safeName = path.basename(req.params.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = path.join(ASSETS_DIR, 'logos', safeName);
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  res.json({ ok: true });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));

  app.get('/', (req, res) => {
    res.redirect('/dashboard/');
  });
}

io.on('connection', (socket) => {
  console.log(`[SOCKET] Conexión establecida id: ${socket.id}`);

  socket.on('update-graphic', (payload) => {
    io.emit('render-graphic', payload);
  });

  socket.on('disconnect', () => {
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
