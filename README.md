[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/xceruloyzz/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/xceruloyzz/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Cari Bedanya! — Spot the Difference

An original spot-the-difference game for the
[make.fun bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).
Two near-identical pictures side by side, a clock ticking down, and a hunt
that gets harder every round — all drawn procedurally in Canvas 2D, with
synthesised WebAudio sounds and zero external assets. No build step, no
network requests: open `game/index.html` from any static server and play.

## The three scenes

1. **Pasar Malam Neon** — a neon night market: stalls, a food cart, a cat on a
   roof. 8 differences, 90 seconds.
2. **Taman Bawah Laut** — an underwater garden: corals, a turtle, a treasure
   chest. 8 differences, 90 seconds.
3. **Stasiun Luar Angkasa** — a space station orbiting a ringed planet.
   9 differences, 100 seconds.

Every difference is hand-placed and fair but not obvious; the decorative
scatter (stars, bubbles, pebbles) comes from a seeded generator, so both
panels always agree on everything that is not a difference.

## How to play

- **Click** a difference in either picture to mark it with a gold ring.
  A find is worth 100 points plus a combo bonus, and adds 5 seconds.
- A wrong click costs 3 seconds and 25 points and breaks the combo.
- **H** spends a hint (3 per round, 10-second cooldown, −50 points): one
  unfound difference rings in blue for 3 seconds.
- **P** / **Esc** pauses, **R** restarts the round, **M** toggles sound,
  **1 / 2 / 3** pick a round from the title screen, **Enter** confirms.
- Clear all three rounds to win; the leftover time becomes bonus points.

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

or serve `game/` with any static server and open `index.html`.

## Layout

- `game/index.html` + `game/style.css` — the page.
- `game/src/config.js` — canvas size, panels, clock, scoring, keys.
- `game/src/random.js` — the seeded generator for the decoration.
- `game/src/scenes.js` — the three original scenes and their differences.
- `game/src/game.js` — screens, clock, score, combo, hints, clicks.
- `game/src/render.js` — the HUD, the panels, the markers, the overlays.
- `game/src/input.js` — mouse and keyboard.
- `game/src/audio.js` — synthesised WebAudio sounds.
- `game/src/shots.js` — the `?shot=` scenes used for the screenshots.
- `game/src/main.js` — boot and the one loop.
- `main.ts` — the make.fun entry program (copies `game/` + `screenshots/`,
  writes `dossier.json`).

## License

MIT — see [LICENSE](LICENSE).
