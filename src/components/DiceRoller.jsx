import { useState, useRef, useEffect } from 'react';

/**
 * CoC DiceRoller — 双 d10 百分骰 (1d100)
 *
 * Props:
 *   skillValue    — 技能/属性值（1-100），用于判定成功等级
 *   difficulty    — 难度等级：1=常规, 2=困难, 5=极难
 *   onResult      — 回调 { tens, units, total, successLevel }
 *                   successLevel: 'critical'|'success'|'hard'|'extreme'|'failure'|'fumble'
 *   disabled      — 是否禁用
 */
export default function DiceRoller({ skillValue = 50, difficulty = 1, onResult, disabled }) {
  const [tens, setTens]     = useState(null); // 十位骰 0-9
  const [units, setUnits]   = useState(null); // 个位骰 0-9
  const [rolling, setRolling] = useState(false);
  const [result, setResult]   = useState(null);

  const tensRef   = useRef(null);
  const unitsRef  = useRef(null);
  const intervalRef = useRef(null);
  const calledRef   = useRef(false);

  // disabled 变为 true 时重置
  useEffect(() => {
    if (disabled) {
      setTens(null); setUnits(null); setResult(null);
      calledRef.current = false;
    }
  }, [disabled]);

  // 计算成功等级
  function calcSuccessLevel(total, sv, diff) {
    const threshold  = sv;                        // 常规
    const hard       = Math.floor(sv / 2);         // 困难
    const extreme    = Math.floor(sv / 5);         // 极难
    const isFumble   = total >= 96;               // 大失败（96-100）
    const isCritical = total === 1;               // 大成功（01）

    if (isFumble)   return 'fumble';
    if (isCritical) return 'critical';

    // 按难度判断所需阈值
    const needed = diff === 5 ? extreme : diff === 2 ? hard : threshold;
    if (total > needed) return 'failure';
    // 成功，再看是否超越更高等级
    if (total <= extreme) return 'extreme';
    if (total <= hard)    return 'hard';
    return 'success';
  }

  function handleRoll() {
    if (rolling || disabled) return;
    setRolling(true);
    setTens(null); setUnits(null); setResult(null);
    calledRef.current = false;

    const interval = setInterval(() => {
      if (tensRef.current)  tensRef.current.textContent  = Math.floor(Math.random() * 10);
      if (unitsRef.current) unitsRef.current.textContent = Math.floor(Math.random() * 10);
    }, 55);
    intervalRef.current = interval;

    setTimeout(() => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;

      const finalTens  = Math.floor(Math.random() * 10); // 0-9
      const finalUnits = Math.floor(Math.random() * 10); // 0-9
      // 双0 = 100
      const finalTotal = finalTens === 0 && finalUnits === 0 ? 100 : finalTens * 10 + finalUnits;
      const successLevel = calcSuccessLevel(finalTotal, skillValue, difficulty);
      const success = successLevel !== 'failure' && successLevel !== 'fumble';

      setTens(finalTens);
      setUnits(finalUnits);
      setResult({ tens: finalTens, units: finalUnits, total: finalTotal, successLevel, success });
      setRolling(false);

      if (!calledRef.current) {
        calledRef.current = true;
        onResult?.({ tens: finalTens, units: finalUnits, total: finalTotal, successLevel, success,
          roll: finalTotal, bonus: 0, isCriticalSuccess: successLevel === 'critical',
          isCriticalFail: successLevel === 'fumble' });
      }
    }, 800);
  }

  // 成功等级配置
  const levelConfig = {
    critical: { label: '✦✦ 大成功 (01)',      color: '#fde047', border: 'rgba(253,224,71,0.7)',  bg: 'rgba(253,224,71,0.08)',  glow: '0 0 40px rgba(253,224,71,0.5)' },
    extreme:  { label: '极难成功',              color: '#c084fc', border: 'rgba(192,132,252,0.6)', bg: 'rgba(192,132,252,0.08)', glow: '0 0 30px rgba(192,132,252,0.4)' },
    hard:     { label: '困难成功',              color: '#60a5fa', border: 'rgba(96,165,250,0.6)',  bg: 'rgba(96,165,250,0.08)',  glow: '0 0 25px rgba(96,165,250,0.3)' },
    success:  { label: '常规成功',              color: '#4ade80', border: 'rgba(74,222,128,0.5)',  bg: 'rgba(74,222,128,0.06)',  glow: '0 0 20px rgba(74,222,128,0.25)' },
    failure:  { label: '失败',                  color: '#f87171', border: 'rgba(248,113,113,0.5)', bg: 'rgba(248,113,113,0.06)', glow: '0 0 20px rgba(248,113,113,0.2)' },
    fumble:   { label: '☠ 大失败 (96-100)',    color: '#dc2626', border: 'rgba(220,38,38,0.7)',   bg: 'rgba(220,38,38,0.10)',  glow: '0 0 50px rgba(220,38,38,0.5)' },
  };

  const cfg = result ? levelConfig[result.successLevel] : null;
  const diffLabel = difficulty === 5 ? '极难' : difficulty === 2 ? '困难' : '常规';
  const threshold = difficulty === 5 ? Math.floor(skillValue/5) : difficulty === 2 ? Math.floor(skillValue/2) : skillValue;

  // 骰子共用样式
  function dieClass(glow) {
    return [
      'w-24 h-24 flex items-center justify-center select-none cursor-pointer transition-all duration-300',
      'border-2 bg-gradient-to-br from-[#1a0f08] to-[#0a0908]',
      rolling ? 'animate-dice-roll' : 'hover:scale-105',
    ].join(' ');
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 难度提示 */}
      <div className="text-center">
        <span className="text-xs tracking-widest uppercase text-ghost/60 font-mono">难度 · {diffLabel}</span>
        <div className="text-2xl font-black text-brass/80 font-serif mt-0.5">
          技能值 <span className="text-pale">{skillValue}</span>
          <span className="text-base text-ghost/40 ml-2">/ 需 ≤{threshold}</span>
        </div>
        <div className="flex gap-4 mt-1 justify-center text-xs font-mono">
          <span style={{color:'rgba(74,222,128,0.6)'}}>常 ≤{skillValue}</span>
          <span style={{color:'rgba(96,165,250,0.6)'}}>困 ≤{Math.floor(skillValue/2)}</span>
          <span style={{color:'rgba(192,132,252,0.6)'}}>极 ≤{Math.floor(skillValue/5)}</span>
        </div>
      </div>

      {/* 双骰子 */}
      <div className="flex items-center gap-6">
        {/* 十位骰 */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-mono text-ghost/40 tracking-widest">十位</p>
          <div
            className={dieClass()}
            style={{
              clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
              border: `2px solid ${cfg ? cfg.border : 'rgba(181,146,26,0.3)'}`,
              boxShadow: cfg ? cfg.glow : '0 0 20px rgba(181,146,26,0.1)',
            }}
            onClick={handleRoll}
          >
            <span ref={tensRef} className="font-black select-none"
              style={{
                fontSize: tens !== null ? '2rem' : '0.9rem',
                color: cfg ? cfg.color : '#c9b99a',
                textShadow: cfg ? `0 0 16px ${cfg.color}` : 'none',
                transition: 'color 0.3s',
              }}
            >{rolling ? '?' : tens !== null ? tens : 'd10'}</span>
          </div>
        </div>

        {/* 合计 */}
        <div className="flex flex-col items-center">
          {result && !rolling ? (
            <span className="text-4xl font-black font-mono transition-all duration-300"
              style={{ color: cfg?.color ?? '#e8dcc8', textShadow: cfg ? `0 0 20px ${cfg.color}` : 'none' }}
            >{String(result.total).padStart(2,'0')}</span>
          ) : (
            <span className="text-2xl font-mono text-ghost/20">——</span>
          )}
          <p className="text-xs font-mono text-ghost/30 mt-1">1d100</p>
        </div>

        {/* 个位骰 */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-mono text-ghost/40 tracking-widest">个位</p>
          <div
            className={dieClass()}
            style={{
              clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
              border: `2px solid ${cfg ? cfg.border : 'rgba(181,146,26,0.3)'}`,
              boxShadow: cfg ? cfg.glow : '0 0 20px rgba(181,146,26,0.1)',
            }}
            onClick={handleRoll}
          >
            <span ref={unitsRef} className="font-black select-none"
              style={{
                fontSize: units !== null ? '2rem' : '0.9rem',
                color: cfg ? cfg.color : '#c9b99a',
                textShadow: cfg ? `0 0 16px ${cfg.color}` : 'none',
                transition: 'color 0.3s',
              }}
            >{rolling ? '?' : units !== null ? units : 'd10'}</span>
          </div>
        </div>
      </div>

      {/* 投掷按钮 */}
      <button className="btn-roll w-48" onClick={handleRoll} disabled={rolling || disabled}>
        {rolling ? '投掷中…' : result ? '再次投掷' : '投掷百分骰'}
      </button>

      {/* 判定结果 */}
      {result && !rolling && (
        <div className="px-6 py-2 text-sm font-bold tracking-widest uppercase border animate-result-pop"
          style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
        >
          {cfg.label}
          {result.successLevel === 'critical' && ' · 调查度 +10'}
          {(result.successLevel === 'failure' || result.successLevel === 'fumble') && !result.success && ' — 等待裁决'}
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
