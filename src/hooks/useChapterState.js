import { useState, useCallback } from 'react';

// 第一章专用状态：在基础 useGameState 之上扩展
// 新增数值：discovery（调查度）/ humidity（潮湿感）/ sanCap（SAN上限）/ drankLiquid
// 骰子打滑机制：humidity >= 40 时，掷骰结果随机 -1~-2
// 幻象解锁机制：humidity >= 70 时，节点展示 corruptedText
// 乱码注入机制：san < 30 时，节点展示 corruptedText 替代 sceneDescription

const CHAPTER2_INITIAL = {
  // 基础数值（镜像 useGameState）
  hp: 10,
  san: 70,
  sanCap: 100,      // SAN 上限，喝液体后永久 -10
  isAlive: true,
  isSane: true,
  clues: [],

  // 第一章专属数值
  discovery: 0,     // 调查度 0-100，>= 80 开启真相结局
  humidity: 0,      // 潮湿感 0-100，影响骰子和幻象
  drankLiquid: false, // 是否喝下祭司液体
  currentNodeId: 'node_01_arrival',
  visitedNodes: [],
  endingId: null,
};

export function useChapterState() {
  const [state, setState] = useState(CHAPTER2_INITIAL);

  /** 骰子打滑：humidity >= 40 时随机扣 1-2 点 */
  const applyHumidityPenalty = useCallback((roll) => {
    if (state.humidity >= 40) {
      const penalty = Math.floor(Math.random() * 2) + 1; // 1 or 2
      return Math.max(1, roll - penalty);
    }
    return roll;
  }, [state.humidity]);

  /** 是否显示幻象/乱码文本 */
  const showCorruptedText = state.san < 30 || state.humidity >= 70;

  /** 扣减 SAN（受 sanCap 约束） */
  const burnSanity = useCallback((amount = 5) => {
    setState((prev) => {
      const newSan = Math.max(0, prev.san - amount);
      return {
        ...prev,
        san: newSan,
        isSane: newSan > 0,
      };
    });
  }, []);

  /** 永久降低 SAN 上限（喝液体触发） */
  const reduceSanCap = useCallback((amount = 10) => {
    setState((prev) => {
      const newCap = Math.max(0, prev.sanCap - amount);
      const newSan = Math.min(prev.san, newCap);
      return {
        ...prev,
        sanCap: newCap,
        san: newSan,
        isSane: newSan > 0,
      };
    });
  }, []);

  /** 增加调查度 */
  const addDiscovery = useCallback((amount = 0) => {
    setState((prev) => ({
      ...prev,
      discovery: Math.min(100, prev.discovery + amount),
    }));
  }, []);

  /** 增加潮湿感 */
  const addHumidity = useCallback((amount = 0) => {
    setState((prev) => ({
      ...prev,
      humidity: Math.min(100, prev.humidity + amount),
    }));
  }, []);

  /** 扣减生命值 */
  const takeDamage = useCallback((amount = 1) => {
    setState((prev) => {
      const newHp = Math.max(0, prev.hp - amount);
      return { ...prev, hp: newHp, isAlive: newHp > 0 };
    });
  }, []);

  /** 获得线索 */
  const addClue = useCallback((clue) => {
    if (!clue) return;
    setState((prev) => ({
      ...prev,
      clues: prev.clues.includes(clue) ? prev.clues : [...prev.clues, clue],
    }));
  }, []);

  /** 标记已喝液体（SAN 上限 -10，解锁深潜者视域） */
  const drinkLiquid = useCallback(() => {
    setState((prev) => {
      const newCap = Math.max(0, prev.sanCap - 10);
      const newSan = Math.min(prev.san, newCap);
      return {
        ...prev,
        drankLiquid: true,
        sanCap: newCap,
        san: newSan,
        isSane: newSan > 0,
        discovery: Math.min(100, prev.discovery + 20),
        clues: prev.clues.includes('深潜者视域')
          ? prev.clues
          : [...prev.clues, '深潜者视域'],
      };
    });
  }, []);

  /** 跳转到下一节点 */
  const goToNode = useCallback((nodeId) => {
    setState((prev) => ({
      ...prev,
      currentNodeId: nodeId,
      visitedNodes: prev.visitedNodes.includes(nodeId)
        ? prev.visitedNodes
        : [...prev.visitedNodes, nodeId],
    }));
  }, []);

  /** 触发结局 */
  const triggerEnding = useCallback((endingId) => {
    setState((prev) => ({ ...prev, endingId }));
  }, []);

  /** 处理节点选项结果（成功/失败统一入口） */
  const applyChoiceResult = useCallback((choice, success, burnedSanity = false) => {
    if (!choice) return;
    setState((prev) => {
      let next = { ...prev };

      if (success) {
        const delta = burnedSanity && choice.burnDiscoveryDelta
          ? choice.burnDiscoveryDelta
          : (choice.discoveryDelta || 0);
        next.discovery = Math.min(100, next.discovery + delta);
        next.humidity = Math.min(100, next.humidity + (choice.humidityDelta || 0));

        const sanDelta = burnedSanity
          ? (choice.burnSanDelta || 0)
          : (choice.sanDelta || 0);
        if (sanDelta < 0) {
          next.san = Math.max(0, next.san + sanDelta);
          next.isSane = next.san > 0;
        }

        const clue = burnedSanity ? choice.burnSanClue : choice.clue;
        if (clue && !next.clues.includes(clue)) {
          next.clues = [...next.clues, clue];
        }

        if (choice.sanCapDelta) {
          next.sanCap = Math.max(0, next.sanCap + choice.sanCapDelta);
          next.san = Math.min(next.san, next.sanCap);
        }
      } else {
        // 失败分支
        next.discovery = Math.min(100, next.discovery + (choice.failDiscoveryDelta || 0));
        next.humidity = Math.min(100, next.humidity + (choice.failHumidityDelta || 0));

        if (choice.failSanDelta) {
          next.san = Math.max(0, next.san + choice.failSanDelta);
          next.isSane = next.san > 0;
        }
        if (choice.failHpDelta) {
          next.hp = Math.max(0, next.hp + choice.failHpDelta);
          next.isAlive = next.hp > 0;
        }
        if (choice.failSanCapDelta) {
          next.sanCap = Math.max(0, next.sanCap + choice.failSanCapDelta);
          next.san = Math.min(next.san, next.sanCap);
        }
      }

      // 结局检测
      if (next.san === 0) next.endingId = 'ending_madman';

      return next;
    });
  }, []);

  /** 重置章节 */
  const resetChapter = useCallback(() => {
    setState(CHAPTER2_INITIAL);
  }, []);

  return {
    state,
    showCorruptedText,
    applyHumidityPenalty,
    burnSanity,
    reduceSanCap,
    addDiscovery,
    addHumidity,
    takeDamage,
    addClue,
    drinkLiquid,
    goToNode,
    triggerEnding,
    applyChoiceResult,
    resetChapter,
  };
}
