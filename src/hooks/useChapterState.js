import { useState, useCallback, useMemo } from 'react';

// ── 基础属性默认值 ────────────────────────────────────────────────
const DEFAULT_ATTRIBUTES = {
  STR: 10, // 力量：影响 maxHp
  DEX: 10, // 敏捷：影响 maxHp
  MND: 70, // 心智：影响 maxSan
  CHA: 10, // 魅力：影响交涉类检定
};

function deriveStats(attrs) {
  return {
    maxHp:  Math.floor((attrs.STR + attrs.DEX) / 2),
    maxSan: attrs.MND,
  };
}

function buildInitial(attrs = DEFAULT_ATTRIBUTES) {
  const { maxHp, maxSan } = deriveStats(attrs);
  return {
    // 基础属性
    attributes: { ...attrs },

    // 派生上限
    maxHp,
    maxSan,
    sanCap: maxSan, // 可被永久降低

    // 当前数值
    hp:  maxHp,
    san: maxSan,

    // 状态标志
    isAlive:   true,
    isSane:    true,
    isGameOver: false,

    // 线索与进度
    clues:     [],
    discovery: 0,
    humidity:  0,

    // 章节流程
    drankLiquid:   false,
    currentNodeId: 'node_01_arrival',
    visitedNodes:  [],
    endingId:      null,
  };
}

const INITIAL_STATE = buildInitial();

export function useChapterState(customAttributes) {
  const [state, setState] = useState(
    () => customAttributes ? buildInitial(customAttributes) : INITIAL_STATE
  );

  // ── 派生属性（实时计算）──────────────────────────────────────────
  const derivedStats = useMemo(
    () => deriveStats(state.attributes),
    [state.attributes]
  );

  // ── 工具函数 ──────────────────────────────────────────────────────

  /** 统一的 Game Over 检查，注入到任何状态变更后 */
  function checkGameOver(next) {
    const dead   = next.hp  <= 0;
    const insane = next.san <= 0;
    return {
      ...next,
      isAlive:    !dead,
      isSane:     !insane,
      isGameOver: dead || insane,
      endingId:   insane && !next.endingId ? 'ending_madman'
                : dead   && !next.endingId ? 'ending_dead'
                : next.endingId,
    };
  }

  // ── 骰子打滑 ──────────────────────────────────────────────────────
  const applyHumidityPenalty = useCallback((roll) => {
    if (state.humidity >= 40) {
      const penalty = Math.floor(Math.random() * 2) + 1;
      return Math.max(1, roll - penalty);
    }
    return roll;
  }, [state.humidity]);

  const showCorruptedText = state.san < 30 || state.humidity >= 70;

  // ── 数值操作 ──────────────────────────────────────────────────────

  const burnSanity = useCallback((amount = 5) => {
    setState((prev) => checkGameOver({
      ...prev,
      san: Math.max(0, prev.san - amount),
    }));
  }, []);

  const reduceSanCap = useCallback((amount = 10) => {
    setState((prev) => {
      const newCap = Math.max(0, prev.sanCap - amount);
      return checkGameOver({
        ...prev,
        sanCap: newCap,
        san: Math.min(prev.san, newCap),
      });
    });
  }, []);

  const takeDamage = useCallback((amount = 1) => {
    setState((prev) => checkGameOver({
      ...prev,
      hp: Math.max(0, prev.hp - amount),
    }));
  }, []);

  const addDiscovery = useCallback((amount = 0) => {
    setState((prev) => ({
      ...prev,
      discovery: Math.min(100, prev.discovery + amount),
    }));
  }, []);

  const addHumidity = useCallback((amount = 0) => {
    setState((prev) => ({
      ...prev,
      humidity: Math.min(100, prev.humidity + amount),
    }));
  }, []);

  const addClue = useCallback((clue) => {
    if (!clue) return;
    setState((prev) => ({
      ...prev,
      clues: prev.clues.includes(clue) ? prev.clues : [...prev.clues, clue],
    }));
  }, []);

  const drinkLiquid = useCallback(() => {
    setState((prev) => {
      const newCap = Math.max(0, prev.sanCap - 10);
      return checkGameOver({
        ...prev,
        drankLiquid: true,
        sanCap: newCap,
        san: Math.min(prev.san, newCap),
        discovery: Math.min(100, prev.discovery + 20),
        clues: prev.clues.includes('深潜者视域')
          ? prev.clues
          : [...prev.clues, '深潜者视域'],
      });
    });
  }, []);

  const goToNode = useCallback((nodeId) => {
    setState((prev) => ({
      ...prev,
      currentNodeId: nodeId,
      visitedNodes: prev.visitedNodes.includes(nodeId)
        ? prev.visitedNodes
        : [...prev.visitedNodes, nodeId],
    }));
  }, []);

  const triggerEnding = useCallback((endingId) => {
    setState((prev) => ({ ...prev, endingId, isGameOver: true }));
  }, []);

  // ── 核心：处理节点选项结果 ────────────────────────────────────────
  /**
   * applyChoiceResult(choice, success, burnedSanity)
   *
   * choice 数据结构（所有字段可选）：
   *   成功字段：
   *     discoveryDelta, humidityDelta, sanDelta, sanCapDelta, clue
   *     burnDiscoveryDelta, burnSanDelta, burnSanClue（逆天改命成功时使用）
   *   失败字段：
   *     failDiscoveryDelta, failHumidityDelta
   *     failSanDelta   — 失败扣 SAN（负数，如 -5）
   *     failHpDelta    — 失败扣 HP（负数，如 -1）
   *     failSanCapDelta — 失败永久降低 SAN 上限
   */
  const applyChoiceResult = useCallback((choice, success, burnedSanity = false) => {
    if (!choice) return;
    setState((prev) => {
      let next = { ...prev };

      if (success) {
        const discDelta = burnedSanity && choice.burnDiscoveryDelta != null
          ? choice.burnDiscoveryDelta
          : (choice.discoveryDelta || 0);
        next.discovery = Math.min(100, next.discovery + discDelta);
        next.humidity  = Math.min(100, next.humidity + (choice.humidityDelta || 0));

        const sanDelta = burnedSanity
          ? (choice.burnSanDelta || 0)
          : (choice.sanDelta || 0);
        if (sanDelta < 0) next.san = Math.max(0, next.san + sanDelta);
        if (sanDelta > 0) next.san = Math.min(next.sanCap, next.san + sanDelta);

        if (choice.sanCapDelta) {
          next.sanCap = Math.max(0, next.sanCap + choice.sanCapDelta);
          next.san    = Math.min(next.san, next.sanCap);
        }

        const clue = burnedSanity ? choice.burnSanClue : choice.clue;
        if (clue && !next.clues.includes(clue)) {
          next.clues = [...next.clues, clue];
        }
      } else {
        // ── 失败分支 ──
        next.discovery = Math.min(100, next.discovery + (choice.failDiscoveryDelta || 0));
        next.humidity  = Math.min(100, next.humidity  + (choice.failHumidityDelta || 0));

        if (choice.failSanDelta) {
          next.san = Math.max(0, next.san + choice.failSanDelta);
        }
        if (choice.failHpDelta) {
          next.hp = Math.max(0, next.hp + choice.failHpDelta);
        }
        if (choice.failSanCapDelta) {
          next.sanCap = Math.max(0, next.sanCap + choice.failSanCapDelta);
          next.san    = Math.min(next.san, next.sanCap);
        }
      }

      return checkGameOver(next);
    });
  }, []);

  /** 重置章节（可传入新属性） */
  const resetChapter = useCallback((newAttrs) => {
    setState(newAttrs ? buildInitial(newAttrs) : INITIAL_STATE);
  }, []);

  return {
    state,
    derivedStats,          // { maxHp, maxSan }
    showCorruptedText,
    applyHumidityPenalty,
    burnSanity,
    reduceSanCap,
    takeDamage,
    addDiscovery,
    addHumidity,
    addClue,
    drinkLiquid,
    goToNode,
    triggerEnding,
    applyChoiceResult,
    resetChapter,
  };
}
