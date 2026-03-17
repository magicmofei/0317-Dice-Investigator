import { useEffect, useRef } from 'react';

/**
 * NarrativeBox
 * Props:
 *   scene    — 当前场景对象
 *   result   — null | { success: bool, burnCount: number }
 */
export default function NarrativeBox({ scene, result }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (result && boxRef.current) {
      boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  const lines = result
    ? (result.success ? scene.success : scene.failure)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* 场景描述（始终显示） */}
      <div className="panel p-6 border-l-2 border-brass/30">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-brass/50 text-lg">◈</span>
          <div>
            <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono">{scene.atmosphere}</p>
            <p className="text-sm text-pale/70">{scene.location} — {scene.year}</p>
          </div>
        </div>
        <p className="text-pale/90 leading-loose text-sm">{scene.description}</p>
      </div>

      {/* 判定结果叙述 */}
      {lines && (
        <div
          ref={boxRef}
          className={[
            'panel p-6 border-l-4 animate-fade-slide',
            result.success
              ? 'border-yellow-600/50'
              : 'border-red-800/60',
          ].join(' ')}
        >
          {/* 结果标题 */}
          <div className="flex items-center gap-2 mb-4">
            {result.success ? (
              <>
                <span className="text-yellow-500 text-lg">✦</span>
                <span className="text-xs tracking-widest uppercase text-yellow-600/80 font-mono font-bold">
                  命运眷顾了你
                </span>
              </>
            ) : (
              <>
                <span className="text-red-600 text-lg">✘</span>
                <span className="text-xs tracking-widest uppercase text-red-700/80 font-mono font-bold">
                  黑暗将你吞噬
                </span>
              </>
            )}
          </div>

          {/* 段落文字逐行渲染 */}
          <div className="flex flex-col gap-3">
            {lines.map((line, i) => (
              <p
                key={i}
                className="text-pale/85 leading-loose text-sm"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  animation: 'fadeSlideIn 0.5s ease-out both',
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* 燃烧理智的额外注释 */}
          {!result.success && result.burnCount > 0 && (
            <div className="mt-4 pt-4 border-t border-red-900/30">
              <p className="text-xs text-red-400/60 italic">
                你的意志超越了理性的边界，以理智为代价强行扭转了命运……但某些东西已经改变了。
              </p>
            </div>
          )}
          {result.success && result.burnCount > 0 && (
            <div className="mt-4 pt-4 border-t border-yellow-900/30">
              <p className="text-xs text-yellow-600/60 italic">
                代价是真实的。你以理智换取了成功——而那道裂痕，不会愈合。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 待投骰提示 */}
      {!result && (
        <div className="panel p-4 border-dashed border-brass/10 flex items-center justify-center gap-3">
          <span className="text-brass/30 text-xl animate-pulse">⬡</span>
          <p className="text-xs tracking-widest uppercase text-ghost/30 font-mono">
            投掷骰子以揭示命运
          </p>
          <span className="text-brass/30 text-xl animate-pulse">⬡</span>
        </div>
      )}
    </div>
  );
}
