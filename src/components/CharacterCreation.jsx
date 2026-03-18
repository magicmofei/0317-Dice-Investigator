import { useState, useMemo } from 'react';

const ATTRS = [
  { key: 'STR', label: '力量', abbr: 'STR', desc: '体能、近战、承受伤害的能力' },
  { key: 'DEX', label: '敏捷', abbr: 'DEX', desc: '速度、反应、躲避危险的能力' },
  { key: 'POW', label: '意志', abbr: 'POW', desc: '心智防御、感知异常、初始理智' },
  { key: 'EDU', label: '教育', abbr: 'EDU', desc: '知识储备、线索解读、历史研究' },
  { key: 'CHA', label: '魅力', abbr: 'CHA', desc: '说服他人、收集情报、社交检定' },
];

const BASE   = 40;
const MAX    = 90;
const POOL   = 100;

function derive(attrs) {
  const hp  = Math.floor((attrs.STR + attrs.DEX) / 10) + 5;
  const san = attrs.POW;
  return { hp, san };
}

export default function CharacterCreation({ onStart }) {
  const [attrs, setAttrs] = useState(
    Object.fromEntries(ATTRS.map((a) => [a.key, BASE]))
  );
  const [hovered, setHovered] = useState(null);

  const spent = useMemo(
    () => Object.values(attrs).reduce((s, v) => s + (v - BASE), 0),
    [attrs]
  );
  const remaining = POOL - spent;
  const derived   = useMemo(() => derive(attrs), [attrs]);
  const canStart  = remaining === 0;

  function setAttr(key, raw) {
    const val = Math.max(BASE, Math.min(MAX, Number(raw)));
    const delta = val - attrs[key];
    if (delta > 0 && delta > remaining) return; // 点数不足
    setAttrs((prev) => ({ ...prev, [key]: val }));
  }

  function handleStep(key, dir) {
    setAttr(key, attrs[key] + dir);
  }

  const attrColor = {
    STR: '#c0392b',
    DEX: '#27ae60',
    POW: '#8e44ad',
    EDU: '#2980b9',
    CHA: '#d4ac0d',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "'Noto Serif SC', 'Playfair Display', Georgia, serif" }}
    >
      {/* 背景纹理层 */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: [
          'radial-gradient(ellipse at 20% 80%, rgba(60,30,5,0.35) 0%, transparent 55%)',
          'radial-gradient(ellipse at 80% 20%, rgba(10,20,40,0.4) 0%, transparent 55%)',
          'radial-gradient(ellipse at 50% 50%, rgba(30,15,5,0.2) 0%, transparent 70%)',
        ].join(','),
      }} />

      <div className="relative w-full max-w-2xl flex flex-col gap-6 animate-fade-slide">
        {/* ── 标题区 ── */}
        <div className="text-center flex flex-col items-center gap-2">
          <p className="text-xs font-mono tracking-[0.4em] uppercase text-brass/40 mb-1">ARKHAM INVESTIGATOR FILES</p>
          <h1
            className="text-4xl font-black tracking-widest text-pale/95"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.18em', textShadow: '0 0 40px rgba(181,146,26,0.25)' }}
          >
            调查员档案
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-px w-16 bg-brass/30" />
            <span className="text-xs text-ghost/40 font-mono tracking-widest">CHARACTER CREATION</span>
            <div className="h-px w-16 bg-brass/30" />
          </div>
        </div>

        {/* ── 点数池 ── */}
        <div
          className="panel px-6 py-4 flex items-center justify-between"
          style={{ border: remaining === 0 ? '1px solid rgba(181,146,26,0.5)' : '1px solid rgba(60,120,70,0.18)' }}
        >
          <div>
            <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono">可分配点数</p>
            <p
              className="text-3xl font-black font-mono mt-0.5 transition-all duration-200"
              style={{ color: remaining === 0 ? '#b5921a' : remaining < 20 ? '#f97316' : '#e8dcc8' }}
            >
              {remaining}
              <span className="text-sm text-ghost/40 ml-1">/ {POOL}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono mb-1">派生属性</p>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-ghost/40 font-mono">HP</p>
                <p className="text-xl font-black" style={{ color: '#4ade80' }}>{derived.hp}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-xs text-ghost/40 font-mono">SAN</p>
                <p className="text-xl font-black" style={{ color: '#818cf8' }}>{derived.san}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 属性列表 ── */}
        <div className="flex flex-col gap-3">
          {ATTRS.map(({ key, label, abbr, desc }) => {
            const val    = attrs[key];
            const pct    = ((val - BASE) / (MAX - BASE)) * 100;
            const color  = attrColor[key];
            const isHov  = hovered === key;

            return (
              <div
                key={key}
                className="panel px-5 py-4 transition-all duration-200"
                style={{ border: isHov ? `1px solid ${color}55` : '1px solid rgba(60,120,70,0.18)' }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-4">
                  {/* 属性名 */}
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-mono tracking-widest uppercase" style={{ color }}>{abbr}</p>
                    <p className="text-sm text-pale/70 font-bold">{label}</p>
                  </div>

                  {/* 滑动条 */}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}88, ${color})`,
                          boxShadow: pct > 0 ? `0 0 8px ${color}66` : 'none',
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={BASE}
                      max={MAX}
                      value={val}
                      onChange={(e) => setAttr(key, e.target.value)}
                      className="attr-slider w-full"
                      style={{ '--thumb-color': color }}
                    />
                    {isHov && (
                      <p className="text-xs text-ghost/40 italic mt-0.5 animate-fade-slide">{desc}</p>
                    )}
                  </div>

                  {/* 数值控制 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStep(key, -1)}
                      disabled={val <= BASE}
                      className="w-7 h-7 flex items-center justify-center border text-sm font-bold transition-all disabled:opacity-20"
                      style={{ borderColor: `${color}44`, color }}
                    >−</button>
                    <span
                      className="w-10 text-center text-lg font-black font-mono"
                      style={{ color: val > BASE ? color : 'rgba(255,255,255,0.4)' }}
                    >{val}</span>
                    <button
                      onClick={() => handleStep(key, +1)}
                      disabled={val >= MAX || remaining <= 0}
                      className="w-7 h-7 flex items-center justify-center border text-sm font-bold transition-all disabled:opacity-20"
                      style={{ borderColor: `${color}44`, color }}
                    >+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 派生属性说明 ── */}
        <div className="panel px-5 py-3 flex gap-6 text-xs text-ghost/40 font-mono">
          <span>HP = (STR+DEX)÷10 + 5</span>
          <span className="text-ghost/20">|</span>
          <span>SAN = POW</span>
          <span className="text-ghost/20">|</span>
          <span>上限 90 · 下限 40 · 池 100</span>
        </div>

        {/* ── 开始按钮 ── */}
        <button
          className="btn-roll w-full text-base py-4 tracking-[0.25em] transition-all duration-300"
          disabled={!canStart}
          onClick={() => onStart({ attrs, derived })}
          style={canStart ? { borderColor: '#b5921a', boxShadow: '0 0 30px rgba(181,146,26,0.25)' } : {}}
        >
          {canStart ? '✦ 开启调查 · 踏入黑暗 ✦' : `分配剩余 ${remaining} 点后开始`}
        </button>

        <p className="text-center text-xs text-ghost/20 font-mono tracking-widest">
          Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn
        </p>
      </div>
    </div>
  );
}
