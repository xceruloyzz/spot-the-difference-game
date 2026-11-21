// The three scenes of Cari Bedanya!, each drawn from scratch with Canvas 2D —
// no image files, no outside art. Every scene is one function that draws the
// same picture twice: variant 0 is the left picture, variant 1 the right one,
// and the only changes between them are the scene's listed differences. The
// decorative scatter (stars, bubbles, pebbles) comes from a seeded generator,
// so both panels always agree on everything that is not a difference.
//
// A difference is { x, y, r, hint }: the spot in panel space (560 x 470) a
// click must land near, and the hint line the game shows when it is revealed.

import { createRandom, randomRange } from './random.js';

const PANEL_W = 560;
const PANEL_H = 470;

function fillCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function fillRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function strokeLine(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawStar(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let point = 0; point < 5; point += 1) {
    const angle = (Math.PI * 2 * point) / 5 - Math.PI / 2;
    const outerX = x + Math.cos(angle) * radius;
    const outerY = y + Math.sin(angle) * radius;
    const innerAngle = angle + Math.PI / 5;
    const innerX = x + Math.cos(innerAngle) * radius * 0.45;
    const innerY = y + Math.sin(innerAngle) * radius * 0.45;
    if (point === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
}

function drawText(ctx, text, x, y, size, color, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function verticalGradient(ctx, stops) {
  const gradient = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

function scatterStars(ctx, random, count, top, bottom) {
  for (let index = 0; index < count; index += 1) {
    const x = randomRange(random, 8, PANEL_W - 8);
    const y = randomRange(random, top, bottom);
    const radius = randomRange(random, 1, 2.6);
    fillCircle(ctx, x, y, radius, `rgba(255,255,220,${randomRange(random, 0.5, 1)})`);
  }
}

// ---------------------------------------------------------------------------
// Scene 1 — Pasar Malam Neon (a neon night market)
// ---------------------------------------------------------------------------
function drawNightMarket(ctx, variant, rng) {
  ctx.fillStyle = verticalGradient(ctx, [[0, '#1b1035'], [0.6, '#3b1d5e'], [1, '#120a24']]);
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  scatterStars(ctx, rng, 42, 8, 150);

  // Difference 1: the moon is a yellow crescent on the left, a full orange moon on the right.
  if (variant === 0) {
    fillCircle(ctx, 480, 62, 34, '#ffe066');
    fillCircle(ctx, 494, 52, 30, '#1b1035');
  } else {
    fillCircle(ctx, 480, 62, 34, '#ff9f43');
    fillCircle(ctx, 468, 52, 8, '#ffd32a');
    fillCircle(ctx, 492, 70, 6, '#ffd32a');
  }

  // Difference 8: one extra bright star, only on the right picture.
  if (variant === 1) drawStar(ctx, 200, 40, 9, '#fff3a0');

  // String lights sagging across the top of the market.
  ctx.strokeStyle = '#0c0618';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.quadraticCurveTo(PANEL_W / 2, 78, PANEL_W, 26);
  ctx.stroke();
  const bulbColors = ['#ff5d8f', '#ffd32a', '#2ed573', '#1e90ff', '#ff7f50'];
  for (let index = 0; index < 12; index += 1) {
    const t = index / 11;
    const x = 20 + t * (PANEL_W - 40);
    const y = 30 + Math.sin(t * Math.PI) * 34;
    // Difference 2: the bulb above the middle of the market is missing on the right.
    if (variant === 1 && index === 6) continue;
    fillCircle(ctx, x, y + 8, 6, bulbColors[index % bulbColors.length]);
    fillCircle(ctx, x, y + 8, 2.5, '#ffffff');
  }

  // The street the stalls stand on.
  fillRect(ctx, 0, 380, PANEL_W, 90, '#241536');
  fillRect(ctx, 0, 380, PANEL_W, 6, '#4a2d6b');
  for (let index = 0; index < 8; index += 1) {
    fillRect(ctx, 20 + index * 68, 428, 34, 5, 'rgba(255, 211, 42, 0.25)');
  }

  // Left stall: a striped awning, a counter of jars, and a cat on the roof.
  fillRect(ctx, 40, 210, 180, 10, '#5b3a1e');
  for (let index = 0; index < 6; index += 1) {
    fillRect(ctx, 40 + index * 30, 160, 30, 50, index % 2 === 0 ? '#ff5d8f' : '#fff3f3');
  }
  fillRect(ctx, 40, 210, 180, 6, '#ff5d8f');
  fillRect(ctx, 52, 220, 156, 90, '#7a4a21');
  fillRect(ctx, 52, 220, 156, 10, '#a06a35');
  for (let index = 0; index < 4; index += 1) {
    const jarX = 66 + index * 38;
    fillCircle(ctx, jarX, 258, 12, ['#2ed573', '#ffd32a', '#ff7f50', '#1e90ff'][index]);
    fillRect(ctx, jarX - 12, 270, 24, 30, 'rgba(255,255,255,0.16)');
  }
  drawText(ctx, 'JAJANAN', 130, 330, 20, '#ffe066');
  // Difference 4: the cat sleeping on the left stall's roof is gone on the right.
  if (variant === 0) {
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.ellipse(130, 152, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    fillCircle(ctx, 152, 142, 9, '#2f3542');
    ctx.beginPath();
    ctx.moveTo(146, 136); ctx.lineTo(149, 126); ctx.lineTo(153, 135);
    ctx.moveTo(156, 135); ctx.lineTo(159, 126); ctx.lineTo(161, 136);
    ctx.fill();
    strokeLine(ctx, 104, 150, 92, 140, '#2f3542', 5);
  }

  // Right stall: a striped awning, a hanging sign and a shelf of snacks.
  for (let index = 0; index < 6; index += 1) {
    fillRect(ctx, 360 + index * 30, 160, 30, 50, index % 2 === 0
      // Difference 5: the awning stripes are yellow on the left, pink on the right.
      ? (variant === 0 ? '#ffd32a' : '#ff7eb6') : '#fff3f3');
  }
  fillRect(ctx, 360, 210, 180, 10, '#5b3a1e');
  fillRect(ctx, 372, 220, 156, 90, '#7a4a21');
  fillRect(ctx, 372, 220, 156, 10, '#a06a35');
  // Difference 6: the sign reads SATE on the left, SOTO on the right.
  fillRect(ctx, 396, 232, 108, 34, '#14102a');
  ctx.strokeStyle = '#ffd32a';
  ctx.lineWidth = 3;
  ctx.strokeRect(396, 232, 108, 34);
  drawText(ctx, variant === 0 ? 'SATE' : 'SOTO', 450, 250, 22, '#ffd32a');
  for (let index = 0; index < 3; index += 1) {
    fillRect(ctx, 386 + index * 52, 282, 40, 14, ['#ff5d8f', '#2ed573', '#1e90ff'][index]);
  }
  drawText(ctx, 'ENAK!', 450, 330, 20, '#ffe066');

  // The food cart in the middle, under a striped umbrella.
  fillRect(ctx, 250, 330, 90, 70, '#8e44ad');
  fillRect(ctx, 250, 330, 90, 12, '#a55eea');
  fillCircle(ctx, 262, 360, 8, '#ffd32a');
  fillCircle(ctx, 295, 360, 8, '#2ed573');
  fillCircle(ctx, 325, 360, 8, '#ff5d8f');
  ctx.fillStyle = '#e84118';
  ctx.beginPath();
  ctx.moveTo(235, 330); ctx.lineTo(355, 330); ctx.lineTo(295, 292); ctx.closePath();
  ctx.fill();
  strokeLine(ctx, 295, 292, 295, 330, '#c0392b', 4);
  // Difference 7: the cart's wheel is missing on the right.
  if (variant === 0) {
    fillCircle(ctx, 280, 408, 13, '#2f3542');
    fillCircle(ctx, 280, 408, 5, '#dfe4ea');
  }
  fillCircle(ctx, 322, 408, 13, '#2f3542');
  fillCircle(ctx, 322, 408, 5, '#dfe4ea');

  // Difference 3: the balloon bunch is red on the left, green on the right.
  const balloonColor = variant === 0 ? '#ff4757' : '#2ed573';
  fillCircle(ctx, 84, 118, 20, balloonColor);
  fillCircle(ctx, 104, 100, 20, balloonColor);
  fillCircle(ctx, 64, 100, 20, balloonColor);
  strokeLine(ctx, 84, 138, 84, 190, '#dfe4ea', 2);
  strokeLine(ctx, 104, 120, 110, 190, '#dfe4ea', 2);
  strokeLine(ctx, 64, 120, 58, 190, '#dfe4ea', 2);
}

// ---------------------------------------------------------------------------
// Scene 2 — Taman Bawah Laut (an underwater garden)
// ---------------------------------------------------------------------------
function drawUnderwaterGarden(ctx, variant, rng) {
  ctx.fillStyle = verticalGradient(ctx, [[0, '#0a5d8a'], [0.55, '#0e7fa8'], [1, '#084a6b']]);
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  // Sunlight rays slanting down through the water.
  ctx.fillStyle = 'rgba(255, 255, 200, 0.07)';
  for (let index = 0; index < 4; index += 1) {
    ctx.beginPath();
    ctx.moveTo(60 + index * 130, 0);
    ctx.lineTo(120 + index * 130, 0);
    ctx.lineTo(40 + index * 130, PANEL_H);
    ctx.lineTo(-20 + index * 130, PANEL_H);
    ctx.closePath();
    ctx.fill();
  }

  // Sandy floor with pebbles.
  fillRect(ctx, 0, 400, PANEL_W, 70, '#e8c07a');
  fillRect(ctx, 0, 400, PANEL_W, 8, '#d4a95e');
  for (let index = 0; index < 16; index += 1) {
    fillCircle(ctx, randomRange(rng, 10, PANEL_W - 10), randomRange(rng, 412, 458),
      randomRange(rng, 3, 7), ['#c98f4e', '#b57e42', '#f0d090'][index % 3]);
  }

  // Seaweed swaying on the right side.
  const fronds = variant === 0 ? 3 : 2; // Difference 7: one frond is missing on the right.
  for (let index = 0; index < fronds; index += 1) {
    const baseX = 505 + index * 18;
    ctx.strokeStyle = '#1e9e62';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, 405);
    ctx.quadraticCurveTo(baseX - 14, 350, baseX + 6, 300 - index * 8);
    ctx.stroke();
  }
  // Coral branch on the far right.
  if (variant === 0) { // Difference 2: the coral branch is gone on the right.
    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(468, 405);
    ctx.quadraticCurveTo(452, 360, 470, 322);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(462, 360);
    ctx.quadraticCurveTo(440, 340, 432, 318);
    ctx.stroke();
  }
  // Pink coral on the left.
  ctx.strokeStyle = '#ff6b9d';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(40, 405);
  ctx.quadraticCurveTo(30, 350, 52, 310);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(44, 355);
  ctx.quadraticCurveTo(70, 330, 82, 306);
  ctx.stroke();

  // The turtle gliding across the middle right.
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.ellipse(430, 180, 42, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#69db7c';
  ctx.beginPath();
  ctx.ellipse(430, 180, 30, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  fillCircle(ctx, 478, 172, 13, '#2f9e44');
  fillCircle(ctx, 482, 168, 3, '#14102a');
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.ellipse(398, 158, 16, 7, -0.5, 0, Math.PI * 2);
  ctx.ellipse(398, 202, 16, 7, 0.5, 0, Math.PI * 2);
  ctx.ellipse(452, 158, 14, 6, 0.5, 0, Math.PI * 2);
  ctx.ellipse(452, 202, 14, 6, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Difference 5: the little yellow fish swimming beside the turtle is gone on the right.
  if (variant === 0) {
    ctx.fillStyle = '#ffd32a';
    ctx.beginPath();
    ctx.ellipse(500, 140, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(512, 140); ctx.lineTo(524, 132); ctx.lineTo(524, 148); ctx.closePath();
    ctx.fill();
    fillCircle(ctx, 492, 138, 2, '#14102a');
  }

  // Difference 1: the big fish is orange on the left, purple on the right.
  const fishColor = variant === 0 ? '#ff7f50' : '#9775fa';
  ctx.fillStyle = fishColor;
  ctx.beginPath();
  ctx.ellipse(140, 150, 34, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(172, 150); ctx.lineTo(196, 132); ctx.lineTo(196, 168); ctx.closePath();
  ctx.fill();
  fillCircle(ctx, 118, 146, 4, '#ffffff');
  fillCircle(ctx, 118, 146, 2, '#14102a');
  strokeLine(ctx, 150, 134, 150, 166, 'rgba(255,255,255,0.5)', 3);

  // Difference 8: the jellyfish drifting in the middle is gone on the right.
  if (variant === 0) {
    ctx.fillStyle = 'rgba(255, 150, 200, 0.85)';
    ctx.beginPath();
    ctx.arc(350, 200, 22, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 150, 200, 0.7)';
    ctx.lineWidth = 3;
    for (let index = 0; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(336 + index * 9, 200);
      ctx.quadraticCurveTo(332 + index * 9, 222, 338 + index * 9, 236);
      ctx.stroke();
    }
  }

  // Difference 3: three bubbles rise on the left, only one on the right.
  const bubbleCount = variant === 0 ? 3 : 1;
  for (let index = 0; index < bubbleCount; index += 1) {
    const bubbleX = 292 + index * 16;
    const bubbleY = 92 - index * 14;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 9 - index * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Difference 6: the treasure chest is shut on the left, open and spilling gold on the right.
  fillRect(ctx, 66, 372, 62, 34, '#8b5a2b');
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 3;
  ctx.strokeRect(66, 372, 62, 34);
  if (variant === 0) {
    fillRect(ctx, 66, 362, 62, 14, '#a06a35');
    ctx.strokeRect(66, 362, 62, 14);
    fillRect(ctx, 92, 372, 10, 16, '#ffd32a');
  } else {
    ctx.fillStyle = '#a06a35';
    ctx.beginPath();
    ctx.moveTo(66, 372); ctx.lineTo(66, 346); ctx.lineTo(128, 346); ctx.lineTo(128, 372);
    ctx.closePath();
    ctx.fill();
    fillCircle(ctx, 84, 366, 6, '#ffd32a');
    fillCircle(ctx, 100, 360, 7, '#ffd32a');
    fillCircle(ctx, 114, 366, 6, '#ffd32a');
    fillCircle(ctx, 78, 356, 5, '#ff9f43');
  }

  // Difference 4: the starfish resting on the sand is gone on the right.
  if (variant === 0) drawStar(ctx, 200, 424, 18, '#ff9f43');
}

// ---------------------------------------------------------------------------
// Scene 3 — Stasiun Luar Angkasa (a space station)
// ---------------------------------------------------------------------------
function drawSpaceStation(ctx, variant, rng) {
  ctx.fillStyle = verticalGradient(ctx, [[0, '#050514'], [0.6, '#0d0d2b'], [1, '#000008']]);
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  scatterStars(ctx, rng, 60, 8, 420);

  // Difference 8: a cluster of three bright stars is missing on the right.
  if (variant === 0) {
    drawStar(ctx, 250, 52, 7, '#fff3a0');
    drawStar(ctx, 266, 66, 5, '#fff3a0');
    drawStar(ctx, 238, 68, 5, '#fff3a0');
  }

  // The ringed planet in the upper left.
  fillCircle(ctx, 110, 110, 52, '#ff7f50');
  fillCircle(ctx, 96, 98, 14, '#ff9f43');
  fillCircle(ctx, 128, 124, 9, '#e84118');
  // Difference 1: the planet wears a ring on the left, none on the right.
  if (variant === 0) {
    ctx.strokeStyle = '#ffd32a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(110, 110, 78, 20, -0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The station's spine: three linked modules across the middle.
  fillRect(ctx, 150, 222, 300, 52, '#c8d0dc');
  fillRect(ctx, 150, 222, 300, 10, '#eef2f7');
  fillRect(ctx, 150, 264, 300, 10, '#8a94a6');
  ctx.strokeStyle = '#5a6472';
  ctx.lineWidth = 3;
  ctx.strokeRect(150, 222, 300, 52);
  fillRect(ctx, 240, 222, 6, 52, '#5a6472');
  fillRect(ctx, 360, 222, 6, 52, '#5a6472');
  // Round portholes along the modules.
  for (let index = 0; index < 5; index += 1) {
    fillCircle(ctx, 180 + index * 60, 248, 10, '#1e90ff');
    ctx.strokeStyle = '#5a6472';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(180 + index * 60, 248, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Difference 3: the middle window glows yellow on the left, dark on the right.
  fillCircle(ctx, 300, 248, 10, variant === 0 ? '#ffd32a' : '#2f3542');

  // Difference 2: the right solar panel is missing on the right picture.
  const panels = variant === 0 ? [0, 1] : [0];
  for (const side of panels) {
    const panelX = side === 0 ? 40 : 470;
    const panelY = side === 0 ? 168 : 108;
    fillRect(ctx, panelX, panelY, 70, 44, '#1e3799');
    ctx.strokeStyle = '#7ed6df';
    ctx.lineWidth = 2;
    for (let index = 1; index < 4; index += 1) {
      strokeLine(ctx, panelX + index * 17, panelY, panelX + index * 17, panelY + 44, '#7ed6df', 2);
    }
    strokeLine(ctx, panelX + 35, panelY, panelX + 35, panelY + 44, '#7ed6df', 2);
    ctx.strokeStyle = '#c8d0dc';
    ctx.lineWidth = 4;
    ctx.strokeRect(panelX, panelY, 70, 44);
    // A strut joins the left panel down to the station's spine.
    if (side === 0) strokeLine(ctx, panelX + 35, panelY + 44, panelX + 35, 222, '#c8d0dc', 6);
  }

  // Difference 4: the antenna dish on the left module points up on the left, sideways on the right.
  ctx.strokeStyle = '#c8d0dc';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(185, 222);
  ctx.lineTo(185, 196);
  ctx.stroke();
  ctx.fillStyle = '#eef2f7';
  ctx.beginPath();
  if (variant === 0) {
    ctx.arc(185, 182, 16, Math.PI, 0);
  } else {
    ctx.arc(199, 196, 16, -Math.PI / 2, Math.PI / 2);
  }
  ctx.closePath();
  ctx.fill();

  // Difference 7: the flag on the middle module is red on the left, blue on the right.
  strokeLine(ctx, 350, 222, 350, 190, '#c8d0dc', 4);
  ctx.fillStyle = variant === 0 ? '#ff4757' : '#1e90ff';
  ctx.beginPath();
  ctx.moveTo(350, 190); ctx.lineTo(378, 198); ctx.lineTo(350, 206); ctx.closePath();
  ctx.fill();

  // The astronaut floating on the right, tethered to the station.
  // Difference 5: the tether line is there on the left, gone on the right.
  if (variant === 0) {
    ctx.strokeStyle = '#dfe4ea';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(450, 268);
    ctx.quadraticCurveTo(480, 300, 486, 326);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  fillCircle(ctx, 492, 332, 16, '#f1f2f6');
  fillCircle(ctx, 492, 326, 8, '#1e90ff');
  ctx.fillStyle = '#f1f2f6';
  ctx.beginPath();
  ctx.ellipse(492, 356, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7f50';
  fillRect(ctx, 480, 350, 24, 6, '#ff7f50');
  strokeLine(ctx, 484, 374, 478, 388, '#f1f2f6', 7);
  strokeLine(ctx, 500, 374, 506, 388, '#f1f2f6', 7);

  // Difference 6: the little satellite below the planet is gone on the right.
  if (variant === 0) {
    fillRect(ctx, 66, 372, 44, 22, '#a4b0be');
    fillRect(ctx, 52, 378, 14, 10, '#1e3799');
    fillRect(ctx, 110, 378, 14, 10, '#1e3799');
    strokeLine(ctx, 88, 372, 88, 360, '#a4b0be', 4);
    fillCircle(ctx, 88, 356, 6, '#ffd32a');
  }

  // Difference 9: the docked capsule at the bottom right is gone on the right.
  if (variant === 0) {
    ctx.fillStyle = '#e84118';
    ctx.beginPath();
    ctx.moveTo(505, 400); ctx.lineTo(545, 400); ctx.lineTo(545, 440); ctx.lineTo(505, 440);
    ctx.closePath();
    ctx.fill();
    fillCircle(ctx, 525, 392, 10, '#e84118');
    fillCircle(ctx, 525, 420, 7, '#1e90ff');
    ctx.strokeStyle = '#c8d0dc';
    ctx.lineWidth = 3;
    ctx.strokeRect(505, 400, 40, 40);
  }

  // A small blue Earth far away, bottom left.
  fillCircle(ctx, 60, 60, 16, '#1e90ff');
  fillCircle(ctx, 54, 56, 6, '#2ed573');
  fillCircle(ctx, 66, 66, 4, '#2ed573');
}

// ---------------------------------------------------------------------------
// The scene list, in play order: the market first, then the reef, then space.
// ---------------------------------------------------------------------------
export const SCENES = [
  {
    id: 'pasar-malam',
    name: 'Pasar Malam Neon',
    tagline: 'Lampu, jajanan, kucing.',
    seed: 20261121,
    seconds: 90,
    draw: drawNightMarket,
    differences: [
      { x: 480, y: 62, r: 36, hint: 'Lihat bulannya di kanan atas.' },
      { x: 300, y: 62, r: 16, hint: 'Hitung lampu gantungnya.' },
      { x: 84, y: 112, r: 30, hint: 'Balonnya berubah warna.' },
      { x: 130, y: 148, r: 28, hint: 'Ada yang tidur di atap kios kiri.' },
      { x: 420, y: 186, r: 26, hint: 'Periksa garis-garis tenda kios kanan.' },
      { x: 450, y: 250, r: 24, hint: 'Baca papan nama kios kanan.' },
      { x: 280, y: 408, r: 20, hint: 'Roda gerobak di tengah.' },
      { x: 200, y: 40, r: 14, hint: 'Langit di atas tenda.' },
    ],
  },
  {
    id: 'taman-bawah-laut',
    name: 'Taman Bawah Laut',
    tagline: 'Karang, kura-kura, harta.',
    seed: 77031,
    seconds: 90,
    draw: drawUnderwaterGarden,
    differences: [
      { x: 140, y: 150, r: 30, hint: 'Ikan besar itu warnanya beda.' },
      { x: 462, y: 340, r: 26, hint: 'Karang merah muda di kanan.' },
      { x: 300, y: 82, r: 24, hint: 'Hitung gelembung di atas.' },
      { x: 200, y: 424, r: 22, hint: 'Ada yang tergeletak di pasir.' },
      { x: 500, y: 140, r: 22, hint: 'Kura-kura itu tidak sendirian.' },
      { x: 97, y: 380, r: 30, hint: 'Peti harta di kiri bawah.' },
      { x: 523, y: 320, r: 24, hint: 'Rumput laut di kanan.' },
      { x: 350, y: 210, r: 26, hint: 'Ada yang melayang di tengah.' },
    ],
  },
  {
    id: 'stasiun-luar-angkasa',
    name: 'Stasiun Luar Angkasa',
    tagline: 'Planet, panel, astronot.',
    seed: 45119,
    seconds: 100,
    draw: drawSpaceStation,
    differences: [
      { x: 110, y: 110, r: 58, hint: 'Planet di kiri atas memakai apa?' },
      { x: 505, y: 130, r: 28, hint: 'Panel surya di kanan.' },
      { x: 300, y: 248, r: 18, hint: 'Jendela tengah stasiun.' },
      { x: 185, y: 190, r: 22, hint: 'Antena di modul kiri.' },
      { x: 488, y: 330, r: 26, hint: 'Tali astronotnya.' },
      { x: 88, y: 380, r: 24, hint: 'Benda kecil di kiri bawah.' },
      { x: 364, y: 198, r: 18, hint: 'Bendera di modul tengah.' },
      { x: 252, y: 60, r: 16, hint: 'Bintang-bintang di atas.' },
      { x: 525, y: 416, r: 28, hint: 'Kapsul yang merapat di kanan bawah.' },
    ],
  },
];

/** Draw one scene into a panel-sized context: variant 0 is the left picture, 1 the right. */
export function drawScenePanel(ctx, scene, variant) {
  const rng = createRandom(scene.seed);
  ctx.save();
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  scene.draw(ctx, variant, rng);
  ctx.restore();
}
