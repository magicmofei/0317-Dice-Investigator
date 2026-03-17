import { useState, useCallback } from 'react';

const INITIAL_STATE = {
  hp: 10,          // 生命值，满值 10
  san: 70,         // 理智值，满值 100
  sceneId: 'prologue',
  clues: [],
  isAlive: true,
  isSane: true,
};

export function useGameState() {
  const [gameState, setGameState] = useState(INITIAL_STATE);

  /** 扣减理智值（用于燃烧理智） */
  const burnSanity = useCallback((amount = 5) => {
    setGameState((prev) => {
      const newSan = Math.max(0, prev.san - amount);
      return {
        ...prev,
        san: newSan,
        isSane: newSan > 0,
      };
    });
  }, []);

  /** 扣减生命值 */
  const takeDamage = useCallback((amount = 1) => {
    setGameState((prev) => {
      const newHp = Math.max(0, prev.hp - amount);
      return {
        ...prev,
        hp: newHp,
        isAlive: newHp > 0,
      };
    });
  }, []);

  /** 恢复生命/理智（调试用） */
  const restore = useCallback(() => {
    setGameState(INITIAL_STATE);
  }, []);

  /** 获得线索 */
  const addClue = useCallback((clue) => {
    setGameState((prev) => ({
      ...prev,
      clues: prev.clues.includes(clue) ? prev.clues : [...prev.clues, clue],
    }));
  }, []);

  /** 跳转到下一场景 */
  const goToScene = useCallback((sceneId) => {
    setGameState((prev) => ({
      ...prev,
      sceneId,
    }));
  }, []);

  return {
    gameState,
    burnSanity,
    takeDamage,
    restore,
    addClue,
    goToScene,
  };
}
