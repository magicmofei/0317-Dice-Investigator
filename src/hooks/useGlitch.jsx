import { useState, useEffect, useRef } from 'react';

const GLITCH_CHARS = '█▓▒░╬╫╪┼╋▲△▽▼◆◇●○◎⬡⬢✦✘☽Ͽ̷̧͇ͅΨΦΩ∆∇∞≈≠≡∴∵⊕⊗⊘⊙§¶†‡';

function randomGlitch(str) {
  if (!str) return str;
  return str
    .split('')
    .map((ch) => {
      // ~30% chance to replace any character
      if (Math.random() < 0.28) {
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      return ch;
    })
    .join('');
}

/**
 * useGlitchText
 * Returns a possibly-corrupted version of `text` when `active` is true.
 * Re-corrupts on a random interval to feel "alive".
 */
export function useGlitchText(text, active) {
  const [display, setDisplay] = useState(text);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    // Initial corrupt
    setDisplay(randomGlitch(text));
    // Re-corrupt every 180–600ms
    timerRef.current = setInterval(() => {
      setDisplay(randomGlitch(text));
    }, 180 + Math.random() * 420);

    return () => clearInterval(timerRef.current);
  }, [text, active]);

  return display;
}

/**
 * TypewriterText
 * Renders `text` one character at a time.
 * Props:
 *   text      — string to type out
 *   speed     — ms per character (default 28)
 *   onDone    — optional callback when typing finishes
 *   glitch    — bool, whether to corrupt text (san < 20)
 *   className — extra classes
 */
export function TypewriterText({ text, speed = 28, onDone, glitch = false, className = '' }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  // Reset whenever text changes
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    if (!text) return;

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      const slice = text.slice(0, indexRef.current);
      setDisplayed(slice);
      if (indexRef.current >= text.length) {
        clearInterval(timerRef.current);
        setDone(true);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  // After typing is done, optionally corrupt
  const glitchedDisplay = useGlitchText(displayed, glitch && done);

  return (
    <span className={className}>
      {glitch && done ? glitchedDisplay : displayed}
      {!done && (
        <span
          className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
          style={{ animation: 'blink 0.7s step-end infinite' }}
        />
      )}
    </span>
  );
}
