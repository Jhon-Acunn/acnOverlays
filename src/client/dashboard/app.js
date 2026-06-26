import { initSocket, requestState } from './modules/socket.js';
import { initTheme } from './modules/theme.js';
import { initTabs } from './modules/tabs.js';
import { initURLCopy, preventEnterOnDatalist, bindFontPicker, initSpinButtons } from './modules/utils.js';
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

async function main() {
  initTheme();
  await initSocket();
  initURLCopy();
  preventEnterOnDatalist();
  bindFontPicker('fontDropdownBtn', 'inputFont');
  initSpinButtons();

  // Tab init
  initTabs(() => {
    setTimeout(qpSyncToggles, 50);
    // Ask the server for the current state of every graphic so the newly
    // visible preview iframe is up-to-date with OBS even if we haven't
    // touched that tab in a while.
    requestState();
  });

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
  initQuickPanel();
}

main().catch((err) => {
  console.error('[DASHBOARD] init failed:', err);
});
