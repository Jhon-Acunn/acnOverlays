// Shared socket connection options for templates. Keeps reconnection settings
// consistent across overlays without forcing each template to import
// socket.io-client through a shared module (which causes Vite to wrap the
// module body in an io() call, breaking the build).
export const SOCKET_OPTIONS = {
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
};
