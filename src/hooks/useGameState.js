import { useState, useCallback } from 'react';

const INITIAL_STATE = {
  hp: 10,
  san: 70,
  clues: [],
  isAlive: true,
  isSane: true,
  investigationProgress: 0, // 0-100 调查度
  ending: null,             // 最终结局 id
};

export function useGameState() {
  const [gameState, setGameState] = useState(INITIAL_STATE);

  const burnSanity = useCallback((amount = 5) => {
    setGameState((prev) => {
      const newSan = Math.max(0, prev.san - amount);
      return { ...prev, san: newSan, isSane: newSan > 0 };
    });
  }, []);

  const takeDamage = useCallback((amount = 1) => {
    setGameState((prev) => {
      const newHp = Math.max(0, prev.hp - amount);
      return { ...prev, hp: newHp, isAlive: newHp > 0 };
    });
  }, []);

  const addClue = useCallback((clue) => {
    setGameState((prev) => ({
      ...prev,
      clues: prev.clues.includes(clue) ? prev.clues : [...prev.clues, clue],
    }));
  }, []);

  const addInvestigation = useCallback((amount) => {
    setGameState((prev) => ({
      ...prev,
      investigationProgress: Math.min(100, prev.investigationProgress + amount),
    }));
  }, []);

  const setEnding = useCallback((endingId) => {
    setGameState((prev) => ({ ...prev, ending: endingId }));
  }, []);

  const restore = useCallback(() => {
    setGameState(INITIAL_STATE);
  }, []);

  return {
    gameState,
    burnSanity,
    takeDamage,
    addClue,
    addInvestigation,
    setEnding,
    restore,
  };
}
