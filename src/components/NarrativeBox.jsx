import { useEffect, useRef } from 'react';
import { TypewriterText } from '../hooks/useGlitch.jsx';

export default function NarrativeBox({ scene, result, glitch = false, onContinue = null, isLastNode = false, instant = false }) {
  const boxRef = useRef(null);
  const continueRef = useRef(null);

  useEffect(() => {
    if (result && boxRef.current) {
      boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  // 叙事文字打完后，滚动到继续按钮
  useEffect(() => {
    if (result && onContinue && continueRef.current) {
      const timer = setTimeout(() => {
        continueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [result, onContinue]);

  const lines = result
    ? (result.success ? scene.success : scene.failure)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* 场景描述 */}
      <div className="panel p-6 border-l-2 border-emerald-900/40">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-emerald-700/60 text-lg">◈</span>
          <div>
            <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono">{scene.atmosphere}</p>
            <p className="text-sm text-pale/70">{scene.location} — {scene.year}</p>
          </div>
        </div>
        <p className="text-pale/90 leading-loose text-sm">
          <TypewriterText
            key={scene.id + '-desc'}
            text={scene.description}
            speed={22}
            glitch={glitch}
            instant={instant}
          />
        </p>
      </div>

      {/* 判定结果叙述 */}
      {lines && (
        <div
          ref={boxRef}
          className={[
            'panel p-6 border-l-4 animate-fade-slide',
            result.success ? 'border-yellow-600/50' : 'border-red-800/60',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 mb-4">
            {result.success ? (
              <>
                <span className="text-yellow-500 text-lg">✦</span>
                <span className="text-xs tracking-widest uppercase text-yellow-600/80 font-mono font-bold">命运眷顾了你</span>
              </>
            ) : (
              <>
                <span className="text-red-600 text-lg">✘</span>
                <span className="text-xs tracking-widest uppercase text-red-700/80 font-mono font-bold">黑暗将你吞噬</span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {lines.map((line, i) => (
              <p
                key={i}
                className="text-pale/85 leading-loose text-sm"
                style={{ animationDelay: `${i * 0.1}s`, animation: 'fadeSlideIn 0.4s ease-out both' }}
              >
                <TypewriterText
                  key={scene.id + '-line-' + i + '-' + (result.success ? 's' : 'f')}
                  text={line}
                  speed={18}
                  glitch={glitch}
                  instant={instant}
                />
              </p>
            ))}
          </div>

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

          {/* 继续按钮内嵌在叙事框底部 */}
          {onContinue && (
            <div ref={continueRef} className="mt-6 flex justify-center">
              <button
                className="btn-roll px-10"
                onClick={onContinue}
              >
                {result.success ? '循线追查 →' : '硬着头皮继续 →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 待投骰提示 */}
      {!result && (
        <div className="panel p-4 border-dashed border-emerald-900/20 flex items-center justify-center gap-3">
          <span className="text-emerald-900/50 text-xl animate-pulse">⬡</span>
          <p className="text-xs tracking-widest uppercase text-ghost/30 font-mono">投掷骰子以揭示命运</p>
          <span className="text-emerald-900/50 text-xl animate-pulse">⬡</span>
        </div>
      )}
    </div>
  );
}
