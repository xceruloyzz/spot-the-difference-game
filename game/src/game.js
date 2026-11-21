// The game itself: the screens, the clock, the score, the combo, the hints and
// the clicks. It knows nothing about pixels — the renderer reads this state
// and paints it — and nothing about the DOM except through the sound bank.
//
// Flow: title -> play (level 1, 2, 3) -> level-clear between rounds -> win
// when every scene is cleared, or game-over when the clock runs out. A find
// adds points and seconds; a miss costs both and breaks the combo.

import {
  FIND_BASE_POINTS,
  FIND_COMBO_POINTS,
  FIND_TIME_BONUS_SECONDS,
  MISS_TIME_PENALTY_SECONDS,
  MISS_POINTS_PENALTY,
  HINTS_PER_ROUND,
  HINT_POINTS_COST,
  HINT_COOLDOWN_SECONDS,
  HINT_REVEAL_SECONDS,
  LEVEL_CLEAR_TIME_BONUS_PER_SECOND,
  MISS_FLASH_SECONDS,
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_PAUSED,
  SCREEN_LEVEL_CLEAR,
  SCREEN_GAME_OVER,
  SCREEN_WIN,
  BEST_SCORE_KEY,
} from './config.js';
import { SCENES } from './scenes.js';

export const EVENT_NONE = 0;
export const EVENT_FOUND = 1;
export const EVENT_MISS = 2;
export const EVENT_LEVEL_CLEAR = 4;
export const EVENT_GAME_OVER = 8;
export const EVENT_WIN = 16;

export function createGame(soundBank) {
  const state = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    found: new Set(),
    score: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: SCENES[0].seconds,
    hintsLeft: HINTS_PER_ROUND,
    hintCooldown: 0,
    hintReveal: null, // { index, until }
    missFlash: null, // { x, y, until }
    message: '',
    messageUntil: 0,
    elapsed: 0,
    totalClicks: 0,
    correctClicks: 0,
    levelBonus: 0,
    best: readBest(),
    muted: false,
  };

  function readBest() {
    try {
      return Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(value));
    } catch {
      // Storage can be off: the best score then lasts this visit only.
    }
  }

  function currentScene() {
    return SCENES[state.levelIndex];
  }

  function setMessage(text, seconds) {
    state.message = text;
    state.messageUntil = state.elapsed + seconds;
  }

  function startLevel(index) {
    state.levelIndex = index;
    state.found = new Set();
    state.combo = 0;
    state.timeLeft = SCENES[index].seconds;
    state.hintsLeft = HINTS_PER_ROUND;
    state.hintCooldown = 0;
    state.hintReveal = null;
    state.missFlash = null;
    state.screen = SCREEN_PLAY;
    setMessage(`${SCENES[index].name} — temukan ${SCENES[index].differences.length} perbedaan!`, 3);
  }

  /** Start a fresh run from level 1. */
  function startGame() {
    state.score = 0;
    state.bestCombo = 0;
    state.totalClicks = 0;
    state.correctClicks = 0;
    state.levelBonus = 0;
    startLevel(0);
  }

  /** Restart the current level, keeping the score earned so far. */
  function restartLevel() {
    startLevel(state.levelIndex);
  }

  /** Jump to a level from the title screen (keys 1, 2, 3). */
  function selectLevel(index) {
    if (index < 0 || index >= SCENES.length) return;
    state.score = 0;
    state.bestCombo = 0;
    state.totalClicks = 0;
    state.correctClicks = 0;
    state.levelBonus = 0;
    startLevel(index);
  }

  function togglePause() {
    if (state.screen === SCREEN_PLAY) {
      state.screen = SCREEN_PAUSED;
    } else if (state.screen === SCREEN_PAUSED) {
      state.screen = SCREEN_PLAY;
    }
  }

  function advanceAfterLevelClear() {
    if (state.levelIndex + 1 >= SCENES.length) {
      state.screen = SCREEN_WIN;
      soundBank.playWin();
      if (state.score > state.best) {
        state.best = state.score;
        saveBest(state.score);
      }
      return EVENT_WIN;
    }
    startLevel(state.levelIndex + 1);
    return EVENT_NONE;
  }

  /**
   * A click inside a picture panel, in panel coordinates (0..560, 0..470).
   * Returns an event flag; the renderer reads the state for the marker.
   */
  function clickPanel(x, y) {
    if (state.screen !== SCREEN_PLAY) return EVENT_NONE;
    state.totalClicks += 1;
    const scene = currentScene();
    for (let index = 0; index < scene.differences.length; index += 1) {
      if (state.found.has(index)) continue;
      const diff = scene.differences[index];
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        state.found.add(index);
        state.correctClicks += 1;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        const points = FIND_BASE_POINTS + FIND_COMBO_POINTS * (state.combo - 1);
        state.score += points;
        state.timeLeft += FIND_TIME_BONUS_SECONDS;
        soundBank.playFound(state.combo);
        setMessage(`Ketemu! +${points} poin  •  +${FIND_TIME_BONUS_SECONDS} detik`, 1.6);
        if (state.found.size === scene.differences.length) {
          state.levelBonus = Math.ceil(state.timeLeft) * LEVEL_CLEAR_TIME_BONUS_PER_SECOND;
          state.score += state.levelBonus;
          state.screen = SCREEN_LEVEL_CLEAR;
          soundBank.playWin();
          return EVENT_FOUND | EVENT_LEVEL_CLEAR;
        }
        return EVENT_FOUND;
      }
    }
    // A miss: a red flash where the player clicked, time and points lost, combo gone.
    state.combo = 0;
    state.timeLeft = Math.max(0, state.timeLeft - MISS_TIME_PENALTY_SECONDS);
    state.score = Math.max(0, state.score - MISS_POINTS_PENALTY);
    state.missFlash = { x, y, until: state.elapsed + MISS_FLASH_SECONDS };
    soundBank.playMiss();
    setMessage(`Bukan itu! −${MISS_TIME_PENALTY_SECONDS} detik`, 1.4);
    return EVENT_MISS;
  }

  /** Spend a hint: reveal one unfound difference for a few seconds. */
  function useHint() {
    if (state.screen !== SCREEN_PLAY) return false;
    if (state.hintsLeft <= 0) {
      setMessage('Hint habis untuk ronde ini!', 1.6);
      return false;
    }
    if (state.hintCooldown > 0) {
      setMessage(`Hint siap dalam ${Math.ceil(state.hintCooldown)} detik…`, 1.4);
      return false;
    }
    const scene = currentScene();
    const remaining = scene.differences
      .map((diff, index) => index)
      .filter((index) => !state.found.has(index));
    if (remaining.length === 0) return false;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hintsLeft -= 1;
    state.hintCooldown = HINT_COOLDOWN_SECONDS;
    state.hintReveal = { index: pick, until: state.elapsed + HINT_REVEAL_SECONDS };
    state.score = Math.max(0, state.score - HINT_POINTS_COST);
    soundBank.playHint();
    setMessage(`Hint: ${scene.differences[pick].hint}`, 3);
    return true;
  }

  /** Advance the clock; called every frame with the seconds since the last one. */
  function tick(dt) {
    state.elapsed += dt;
    if (state.screen !== SCREEN_PLAY) return EVENT_NONE;
    if (state.hintCooldown > 0) state.hintCooldown = Math.max(0, state.hintCooldown - dt);
    if (state.hintReveal !== null && state.elapsed >= state.hintReveal.until) state.hintReveal = null;
    if (state.missFlash !== null && state.elapsed >= state.missFlash.until) state.missFlash = null;
    const before = state.timeLeft;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    if (Math.ceil(before) > 10 && Math.ceil(state.timeLeft) <= 10 && state.timeLeft > 0) {
      soundBank.playTick();
    }
    if (state.timeLeft <= 0) {
      state.screen = SCREEN_GAME_OVER;
      soundBank.playLose();
      if (state.score > state.best) {
        state.best = state.score;
        saveBest(state.score);
      }
      return EVENT_GAME_OVER;
    }
    return EVENT_NONE;
  }

  function toTitle() {
    state.screen = SCREEN_TITLE;
    state.found = new Set();
    state.hintReveal = null;
    state.missFlash = null;
  }

  function toggleMuted() {
    state.muted = soundBank.toggleMuted();
    return state.muted;
  }

  return {
    state,
    currentScene,
    startGame,
    startLevel,
    restartLevel,
    selectLevel,
    togglePause,
    advanceAfterLevelClear,
    clickPanel,
    useHint,
    tick,
    toTitle,
    toggleMuted,
  };
}
