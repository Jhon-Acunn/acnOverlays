# Realtime Overlays

Sistema de gráficos superpuestos autónomo para OBS Studio / vMix.

## Estructura

```
├── src/
│   ├── server/
│   │   └── server.js            Servidor Express + Socket.IO
│   └── client/
│       ├── dashboard/            Panel de control
│       │   ├── index.html
│       │   └── app.js
│       └── templates/            Overlays para OBS/vMix
│           ├── lower-third/
│           ├── scoreboard/
│           └── sponsors/
├── dist/client/                  Build de producción (generado)
├── .env                          Variables de entorno
├── vite.config.js
├── package.json
└── README.md
```

## Instalación

```bash
npm install
```

## Uso

```bash
# Desarrollo (servidor + Vite hot-reload)
npm run dev

# Build producción
npm run build

# Producción
npm start
```

Vite (puerto **5173**) proxy los eventos Socket.IO al servidor Express (puerto **3000**).  
En producción, Express sirve los archivos build de `dist/client/`.

| Modo         | Panel de control                     |
|--------------|--------------------------------------|
| Desarrollo   | `http://localhost:5173/dashboard/`   |
| Producción   | `http://localhost:3000`              |

### En OBS / vMix

Agregar una **Browser Source** por cada template:

| Template      | Desarrollo (puerto 5173)                          | Producción (puerto 3000)                             |
|---------------|---------------------------------------------------|------------------------------------------------------|
| Lower Third   | `http://localhost:5173/templates/lower-third/`    | `http://localhost:3000/templates/lower-third/`       |
| Scoreboard    | `http://localhost:5173/templates/scoreboard/`     | `http://localhost:3000/templates/scoreboard/`        |
| Sponsors      | `http://localhost:5173/templates/sponsors/`       | `http://localhost:3000/templates/sponsors/`          |

## Overlays

### Scoreboard
- Control de puntuación para dos equipos
- Persiste el marcador en localStorage
- Botones +1 / -1 y reset

### Lower Third
- Nombre, apellido y cargo con animaciones GSAP
- Personalización en vivo: fuente, colores, tamaños, posición, escala
- Caja fantasma blanca decorativa

### Sponsors
- Rotación automática de patrocinadores con fade
- Animación de entrada/salida

## Tecnologías

- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** JavaScript vanilla, GSAP, Vite
- **Seguridad:** Helmet
