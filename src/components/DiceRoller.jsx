import { useState, useRef, useEffect } from 'react';

/**
 * DiceRoller
 * Props:
 *   dc           — Difficulty Class (目标值)
 *   onResult     — 回调 { roll, bonus, total, success }
 *   onBurnSanity — 父组件处理理智扣减（保留接口，不在此处使用）
 *   sanity       — 当前理智值
 *   disabled     — 是否禁用整个组件
 *
 * 注意：燃烧理智的博弈逻辑已移至 App.jsx 的 pendingResult 弹窗。
 * 此组件只负责掷骰动画与结果展示，失败后不再内置燃烧按钮。
 */
export default function DiceRoller({ dc, onResult, onBurnSanity, sanity, disabled }) {
  const [roll, setRoll]       = useState(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult]   = useState(null);
  const diceRef     = useRef(null);
  const intervalRef = useRef(null);
  const calledRef   = useRef(false); // 防止同一次投骰多次触发 onResult

  useEffect(() => {
    if (disabled && rolling) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRolling(false);
    }
  }, [disabled, rolling]);

  // 当外部 disabled 变为 true（resolved 后）重置本地状态
  useEffect(() => {
    if (disabled) {
      setRoll(null);
      setResult(null);
      calledRef.current = false;
    }
  }, [disabled]);

  function handleRoll() {
    if (rolling || disabled) return;
    setRolling(true);
    setRoll(null);
    setResult(null);
    calledRef.current = false;

    const interval = setInterval(() => {
      if (diceRef.current) {
        diceRef.current.textContent = Math.ceil(Math.random() * 20);
      }
    }, 55);
    intervalRef.current = interval;

    setTimeout(() => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      const finalRoll    = Math.ceil(Math.random() * 20);
      const finalSuccess = finalRoll >= dc;
      const isCriticalSuccess = finalRoll === 20;
      const isCriticalFail    = finalRoll === 1;
      setRoll(finalRoll);
      setResult({ total: finalRoll, success: finalSuccess, isCriticalSuccess, isCriticalFail });
      setRolling(false);
      if (!calledRef.current) {
        calledRef.current = true;
        onResult({ roll: finalRoll, bonus: 0, total: finalRoll, success: finalSuccess, isCriticalSuccess, isCriticalFail });
      }
    }, 700);
  }

  const total = roll;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <span className="text-xs tracking-widest uppercase text-ghost/60 font-mono">难度等级</span>
        <div className="text-3xl font-black text-brass/80 font-serif mt-0.5">DC {dc}</div>
      </div>

      <div className="relative flex flex-col items-center">
        <div
          className={[
            'w-32 h-32 flex items-center justify-center select-none cursor-pointer transition-all duration-300',
            'border-2 bg-gradient-to-br from-[#1a0f08] to-[#0a0908]',
            rolling ? 'animate-dice-roll border-brass/60' : 'hover:scale-105',
            result?.isCriticalSuccess ? 'border-yellow-300/90 shadow-[0_0_60px_rgba(253,224,71,0.6)]' : '',
            result?.isCriticalFail    ? 'border-red-600/90 shadow-[0_0_60px_rgba(220,38,38,0.6)]'    : '',
            result?.success === true  && !result?.isCriticalSuccess ? 'border-yellow-500/70 shadow-[0_0_40px_rgba(234,179,8,0.35)]'   : '',
            result?.success === false && !result?.isCriticalFail    ? 'border-red-800/70 shadow-[0_0_40px_rgba(139,26,26,0.35)]'     : '',
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
              color: result?.isCriticalSuccess ? '#fde047'
                   : result?.isCriticalFail    ? '#dc2626'
                   : result?.success === true  ? '#fbbf24'
                   : result?.success === false ? '#ef4444'
                   : '#c9b99a',
              textShadow: result?.isCriticalSuccess ? '0 0 30px rgba(253,224,71,1), 0 0 60px rgba(253,224,71,0.5)'
                        : result?.isCriticalFail    ? '0 0 30px rgba(220,38,38,1), 0 0 60px rgba(220,38,38,0.5)'
                        : result?.success === true  ? '0 0 20px rgba(251,191,36,0.9)'
                        : result?.success === false ? '0 0 20px rgba(239,68,68,0.9)'
                        : 'none',
              transition: 'color 0.3s, text-shadow 0.3s',
            }}
          >
            {rolling ? '?' : roll !== null ? total : 'd20'}
          </span>
        </div>
      </div>

      <button className="btn-roll w-48" onClick={handleRoll} disabled={rolling || disabled}>
        {rolling ? '投掷中…' : roll !== null ? '再次投掷' : '投掷命运之骰'}
      </button>

      {result && !rolling && (
        <div className={[
          'px-6 py-2 text-sm font-bold tracking-widest uppercase border animate-result-pop',
          result.isCriticalSuccess
            ? 'border-yellow-300/70 text-yellow-300 bg-yellow-900/20'
            : result.isCriticalFail
            ? 'border-red-600/70 text-red-400 bg-red-900/20'
            : result.success
            ? 'border-yellow-600/50 text-yellow-400 bg-yellow-900/10'
            : 'border-red-800/50 text-red-400 bg-red-900/10',
        ].join(' ')}>
          {result.isCriticalSuccess
            ? `✦✦ 大成功！(${result.total}) · 调查度 +10 ✦✦`
            : result.isCriticalFail
            ? `☠ 大失败！(${result.total}) · 逆天改命已封印`
            : result.success
            ? `✦ 检定成功 (${result.total} ≥ ${dc})`
            : `✘ 检定失败 (${result.total} < ${dc}) — 等待裁决`}
        </div>
      )}

      {result && !result.success && !rolling && (
        <p className="text-xs text-red-400/60 font-mono tracking-wide animate-pulse">
          ▸ 请在弹窗中选择：燃烧理智 或 接受命运
        </p>
      )}
    </div>
  );
}
