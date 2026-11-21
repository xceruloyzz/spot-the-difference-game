// Everything the player sees, painted on one canvas: the top bar (title, the
// found counter, the clock, the score and the combo), the two picture panels
// with their found markers, hint rings and miss flashes, the bottom bar with
// its buttons and message, and the title / pause / level-clear / game-over /
// win overlays. The scenes themselves are drawn once per level into offscreen
// canvases and blitted every frame, so the picture never flickers.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LEFT_PANEL,
  RIGHT_PANEL,
  PANEL_WIDTH,
  PANEL_HEIGHT,
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
import { SCENES, drawScenePanel } from './scenes.js';

const FONT = 'Trebuchet MS, Verdana, sans-serif';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawText(ctx, text, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  const sceneCache = { levelIndex: -1, left: null, right: null };

  function sceneCanvases(levelIndex) {
    if (sceneCache.levelIndex === levelIndex && sceneCache.left !== null) return sceneCache;
    const scene = SCENES[levelIndex];
    const left = document.createElement('canvas');
    left.width = PANEL_WIDTH;
    left.height = PANEL_HEIGHT;
    drawScenePanel(left.getContext('2d'), scene, 0);
    const right = document.createElement('canvas');
    right.width = PANEL_WIDTH;
    right.height = PANEL_HEIGHT;
    drawScenePanel(right.getContext('2d'), scene, 1);
    sceneCache.levelIndex = levelIndex;
    sceneCache.left = left;
    sceneCache.right = right;
    return sceneCache;
  }

  function drawTopBar(state) {
    ctx.fillStyle = '#14102a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 96);
    ctx.fillStyle = '#ffd32a';
    ctx.fillRect(0, 96, CANVAS_WIDTH, 4);

    drawText(ctx, 'CARI BEDANYA!', 30, 34, 30, '#ffd32a', 'left');
    const scene = SCENES[state.levelIndex];
    drawText(ctx, `Ronde ${state.levelIndex + 1} · ${scene.name}`, 30, 70, 17, '#dfe4ea', 'left', 'normal');

    // The found counter: big, centred, always in view.
    const total = scene.differences.length;
    const found = state.found.size;
    drawText(ctx, `DITEMUKAN ${found} dari ${total}`, CANVAS_WIDTH / 2, 32, 34, '#ffffff');
    const dotWidth = 18;
    const dotsWidth = total * dotWidth;
    for (let index = 0; index < total; index += 1) {
      const x = CANVAS_WIDTH / 2 - dotsWidth / 2 + index * dotWidth + dotWidth / 2;
      ctx.fillStyle = index < found ? '#2ed573' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(x, 66, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // The clock: red and pulsing under ten seconds.
    const lowTime = state.timeLeft <= 10 && state.screen === SCREEN_PLAY;
    const timeColor = lowTime ? (Math.floor(state.elapsed * 4) % 2 === 0 ? '#ff4757' : '#ffffff') : '#ffffff';
    drawText(ctx, formatTime(state.timeLeft), CANVAS_WIDTH - 30, 34, 42, timeColor, 'right');
    drawText(ctx, `SKOR ${state.score}`, CANVAS_WIDTH - 30, 70, 18, '#ffe066', 'right');
    if (state.combo >= 2) {
      drawText(ctx, `COMBO x${state.combo}`, CANVAS_WIDTH - 170, 34, 20, '#ff7f50', 'right');
    }
  }

  function drawFoundMarker(panel, diff, elapsed) {
    const pulse = 1 + 0.12 * Math.sin(elapsed * 5);
    const radius = diff.r * pulse;
    ctx.strokeStyle = '#ffd32a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(panel.x + diff.x, panel.y + diff.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 211, 42, 0.35)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(panel.x + diff.x, panel.y + diff.y, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    // A check mark inside the ring.
    ctx.strokeStyle = '#2ed573';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(panel.x + diff.x - 10, panel.y + diff.y);
    ctx.lineTo(panel.x + diff.x - 3, panel.y + diff.y + 8);
    ctx.lineTo(panel.x + diff.x + 12, panel.y + diff.y - 9);
    ctx.stroke();
  }

  function drawHintRing(panel, diff, elapsed) {
    const radius = diff.r + 6 + 4 * Math.sin(elapsed * 6);
    ctx.strokeStyle = '#1e90ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(panel.x + diff.x, panel.y + diff.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawText(ctx, '?', panel.x + diff.x, panel.y + diff.y - diff.r - 16, 22, '#1e90ff');
  }

  function drawMissFlash(panel, flash) {
    const size = 16;
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(panel.x + flash.x - size, panel.y + flash.y - size);
    ctx.lineTo(panel.x + flash.x + size, panel.y + flash.y + size);
    ctx.moveTo(panel.x + flash.x + size, panel.y + flash.y - size);
    ctx.lineTo(panel.x + flash.x - size, panel.y + flash.y + size);
    ctx.stroke();
  }

  function drawPanels(state) {
    const scene = SCENES[state.levelIndex];
    const cached = sceneCanvases(state.levelIndex);
    for (const [panel, image] of [[LEFT_PANEL, cached.left], [RIGHT_PANEL, cached.right]]) {
      ctx.drawImage(image, panel.x, panel.y);
      ctx.strokeStyle = '#ffd32a';
      ctx.lineWidth = 4;
      ctx.strokeRect(panel.x - 2, panel.y - 2, PANEL_WIDTH + 4, PANEL_HEIGHT + 4);
    }
    // Panel labels as small chips inside the top edge, clear of the top bar.
    for (const [panel, label] of [[LEFT_PANEL, 'GAMBAR 1'], [RIGHT_PANEL, 'GAMBAR 2']]) {
      ctx.fillStyle = 'rgba(20, 16, 42, 0.85)';
      roundRect(ctx, panel.x + PANEL_WIDTH / 2 - 58, panel.y + 8, 116, 26, 13);
      ctx.fill();
      drawText(ctx, label, panel.x + PANEL_WIDTH / 2, panel.y + 22, 15, '#ffffff', 'center', 'normal');
    }
    for (const index of state.found) {
      const diff = scene.differences[index];
      drawFoundMarker(LEFT_PANEL, diff, state.elapsed);
      drawFoundMarker(RIGHT_PANEL, diff, state.elapsed);
    }
    if (state.hintReveal !== null) {
      const diff = scene.differences[state.hintReveal.index];
      drawHintRing(LEFT_PANEL, diff, state.elapsed);
      drawHintRing(RIGHT_PANEL, diff, state.elapsed);
    }
    if (state.missFlash !== null) {
      drawMissFlash(LEFT_PANEL, state.missFlash);
      drawMissFlash(RIGHT_PANEL, state.missFlash);
    }
  }

  function drawBottomBar(state) {
    ctx.fillStyle = '#14102a';
    ctx.fillRect(0, 596, CANVAS_WIDTH, 124);
    ctx.fillStyle = '#ffd32a';
    ctx.fillRect(0, 596, CANVAS_WIDTH, 4);

    const buttons = BOTTOM_BUTTONS.map((button) => ({
      ...button,
      label: button.id === 'hint'
        ? `HINT (H) · ${state.hintsLeft} lagi`
        : button.id === 'pause'
          ? (state.screen === SCREEN_PAUSED ? 'LANJUT (P)' : 'JEDA (P)')
          : button.id === 'restart'
            ? 'ULANG (R)'
            : (state.muted ? 'SUARA: MATI (M)' : 'SUARA: HIDUP (M)'),
      enabled: button.id === 'hint'
        ? (state.hintsLeft > 0 && state.hintCooldown <= 0)
        : true,
    }));
    for (const button of buttons) {
      ctx.fillStyle = button.enabled ? '#2f3542' : '#1e2230';
      roundRect(ctx, button.x, BOTTOM_BUTTONS_Y, button.width, BOTTOM_BUTTONS_HEIGHT, 10);
      ctx.fill();
      ctx.strokeStyle = '#ffd32a';
      ctx.lineWidth = 2;
      roundRect(ctx, button.x, BOTTOM_BUTTONS_Y, button.width, BOTTOM_BUTTONS_HEIGHT, 10);
      ctx.stroke();
      drawText(ctx, button.label, button.x + button.width / 2, BOTTOM_BUTTONS_Y + 23, 17, button.enabled ? '#ffffff' : '#7a8296');
    }

    // Level dots on the right of the bottom bar.
    for (let index = 0; index < SCENES.length; index += 1) {
      const x = 1080 + index * 42;
      ctx.fillStyle = index < state.levelIndex ? '#2ed573' : index === state.levelIndex ? '#ffd32a' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(x, 644, 12, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, String(index + 1), x, 645, 14, '#14102a');
    }

    const message = state.message !== '' && state.elapsed < state.messageUntil
      ? state.message
      : 'Klik perbedaan di salah satu gambar · H = hint · P = jeda · R = ulang';
    drawText(ctx, message, CANVAS_WIDTH / 2, 692, 17, '#dfe4ea', 'center', 'normal');
  }

  function drawOverlayPanel(title, lines, accent) {
    ctx.fillStyle = 'rgba(10, 6, 24, 0.82)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const width = 760;
    const height = 150 + lines.length * 44;
    const x = (CANVAS_WIDTH - width) / 2;
    const y = (CANVAS_HEIGHT - height) / 2;
    ctx.fillStyle = '#1b1436';
    roundRect(ctx, x, y, width, height, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, width, height, 18);
    ctx.stroke();
    drawText(ctx, title, CANVAS_WIDTH / 2, y + 52, 46, accent);
    lines.forEach((line, index) => {
      drawText(ctx, line.text, CANVAS_WIDTH / 2, y + 116 + index * 44, line.size ?? 21, line.color ?? '#ffffff', 'center', line.weight ?? 'normal');
    });
  }

  function drawTitle(state) {
    drawPanels(state);
    ctx.fillStyle = 'rgba(10, 6, 24, 0.78)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawText(ctx, 'CARI BEDANYA!', CANVAS_WIDTH / 2, 150, 64, '#ffd32a');
    drawText(ctx, 'Tiga gambar, dua sisi, satu mata elang. Temukan semua perbedaannya sebelum waktu habis!', CANVAS_WIDTH / 2, 208, 21, '#ffffff', 'center', 'normal');
    const cards = SCENES.map((scene, index) => ({
      x: TITLE_CARD_FIRST_X + index * TITLE_CARD_GAP,
      scene,
      index,
    }));
    for (const card of cards) {
      ctx.fillStyle = '#1b1436';
      roundRect(ctx, card.x, TITLE_CARD_Y, TITLE_CARD_WIDTH, TITLE_CARD_HEIGHT, 14);
      ctx.fill();
      ctx.strokeStyle = '#ffd32a';
      ctx.lineWidth = 2;
      roundRect(ctx, card.x, TITLE_CARD_Y, TITLE_CARD_WIDTH, TITLE_CARD_HEIGHT, 14);
      ctx.stroke();
      drawText(ctx, `${card.index + 1}. ${card.scene.name}`, card.x + 130, 288, 20, '#ffffff');
      drawText(ctx, `${card.scene.differences.length} perbedaan · ${card.scene.seconds} detik`, card.x + 130, 322, 16, '#dfe4ea', 'center', 'normal');
      drawText(ctx, card.scene.tagline, card.x + 130, 356, 14, '#b8c0d8', 'center', 'normal');
    }
    drawText(ctx, 'Klik sebuah ronde, atau tekan 1 / 2 / 3 — Enter mulai dari ronde 1', CANVAS_WIDTH / 2, 452, 20, '#ffe066', 'center', 'normal');
    drawText(ctx, 'Klik perbedaan di GAMBAR 1 atau GAMBAR 2 · H = hint · P = jeda · R = ulang · M = suara', CANVAS_WIDTH / 2, 492, 18, '#dfe4ea', 'center', 'normal');
    if (state.best > 0) drawText(ctx, `Skor terbaik: ${state.best}`, CANVAS_WIDTH / 2, 532, 18, '#2ed573');
  }

  function draw(state) {
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (state.screen === SCREEN_TITLE) {
      drawTopBar(state);
      drawTitle(state);
      return;
    }
    drawTopBar(state);
    drawPanels(state);
    drawBottomBar(state);

    if (state.screen === SCREEN_PAUSED) {
      drawOverlayPanel('JEDA', [
        { text: 'Istirahat dulu — waktunya berhenti.', size: 21 },
        { text: 'P atau klik LANJUT untuk main lagi · R mengulang ronde', size: 18, color: '#dfe4ea' },
      ], '#ffd32a');
    } else if (state.screen === SCREEN_LEVEL_CLEAR) {
      const scene = SCENES[state.levelIndex];
      drawOverlayPanel('RONDE SELESAI!', [
        { text: `${scene.name} — semua ${scene.differences.length} perbedaan ketemu!`, size: 22 },
        { text: `Bonus waktu: +${state.levelBonus} poin`, size: 21, color: '#2ed573' },
        { text: 'Tekan Enter untuk lanjut ke ronde berikutnya', size: 18, color: '#dfe4ea' },
      ], '#2ed573');
    } else if (state.screen === SCREEN_GAME_OVER) {
      const scene = SCENES[state.levelIndex];
      drawOverlayPanel('WAKTU HABIS!', [
        { text: `${scene.name} — ketemu ${state.found.size} dari ${scene.differences.length} perbedaan`, size: 22 },
        { text: `Skor: ${state.score} · Akurasi klik: ${accuracy(state)}%`, size: 21, color: '#ffe066' },
        { text: 'R = ulangi ronde ini · Enter = kembali ke menu', size: 18, color: '#dfe4ea' },
      ], '#ff4757');
    } else if (state.screen === SCREEN_WIN) {
      drawOverlayPanel('KAMU MENANG!', [
        { text: 'Semua perbedaan di tiga gambar berhasil ditemukan!', size: 22 },
        { text: `Skor akhir: ${state.score}  ·  Kombo terbaik: x${state.bestCombo}  ·  Akurasi: ${accuracy(state)}%`, size: 21, color: '#ffe066' },
        { text: state.score >= state.best ? 'Skor terbaik baru!' : `Skor terbaik: ${state.best}`, size: 21, color: '#2ed573' },
        { text: 'Enter = main lagi · R = ulangi dari ronde 1', size: 18, color: '#dfe4ea' },
      ], '#ffd32a');
    }
  }

  function accuracy(state) {
    if (state.totalClicks === 0) return 100;
    return Math.round((state.correctClicks / state.totalClicks) * 100);
  }

  return { draw };
}
