// Mouse and keyboard: where a click lands, which key was pressed, and what the
// game does about it. Canvas coordinates are scaled from the page rectangle
// to the 1280 x 720 game space, so the game plays the same at any window size.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LEFT_PANEL,
  RIGHT_PANEL,
  KEY_HINT,
  KEY_PAUSE,
  KEY_PAUSE_ALT,
  KEY_RESTART,
  KEY_CONFIRM,
  KEY_LEVEL_1,
  KEY_LEVEL_2,
  KEY_LEVEL_3,
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_PAUSED,
  SCREEN_LEVEL_CLEAR,
  SCREEN_GAME_OVER,
  SCREEN_WIN,
  BOTTOM_BUTTONS,
  BOTTOM_BUTTONS_Y,
  BOTTOM_BUTTONS_HEIGHT,
  TITLE_CARD_Y,
  TITLE_CARD_HEIGHT,
  TITLE_CARD_WIDTH,
  TITLE_CARD_GAP,
  TITLE_CARD_FIRST_X,
} from './config.js';

function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
}

function panelAt(point) {
  for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
    if (point.x >= panel.x && point.x <= panel.x + panel.width
      && point.y >= panel.y && point.y <= panel.y + panel.height) {
      return { panel, x: point.x - panel.x, y: point.y - panel.y };
    }
  }
  return null;
}

function bottomButtonAt(point) {
  if (point.y < BOTTOM_BUTTONS_Y || point.y > BOTTOM_BUTTONS_Y + BOTTOM_BUTTONS_HEIGHT) return null;
  for (const button of BOTTOM_BUTTONS) {
    if (point.x >= button.x && point.x <= button.x + button.width) return button.id;
  }
  return null;
}

function titleCardAt(point) {
  if (point.y < TITLE_CARD_Y || point.y > TITLE_CARD_Y + TITLE_CARD_HEIGHT) return -1;
  for (let index = 0; index < 3; index += 1) {
    const x = TITLE_CARD_FIRST_X + index * TITLE_CARD_GAP;
    if (point.x >= x && point.x <= x + TITLE_CARD_WIDTH) return index;
  }
  return -1;
}

/** Wire the canvas and the keyboard to the game. Returns nothing to clean up. */
export function createInput(canvas, game) {
  const state = game.state;

  function handleButton(buttonId) {
    if (buttonId === 'hint') game.useHint();
    else if (buttonId === 'pause') game.togglePause();
    else if (buttonId === 'restart') game.restartLevel();
    else if (buttonId === 'mute') game.toggleMuted();
  }

  function handleClick(clientX, clientY) {
    const point = canvasPoint(canvas, clientX, clientY);
    const screen = state.screen;

    if (screen === SCREEN_TITLE) {
      const card = titleCardAt(point);
      if (card >= 0) game.selectLevel(card);
      return;
    }
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      const buttonId = bottomButtonAt(point);
      if (buttonId !== null) {
        handleButton(buttonId);
        return;
      }
    }
    if (screen !== SCREEN_PLAY) return;
    const hit = panelAt(point);
    if (hit !== null) game.clickPanel(hit.x, hit.y);
  }

  canvas.addEventListener('pointerdown', (event) => {
    handleClick(event.clientX, event.clientY);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    const lower = key.length === 1 ? key.toLowerCase() : key;
    const screen = state.screen;

    if (lower === KEY_HINT && screen === SCREEN_PLAY) {
      game.useHint();
      return;
    }
    if ((lower === KEY_PAUSE.toLowerCase() || key === KEY_PAUSE_ALT)
      && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      game.togglePause();
      return;
    }
    if (lower === KEY_RESTART) {
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_GAME_OVER) {
        game.restartLevel();
      } else if (screen === SCREEN_WIN) {
        game.startGame();
      }
      return;
    }
    if (lower === 'm') {
      game.toggleMuted();
      return;
    }
    if (key === KEY_CONFIRM) {
      if (screen === SCREEN_TITLE) game.startGame();
      else if (screen === SCREEN_LEVEL_CLEAR) game.advanceAfterLevelClear();
      else if (screen === SCREEN_GAME_OVER) game.toTitle();
      else if (screen === SCREEN_WIN) game.startGame();
      return;
    }
    if (screen === SCREEN_TITLE) {
      if (key === KEY_LEVEL_1) game.selectLevel(0);
      else if (key === KEY_LEVEL_2) game.selectLevel(1);
      else if (key === KEY_LEVEL_3) game.selectLevel(2);
    }
  });
}
