// The screenshot scenes behind ?shot=cover|level2|title|win|hint. Each one puts
// the real game into a real state — found markers on, the clock running, a
// hint ringing — so the frame is what a short game really looks like, and the
// same query always gives the same frame.

import { SCENES } from './scenes.js';
import { SCREEN_TITLE, SCREEN_WIN } from './config.js';

/**
 * Stage the named scene on `game` and return nothing; the main loop paints it.
 * Unknown names stage the title screen.
 */
export function stageShot(name, game) {
  const state = game.state;
  if (name === 'cover') {
    // Level 1 mid-hunt: 4 of 8 found, the clock at 1:04, a combo running.
    game.startGame();
    for (const index of [0, 2, 4, 6]) state.found.add(index);
    state.score = 1250;
    state.combo = 3;
    state.bestCombo = 3;
    state.timeLeft = 64;
    state.totalClicks = 5;
    state.correctClicks = 4;
    state.message = '';
    state.messageUntil = 0;
    return;
  }
  if (name === 'level2') {
    // Level 2 mid-hunt: 3 of 8 found, the clock at 1:11.
    game.startGame();
    game.startLevel(1);
    for (const index of [1, 4, 6]) state.found.add(index);
    state.score = 2100;
    state.combo = 2;
    state.bestCombo = 4;
    state.timeLeft = 71;
    state.totalClicks = 4;
    state.correctClicks = 3;
    state.message = '';
    state.messageUntil = 0;
    return;
  }
  if (name === 'win') {
    // The win screen after all three scenes, with the final tally.
    game.startGame();
    game.startLevel(2);
    state.levelIndex = 2;
    state.screen = SCREEN_WIN;
    state.score = 4860;
    state.bestCombo = 6;
    state.totalClicks = 31;
    state.correctClicks = 27;
    state.found = new Set(SCENES[2].differences.map((_, index) => index));
    return;
  }
  if (name === 'hint') {
    // Level 3 under pressure: 2 of 9 found, 23 seconds left, a hint ringing.
    game.startGame();
    game.startLevel(2);
    for (const index of [0, 3]) state.found.add(index);
    state.score = 3400;
    state.combo = 1;
    state.timeLeft = 23;
    state.totalClicks = 3;
    state.correctClicks = 2;
    state.hintsLeft = 2;
    state.hintReveal = { index: 5, until: 9999 };
    state.message = `Hint: ${SCENES[2].differences[5].hint}`;
    state.messageUntil = 9999;
    return;
  }
  // Default: the title screen over the first scene.
  game.toTitle();
  state.screen = SCREEN_TITLE;
}
