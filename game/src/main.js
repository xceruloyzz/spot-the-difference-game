// Boot and the one loop: the clock advances in small steps, the game ticks,
// and the renderer paints what is there. The game moves between title, play,
// paused, level-clear, game-over and win.
//
// ?shot=cover|level2|title|win|hint stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.
// window.__game exposes the live game for play-testing from the console.

import { createSoundBank } from './audio.js';
import { createGame } from './game.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const soundBank = createSoundBank();
const game = createGame(soundBank);
const renderer = createRenderer(canvas);
createInput(canvas, game);

// The first click or key press unlocks the synthesised sounds.
window.addEventListener('pointerdown', () => soundBank.unlock(), { once: true });
window.addEventListener('keydown', () => soundBank.unlock(), { once: true });

// Announce the state for screen readers whenever the screen changes.
let announcedScreen = '';
function announce() {
  if (game.state.screen === announcedScreen) return;
  announcedScreen = game.state.screen;
  const scene = game.currentScene();
  if (game.state.screen === 'play') {
    status.textContent = `${scene.name}: ditemukan ${game.state.found.size} dari ${scene.differences.length}, sisa waktu ${Math.ceil(game.state.timeLeft)} detik.`;
  } else {
    status.textContent = `Cari Bedanya! Layar ${game.state.screen}. Skor ${game.state.score}.`;
  }
}

window.__game = game;

function runShot(name) {
  stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game.state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot !== null) {
  runShot(shot);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    game.tick(dt);
    renderer.draw(game.state);
    announce();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
