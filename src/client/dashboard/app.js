import { initSocket, getSocket } from './modules/socket.js';
import {
  initURLCopy,
  preventEnterOnDatalist,
  bindFontPicker,
  initSpinButtons,
} from './modules/utils.js';
import { initLowerThird } from './modules/lower-third.js';
import { initLiveBug } from './modules/livebug.js';
import { initLowerDual } from './modules/lower-dual.js';
import { initScoreboard } from './modules/scoreboard.js';
import { initSponsors } from './modules/sponsors.js';
import { initTicker } from './modules/ticker.js';
import { initCombo } from './modules/combo.js';
import { initWeather } from './modules/weather.js';
import { initCountdown } from './modules/countdown.js';
import { initNowPlaying } from './modules/nowplaying.js';
import { initResultados } from './modules/resultados.js';
import { initMedia } from './modules/media.js';
import { initQuickPanel, qpSyncToggles } from './modules/quick-panel.js';
import { initToast, showToast } from './modules/toast.js';
import { initDialog } from './modules/dialog.js';
import { initConnectionStatus, attachSocket } from './modules/connection-status.js';
import { initKeyboardShortcuts } from './modules/keyboard-shortcuts.js';
import { initSettingsPanel } from './modules/settings-panel.js';
import { initModuleNav, onModuleVisibilityChanged } from './modules/module-nav.js';
import { initBuildInfo } from './modules/build-info.js';

async function main() {
  initToast();
  initDialog();
  initConnectionStatus();
  initKeyboardShortcuts();
  await initSocket();
  attachSocket(getSocket());
  initURLCopy();
  preventEnterOnDatalist();
  bindFontPicker('fontDropdownBtn', 'inputFont');
  initSpinButtons();

  // Per-tab modules
  initScoreboard();
  initLowerThird();
  initLiveBug();
  initLowerDual();
  initSponsors();
  initTicker();
  initCombo();
  initWeather();
  initCountdown();
  initNowPlaying();
  initResultados();
  initMedia();

  // Quick panel
  initQuickPanel();

  // Settings panel + module navigator
  initSettingsPanel({
    onModuleVisibilityChange: () => {
      onModuleVisibilityChanged();
    },
  });
  initModuleNav({
    syncToggles: qpSyncToggles,
    showModule: () => {},
  });

  // Initial sync
  setTimeout(qpSyncToggles, 300);
  initBuildInfo();
  setTimeout(() => {
    showToast('Dashboard ready. Press ? for shortcuts.', { type: 'info', duration: 4000 });
  }, 500);
}

main().catch((err) => {
  console.error('[DASHBOARD] init failed:', err);
});
