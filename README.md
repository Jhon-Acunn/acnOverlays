# Realtime Overlays

Sistema de gráficos superpuestos autónomo para OBS Studio / vMix, controlado en tiempo real mediante Socket.IO.

## Estructura

```
├── src/
│   ├── server/
│   │   ├── server.js          Bootstrap: Express + Socket.IO
│   │   ├── config.js          Config centralizada + env validation
│   │   ├── logger.js          Logger estructurado (pino)
│   │   ├── auth.js            Middleware de auth (X-Auth-Token)
│   │   ├── media.js           API REST de logos
│   │   ├── socket.js          Lógica de Socket.IO con rate limit + validación
│   │   └── validation.js      Validador de payloads
│   └── client/
│       ├── dashboard/
│       │   ├── index.html
│       │   ├── app.js         Entry point
│       │   ├── modules/       Lógica modular por responsabilidad
│       │   └── styles.css
│       └── templates/         Overlays para OBS/vMix (11 templates)
├── tests/                     Tests del servidor
├── dist/client/               Build de producción (generado)
├── .env                       Variables de entorno
├── vite.config.js
└── package.json
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

| Modo         | Panel de control                     |
|--------------|--------------------------------------|
| Desarrollo   | `http://localhost:5173/dashboard/`   |
| Producción   | `http://localhost:3000`              |

Vite (puerto 5173) proxia los eventos Socket.IO al servidor Express (puerto 3000).
En producción, Express sirve los archivos build de `dist/client/`.

### En OBS / vMix

Agregar una **Browser Source** por cada template, todas desde `http://localhost:3000/templates/<nombre>/`.

| Template             | Path                          |
|----------------------|-------------------------------|
| Scoreboard           | `/templates/scoreboard/`      |
| Lower Third          | `/templates/lower-third/`     |
| Lower Dual           | `/templates/lower-third-dual/`|
| Patrocinadores       | `/templates/sponsors/`        |
| Ticker               | `/templates/ticker/`          |
| Combo                | `/templates/combo/`           |
| Live Bug             | `/templates/livebug/`         |
| Clima                | `/templates/weather/`         |
| Cuenta               | `/templates/countdown/`       |
| Música               | `/templates/nowplaying/`      |
| Resultados           | `/templates/resultados/`      |

## Overlays

- **Scoreboard**: marcador para dos equipos con persistencia en localStorage.
- **Lower Third**: nombre, apellido y cargo con animaciones GSAP y caja fantasma.
- **Lower Dual**: dos lower thirds independientes (izq./der.) con toggles individuales.
- **Patrocinadores**: rotación automática de logos con fade y posición X/Y ajustable.
- **Ticker**: barra de texto desplazante con bloque de título y logo final. Entrada/salida vertical.
- **Combo**: composición de Lower Dual + Patrocinadores + Ticker + **Live Bug**. Toggle maestro "Mostrar todo" enciende/apaga los cuatro a la vez. Estado persistente entre sesiones.
- **Live Bug**: caja azul (lugar) + caja blanca (ciudad + temperatura). Auto-actualiza la temperatura vía `wttr.in` cada 30 min (configurable), con botón de refresh manual. Animación de slide lateral idéntica al lower-third. Persistencia de datos y toggle.
- **Clima**: datos en tiempo real vía `wttr.in` (ciudad/país configurables).
- **Cuenta**: cronómetro regresivo o progresivo.
- **Música**: tarjeta "Now Playing" con canción, artista y portada opcional.
- **Resultados**: pantalla completa de resultados electorales.

Cada overlay incluye:

- Persistencia de estado por sección (scores, presets de invitados en localStorage).
- Personalización en vivo: fuente, colores, tamaños, posiciones, opacidad.
- 10 slots de presets (clic para cargar, clic derecho para guardar, shift+clic para borrar).
- URL de Browser Source con botón "copiar" en cada pestaña.

### Capas del Combo (z-index)

| Capa                | z-index | Posición            | Notas                          |
|---------------------|---------|---------------------|--------------------------------|
| Patrocinadores      | 10      | Esquina sup. izq.   | X/Y ajustables desde el panel  |
| Live Bug            | 15      | Esquina sup. izq.   | X/Y ajustables desde el panel  |
| Lower Dual          | 20      | Inferior, ambos lados| —                              |
| Ticker              | 30      | Inferior, 65px altura| —                              |

> Por defecto, Patrocinadores y Live Bug comparten la esquina superior izquierda. Como no se muestran al mismo tiempo en producción, no hay conflicto. Si necesitas ambos visibles a la vez, mueve uno desde la pestaña correspondiente.

### Persistencia entre sesiones

- **Toggles del combo** (sponsor, livebug, lower-dual, ticker) se guardan en `localStorage` con la clave `combo_toggles`.
- **Datos del Live Bug** (lugar, ciudad, intervalo, estilo) se auto-guardan en `livebug_state` cada vez que cambias un input.
- **Toggle del Live Bug** se guarda en `livebug_toggle`.
- Al recargar el dashboard, los toggles se restauran y los que estaban `ON` disparan automáticamente un `SHOW` para que OBS vuelva a renderizar el overlay con los mismos datos.

## Variables de entorno

| Variable     | Por defecto | Descripción                                       |
|--------------|-------------|---------------------------------------------------|
| `PORT`       | `3000`      | Puerto del servidor HTTP.                         |
| `NODE_ENV`   | `production`| Habilita servir build estático y CORS restringido. |
| `AUTH_TOKEN` | *(vacío)*   | Si está definido, requiere `X-Auth-Token` en HTTP y en `socket.io` para conectar. |

## Autenticación

Para activar autenticación (recomendado en producción):

```bash
AUTH_TOKEN=tu-token-secreto npm start
```

El dashboard y los templates enviarán el token automáticamente cuando se sirve la app desde el mismo origen. Para autenticar clientes externos (p. ej. OBS en otra máquina), expón el token de forma segura.

## Seguridad

- `helmet` para cabeceras HTTP seguras (CSP deshabilitado para permitir iframes de OBS).
- `compression` para gzip.
- Rate limiting en API REST (`express-rate-limit`).
- Rate limiting en Socket.IO (mínimo 150ms entre eventos).
- Validación de payloads de Socket.IO antes de reemitir.
- `fs` asíncrono para no bloquear el event loop.
- Path traversal prevention en upload/delete de logos.

## Comandos de desarrollo

```bash
npm run dev          # Servidor + Vite con HMR
npm run build        # Build de producción
npm start            # Servidor en modo producción
npm run lint         # ESLint
npm run lint:fix     # ESLint con auto-fix
npm run format       # Prettier (escribir)
npm run format:check # Prettier (verificar)
npm test             # Tests del servidor (node --test)
```

## Tecnologías

- **Backend:** Node.js, Express, Socket.IO, Pino (logs), express-rate-limit
- **Frontend:** JavaScript vanilla, GSAP, Vite
- **APIs externas:** wttr.in (clima, sin API key, sin registro)
- **Seguridad:** Helmet, validación de payload, rate limit
- **Containerización:** Docker (multi-stage Node 20 Alpine), Docker Compose
- **CI/CD:** GitHub Actions → Portainer webhook

