// Every sound in the game, synthesised live with the Web Audio API — no audio
// files, no network. A short oscillator envelope per effect: a bright two-note
// chime when a difference is found, a low buzz for a miss, a soft pluck for a
// hint, a rising arpeggio for a win and a tick when the clock runs low.

const NOTE_C5 = 523.25;
const NOTE_E5 = 659.25;
const NOTE_G5 = 783.99;
const NOTE_A5 = 880.0;
const NOTE_C6 = 1046.5;
const NOTE_E6 = 1318.5;

/** Build the sound bank. Call `unlock()` from the first user gesture. */
export function createSoundBank() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (context !== null) return context;
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    return context;
  }

  /** Start the audio context after a click or key press (browsers block it before). */
  function unlock() {
    const audio = ensureContext();
    if (audio !== null && audio.state === 'suspended') audio.resume().catch(() => {});
  }

  function playTone(frequency, startAt, duration, type, volume) {
    const audio = ensureContext();
    if (audio === null || muted) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime + startAt);
    gain.gain.setValueAtTime(0.0001, audio.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + startAt + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + startAt);
    oscillator.stop(audio.currentTime + startAt + duration + 0.05);
  }

  /** The satisfying mark: a bright C–E chime when a difference is found. */
  function playFound(combo) {
    const lift = Math.min(combo, 6) * 12;
    playTone(NOTE_C5 + lift, 0, 0.18, 'sine', 0.22);
    playTone(NOTE_E5 + lift, 0.07, 0.24, 'sine', 0.22);
    playTone(NOTE_G5 + lift, 0.14, 0.3, 'triangle', 0.12);
  }

  /** A low buzz for a wrong click. */
  function playMiss() {
    playTone(140, 0, 0.22, 'sawtooth', 0.12);
    playTone(105, 0.05, 0.22, 'sawtooth', 0.1);
  }

  /** A soft pluck when a hint is spent. */
  function playHint() {
    playTone(NOTE_A5, 0, 0.2, 'sine', 0.16);
    playTone(NOTE_C6, 0.09, 0.26, 'sine', 0.14);
  }

  /** A tick when the clock drops under ten seconds. */
  function playTick() {
    playTone(1200, 0, 0.05, 'square', 0.05);
  }

  /** A rising arpeggio for clearing a level or winning the game. */
  function playWin() {
    const notes = [NOTE_C5, NOTE_E5, NOTE_G5, NOTE_C6, NOTE_E6];
    notes.forEach((note, index) => playTone(note, index * 0.09, 0.32, 'triangle', 0.16));
  }

  /** A short descending phrase for running out of time. */
  function playLose() {
    playTone(NOTE_G5, 0, 0.3, 'triangle', 0.14);
    playTone(NOTE_E5, 0.18, 0.3, 'triangle', 0.14);
    playTone(NOTE_C5, 0.36, 0.5, 'triangle', 0.14);
  }

  function toggleMuted() {
    muted = !muted;
    return muted;
  }

  return { unlock, playFound, playMiss, playHint, playTick, playWin, playLose, toggleMuted };
}
