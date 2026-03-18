import { useState, useCallback } from 'react';

const DEFAULT_ATTRS = { STR: 40, DEX: 40, POW: 40, EDU: 40, CHA: 40 };

export function buildInitialState(attrs = DEFAULT_ATTRS) {
  const hp  = Math.floor((attrs.STR + attrs.DEX) / 10) + 5;
  const san = attrs.POW;
  return {
    attributes: { ...attrs },
    hp,
    maxHp: hp,
    san,
    maxSan: san,
    clues: [],
    isAlive: true,
    isSane: true,
    investigationProgress: 0,
    ending: null,
  };
}

const INITIAL_STATE = buildInitialState();

export function useGameState(initAttrs) {
  const [gameState, setGameState] = useState(
    () => initAttrs ? buildInitialState(initAttrs) : INITIAL_STATE
  );

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

  // 用新属性重置游戏状态
  const restore = useCallback((newAttrs) => {
    setGameState(newAttrs ? buildInitialState(newAttrs) : INITIAL_STATE);
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
