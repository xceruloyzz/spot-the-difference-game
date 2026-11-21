// Shared constants for Cari Bedanya! — the canvas size, the two picture panels,
// the clock, the scoring and the keys. Every other module reads these, so a
// balance change lives in exactly one place.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// The two near-identical pictures, drawn side by side.
export const PANEL_WIDTH = 560;
export const PANEL_HEIGHT = 470;
export const LEFT_PANEL = { x: 30, y: 110, width: PANEL_WIDTH, height: PANEL_HEIGHT };
export const RIGHT_PANEL = { x: 690, y: 110, width: PANEL_WIDTH, height: PANEL_HEIGHT };

// The clock and the score. A find adds seconds; a miss costs seconds and points.
export const ROUND_SECONDS = 90;
export const FINAL_ROUND_SECONDS = 100;
export const FIND_BASE_POINTS = 100;
export const FIND_COMBO_POINTS = 25;
export const FIND_TIME_BONUS_SECONDS = 5;
export const MISS_TIME_PENALTY_SECONDS = 3;
export const MISS_POINTS_PENALTY = 25;
export const HINTS_PER_ROUND = 3;
export const HINT_POINTS_COST = 50;
export const HINT_COOLDOWN_SECONDS = 10;
export const HINT_REVEAL_SECONDS = 3;
export const LEVEL_CLEAR_TIME_BONUS_PER_SECOND = 10;
export const MISS_FLASH_SECONDS = 0.6;
export const FOUND_RING_PULSE_SECONDS = 0.5;

// Keyboard shortcuts, shown on the title screen and the bottom bar.
export const KEY_HINT = 'h';
export const KEY_PAUSE = 'p';
export const KEY_PAUSE_ALT = 'Escape';
export const KEY_RESTART = 'r';
export const KEY_CONFIRM = 'Enter';
export const KEY_LEVEL_1 = '1';
export const KEY_LEVEL_2 = '2';
export const KEY_LEVEL_3 = '3';

// The screens the game moves between.
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_CLEAR = 'level-clear';
export const SCREEN_GAME_OVER = 'game-over';
export const SCREEN_WIN = 'win';

// The bottom bar's buttons, shared by the renderer (which paints them) and
// the input handler (which hit-tests them): same numbers, no drift.
export const BOTTOM_BUTTONS_Y = 622;
export const BOTTOM_BUTTONS_HEIGHT = 44;
export const BOTTOM_BUTTONS = [
  { id: 'hint', x: 30, width: 210 },
  { id: 'pause', x: 255, width: 170 },
  { id: 'restart', x: 440, width: 150 },
  { id: 'mute', x: 605, width: 200 },
];

// The three level cards on the title screen, same sharing as the buttons.
export const TITLE_CARD_Y = 250;
export const TITLE_CARD_HEIGHT = 150;
export const TITLE_CARD_WIDTH = 260;
export const TITLE_CARD_GAP = 290;
export const TITLE_CARD_FIRST_X = 220;

// Local storage key for the best total score.
export const BEST_SCORE_KEY = 'cari-bedanya-best-score';
