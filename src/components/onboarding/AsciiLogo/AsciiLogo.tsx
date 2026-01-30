'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './AsciiLogo.module.css';

// ASCII art for "KUSARI" in block letters
const ASCII_ART = [
  '██╗  ██╗██╗   ██╗███████╗ █████╗ ██████╗ ██╗',
  '██║ ██╔╝██║   ██║██╔════╝██╔══██╗██╔══██╗██║',
  '█████╔╝ ██║   ██║███████╗███████║██████╔╝██║',
  '██╔═██╗ ██║   ██║╚════██║██╔══██║██╔══██╗██║',
  '██║  ██╗╚██████╔╝███████║██║  ██║██║  ██║██║',
  '╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝',
];

// Characters to use for scrambling effect
const SCRAMBLE_CHARS = ['█', '▓', '▒', '░', '╔', '╗', '╚', '╝', '║', '═', '╠', '╣', '╬', '├', '┤', '┌', '┐', '└', '┘', '│', '─', '┼'] as const;

function getRandomScrambleChar(): string {
  const idx = Math.floor(Math.random() * SCRAMBLE_CHARS.length);
  return SCRAMBLE_CHARS[idx] ?? '█';
}

interface CharState {
  original: string;
  current: string;
  isScrambling: boolean;
}

// Store timeouts outside of state to avoid issues
const timeoutsMap = new Map<string, NodeJS.Timeout>();

function getTimeoutKey(lineIdx: number, charIdx: number): string {
  return `${lineIdx}-${charIdx}`;
}

export const AsciiLogo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [charStates, setCharStates] = useState<CharState[][]>(() =>
    ASCII_ART.map(line =>
      [...line].map(char => ({
        original: char,
        current: char,
        isScrambling: false,
      }))
    )
  );

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsMap.forEach((timeout) => {
        clearTimeout(timeout);
      });
      timeoutsMap.clear();
    };
  }, []);

  const scrambleChar = useCallback((lineIdx: number, charIdx: number) => {
    const line = ASCII_ART[lineIdx];
    if (!line) return;
    const original = line[charIdx];
    if (!original) return;

    // Don't scramble spaces
    if (original === ' ') return;

    const key = getTimeoutKey(lineIdx, charIdx);

    // Clear existing timeout
    const existingTimeout = timeoutsMap.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsMap.delete(key);
    }

    // Start scrambling
    setCharStates(prev =>
      prev.map((line, li) =>
        line.map((charState, ci) => {
          if (li === lineIdx && ci === charIdx) {
            return {
              ...charState,
              isScrambling: true,
              current: getRandomScrambleChar(),
            };
          }
          return charState;
        })
      )
    );

    // Settle back after a delay with decreasing scramble rate
    let iterations = 0;
    const maxIterations = 5 + Math.floor(Math.random() * 5);

    const settle = () => {
      iterations++;

      if (iterations >= maxIterations) {
        // Final settle to original
        setCharStates(prev =>
          prev.map((line, li) =>
            line.map((charState, ci) => {
              if (li === lineIdx && ci === charIdx) {
                return {
                  ...charState,
                  current: charState.original,
                  isScrambling: false,
                };
              }
              return charState;
            })
          )
        );
        timeoutsMap.delete(key);
      } else {
        // Continue scrambling with increasing delay
        setCharStates(prev =>
          prev.map((line, li) =>
            line.map((charState, ci) => {
              if (li === lineIdx && ci === charIdx) {
                return {
                  ...charState,
                  current: getRandomScrambleChar(),
                };
              }
              return charState;
            })
          )
        );
        const timeout = setTimeout(settle, 30 + iterations * 20);
        timeoutsMap.set(key, timeout);
      }
    };

    // Start the settling process
    const timeout = setTimeout(settle, 30);
    timeoutsMap.set(key, timeout);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const firstLine = ASCII_ART[0];
    if (!firstLine) return;

    // Calculate which character is being hovered
    const charWidth = rect.width / firstLine.length;
    const lineHeight = rect.height / ASCII_ART.length;

    const charIdx = Math.floor(x / charWidth);
    const lineIdx = Math.floor(y / lineHeight);

    // Scramble nearby characters (radius effect)
    const radius = 2;
    for (let li = Math.max(0, lineIdx - radius); li <= Math.min(ASCII_ART.length - 1, lineIdx + radius); li++) {
      for (let ci = Math.max(0, charIdx - radius); ci <= Math.min(firstLine.length - 1, charIdx + radius); ci++) {
        // Random chance to scramble based on distance
        const distance = Math.sqrt(Math.pow(li - lineIdx, 2) + Math.pow(ci - charIdx, 2));
        if (distance <= radius && Math.random() > distance / (radius + 1)) {
          scrambleChar(li, ci);
        }
      }
    }
  }, [scrambleChar]);

  return (
    <div className={styles.container}>
      <div
        ref={containerRef}
        className={styles.logoContainer}
        onMouseMove={handleMouseMove}
      >
        <pre className={styles.ascii}>
          {charStates.map((line, lineIdx) => (
            <div key={lineIdx} className={styles.line}>
              {line.map((charState, charIdx) => (
                <span
                  key={charIdx}
                  className={`${styles.char} ${charState.isScrambling ? styles.scrambling : ''}`}
                >
                  {charState.current}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};
