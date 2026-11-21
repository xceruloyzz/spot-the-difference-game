// A tiny seeded random generator (mulberry32) so the decorative parts of every
// scene — stars, bubbles, pebbles — land in the same place on every run and on
// both panels. The differences themselves are hand-placed, never random, so a
// replay always hides the same things in the same spots.

/** Build a generator from an integer seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max) from the generator. */
export function randomRange(random, min, max) {
  return min + random() * (max - min);
}

/** An integer in [min, max] from the generator. */
export function randomInt(random, min, max) {
  return Math.floor(randomRange(random, min, max + 1));
}

/** One item of `items`, picked by the generator. */
export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}
