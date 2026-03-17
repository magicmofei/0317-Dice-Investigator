import { useState, useRef, useEffect } from 'react';

/**
 * DiceRoller
 * Props:
 *   dc           — Difficulty Class (目标值)
 *   onResult     — 回调 { roll, bonus, total, success, burnCount }
 *   onBurnSanity — 父组件处理理智扣减
 *   sanity       — 当前理智值（用于禁用判断）
 *   disabled     — 是否禁用整个组件
 */
export default function DiceRoller({ dc, onResult, onBurnSanity, sanity, disabled }) {
  const [roll, setRoll]           = useState(null);
  const [bonus, setBonus]         = useState(0);
  const [rolling, setRolling]     = useState(false);
  const [result, setResult]       = useState(null);
  const [burnCount, setBurnCount] = useState(0);
  const [sanFlash, setSanFlash]   = useState(false);
  const diceRef    = useRef(null);
  const intervalRef = useRef(null);

  // 当外部 disabled 变为 true 时，强制停止动画
  useEffect(() => {
    if (disabled && rolling) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRolling(false);
    }
  }, [disabled, rolling]);

  const total   = roll !== null ? roll + bonus : null;
  const success = total !== null ? total >= dc  : null;

  function handleRoll() {
    if (rolling || disabled) return;
    setRolling(true);
    setRoll(null);
    setBonus(0);
    setResult(null);
    setBurnCount(0);

    const interval = setInterval(() => {
      if (diceRef.current) {
        diceRef.current.textContent = Math.ceil(Math.random() * 20);
      }
    }, 55);
    intervalRef.current = interval;

    setTimeout(() => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      const finalRoll = Math.ceil(Math.random() * 20);
      const finalTotal = finalRoll;
      const finalSuccess = finalTotal >= dc;
      setRoll(finalRoll);
      setBonus(0);
      setBurnCount(0);
      setResult({ total: finalTotal, success: finalSuccess });
      onResult({ roll: finalRoll, bonus: 0, total: finalTotal, success: finalSuccess, burnCount: 0 });
      setRolling(false);
    }, 700);
  }

  function handleBurnSanity() {
    if (roll === null || success || rolling || sanity < 5) return;
    const newBonus   = bonus + 3;
    const newTotal   = roll + newBonus;
    const newSuccess = newTotal >= dc;
    const newCount   = burnCount + 1;
    setBonus(newBonus);
    setBurnCount(newCount);
    setResult({ total: newTotal, success: newSuccess });
    onBurnSanity(5);
    onResult({ roll, bonus: newBonus, total: newTotal, success: newSuccess, burnCount: newCount });
    // flash animation
    setSanFlash(true);
    setTimeout(() => setSanFlash(false), 400);
  }

  const canBurn = roll !== null && !success && !rolling && sanity >= 5;

  return (
    <div className="flex flex-col items-center gap-6">

      {/* DC 提示 */}
      <div className="text-center">
        <span className="text-xs tracking-widest uppercase text-ghost/60 font-mono">难度等级</span>
        <div className="text-3xl font-black text-brass/80 font-serif mt-0.5">DC {dc}</div>
      </div>

      {/* 骰子主体 */}
      <div className="relative flex flex-col items-center">
        <div
          className={[
            'w-32 h-32 flex items-center justify-center select-none cursor-pointer transition-all duration-300',
            'border-2 bg-gradient-to-br from-[#1a0f08] to-[#0a0908]',
            rolling ? 'animate-dice-roll border-brass/60' : 'hover:scale-105',
            result?.success === true  ? 'border-yellow-500/70 shadow-[0_0_40px_rgba(234,179,8,0.35)]' : '',
            result?.success === false ? 'border-red-800/70 shadow-[0_0_40px_rgba(139,26,26,0.35)]'   : '',
            !result ? 'border-brass/30 shadow-[0_0_20px_rgba(181,146,26,0.1)]' : '',
          ].join(' ')}
          style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}
          onClick={handleRoll}
        >
          <span
            ref={diceRef}
            className="font-black select-none"
            style={{
              fontSize: roll !== null ? '2.5rem' : '1.1rem',
              color: result?.success === true
                ? '#fbbf24'
                : result?.success === false
                ? '#ef4444'
                : '#c9b99a',
              textShadow: result?.success === true
                ? '0 0 20px rgba(251,191,36,0.9)'
                : result?.success === false
                ? '0 0 20px rgba(239,68,68,0.9)'
                : 'none',
              transition: 'color 0.3s, text-shadow 0.3s',
            }}
          >
            {rolling ? '?' : roll !== null ? total : 'd20'}
          </span>
        </div>

        {/* 加成标签 */}
        {bonus > 0 && (
          <div className="absolute -top-3 -right-3 bg-red-900/80 border border-red-700/60 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-red-300 animate-result-pop">
            +{bonus}
          </div>
        )}
      </div>

      {/* 投骰按钮 */}
      <button
        className="btn-roll w-48"
        onClick={handleRoll}
        disabled={rolling || disabled}
      >
        {rolling ? '投掷中…' : roll !== null ? '再次投掷' : '投掷命运之骰'}
      </button>

      {/* 判定结果标签 */}
      {result && !rolling && (
        <div
          className={[
            'px-6 py-2 text-sm font-bold tracking-widest uppercase border animate-result-pop',
            result.success
              ? 'border-yellow-600/50 text-yellow-400 bg-yellow-900/10'
              : 'border-red-800/50 text-red-400 bg-red-900/10',
          ].join(' ')}
        >
          {result.success ? `✦ 检定成功 (${result.total} ≥ ${dc})` : `✘ 检定失败 (${result.total} < ${dc})`}
        </div>
      )}

      {/* 燃烧理智按钮 */}
      <div className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${canBurn || (roll !== null && !success && sanity < 5) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          className="btn-sanity w-48"
          onClick={handleBurnSanity}
          disabled={!canBurn}
        >
          🕯 燃烧理智 (−5 SAN)
        </button>
        <p className="text-xs text-ghost/50 tracking-wide">
          消耗 5 点理智 · 骰点 +3 · 可连续使用
        </p>
        {burnCount > 0 && (
          <p className="text-xs text-red-400/70">
            已燃烧 {burnCount} 次 · 消耗 {burnCount * 5} SAN · +{burnCount * 3} 点
          </p>
        )}
        {sanity < 5 && roll !== null && !success && (
          <p className="text-xs text-red-600/80 font-bold">理智不足，无法继续燃烧</p>
        )}
      </div>

    </div>
  );
}
