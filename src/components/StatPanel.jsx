/**
 * StatPanel — 玩家状态面板（生命值、理智值、线索）
 */
export default function StatPanel({ gameState, sceneTitle }) {
  const { hp, maxHp = 10, san, maxSan = 100, clues = [], isAlive, isSane } = gameState;

  const hpPct  = Math.min(100, (hp  / maxHp)  * 100);
  const sanPct = Math.min(100, (san / maxSan) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-brass/40">◆</span>
        <span className="text-xs tracking-widest uppercase text-ghost/50 font-mono">调查员档案</span>
        <span className="text-brass/40">◆</span>
      </div>

      {/* 当前场景 */}
      <div className="panel p-3">
        <p className="text-xs tracking-widest uppercase text-ghost/40 font-mono mb-1">当前调查</p>
        <p className="text-sm text-pale/80 leading-snug">{sceneTitle}</p>
      </div>

      {/* 生命值 */}
      <div className="panel p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-xs tracking-widest uppercase text-ghost/60 font-mono">生命值 HP</span>
          <span className={`text-lg font-black font-mono ${
            hp <= Math.floor(maxHp * 0.3) ? 'text-red-500' : hp <= Math.floor(maxHp * 0.6) ? 'text-yellow-500' : 'text-pale'
          }`}>
            {hp} <span className="text-xs text-ghost/40">/ {maxHp}</span>
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${hpPct}%`,
              background: hpPct <= 30
                ? 'linear-gradient(90deg, #7f1d1d, #ef4444)'
                : hpPct <= 60
                ? 'linear-gradient(90deg, #78350f, #f59e0b)'
                : 'linear-gradient(90deg, #1c4a2a, #4ade80)',
              boxShadow: hpPct <= 30 ? '0 0 8px rgba(239,68,68,0.6)' : 'none',
            }}
          />
        </div>
        {!isAlive && (
          <p className="text-xs text-red-500 mt-2 font-bold tracking-widest uppercase animate-flicker">— 调查员已死亡 —</p>
        )}
      </div>

      {/* 理智值 */}
      <div className={`panel p-4 transition-all duration-500 ${
        san <= 20 ? 'shadow-[0_0_20px_rgba(139,26,26,0.35)]' : ''
      }`}>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-xs tracking-widest uppercase text-ghost/60 font-mono">理智值 SAN</span>
          <span className={`text-lg font-black font-mono ${
            san <= 20 ? 'text-red-500' : san <= 40 ? 'text-orange-400' : 'text-pale'
          }`}>
            {san} <span className="text-xs text-ghost/40">/ {maxSan}</span>
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${sanPct}%`,
              background: sanPct <= 20
                ? 'linear-gradient(90deg, #7f1d1d, #dc2626)'
                : sanPct <= 40
                ? 'linear-gradient(90deg, #7c2d12, #f97316)'
                : 'linear-gradient(90deg, #312e81, #818cf8)',
              boxShadow: sanPct <= 20 ? '0 0 10px rgba(220,38,38,0.7)' : 'none',
            }}
          />
        </div>
        {!isSane && (
          <p className="text-xs text-red-500 mt-2 font-bold tracking-widest uppercase animate-flicker">— 理智崩溃 —</p>
        )}
        {isSane && san <= 20 && (
          <p className="text-xs text-red-400/70 mt-2 italic">理智边缘…现实开始扭曲</p>
        )}
      </div>

      {/* 线索列表 */}
      <div className="panel p-4">
        <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono mb-3">已获线索</p>
        {clues.length === 0 ? (
          <p className="text-xs text-ghost/30 italic">尚未发现任何线索</p>
        ) : (
          <div className="flex flex-col gap-2">
            {clues.map((clue, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-brass/60 text-xs">◈</span>
                <span className="text-xs text-pale/70 font-mono tracking-wide">{clue}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
