import { useState, useCallback } from 'react';
import { SCENES } from './data/scenes.js';
import { useGameState } from './hooks/useGameState.js';
import DiceRoller from './components/DiceRoller.jsx';
import NarrativeBox from './components/NarrativeBox.jsx';
import StatPanel from './components/StatPanel.jsx';

export default function App() {
  const { gameState, burnSanity, takeDamage, restore, addClue, goToScene } = useGameState();
  const [rollResult, setRollResult] = useState(null); // { roll, bonus, total, success, burnCount }
  const [resolved, setResolved]     = useState(false); // 本场景是否已完成判定
  const [showNext, setShowNext]     = useState(false);

  const scene = SCENES[gameState.sceneId];
  const isGameOver = !gameState.isAlive || !gameState.isSane;

  const handleResult = useCallback((result) => {
    setRollResult(result);
    setResolved((wasResolved) => {
      if (!wasResolved) {
        // 首次落定：扣血
        if (!result.success) {
          takeDamage(1);
        }
      }
      return true;
    });
    // 成功且有线索则添加
    if (result.success && scene.clue_on_success) {
      addClue(scene.clue_on_success);
    }
    // 任何已落定的结果都显示继续按钮
    setShowNext(true);
  }, [scene, takeDamage, addClue]);

  const handleBurnSanity = useCallback((amount) => {
    burnSanity(amount);
  }, [burnSanity]);

  const handleNextScene = useCallback(() => {
    const nextId = rollResult?.success
      ? scene.next_on_success
      : scene.next_on_failure;
    if (nextId) {
      goToScene(nextId);
      setRollResult(null);
      setResolved(false);
      setShowNext(false);
    }
  }, [rollResult, scene, goToScene]);

  const handleRestart = useCallback(() => {
    restore();
    setRollResult(null);
    setResolved(false);
    setShowNext(false);
  }, [restore]);

  const isLastScene = !scene.next_on_success && !scene.next_on_failure;
  const isConcluded = isLastScene && resolved;

  return (
    <div className="min-h-screen text-parchment" style={{ fontFamily: "'Noto Serif SC', 'Playfair Display', Georgia, serif" }}>
      {/* 背景装饰层 */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at 10% 90%, rgba(139,26,26,0.06) 0%, transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(13,13,26,0.9) 0%, transparent 60%)',
      }} />

      {/* 顶部标题栏 */}
      <header className="relative border-b border-brass/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-brass/60 text-2xl">⬡</span>
            <div>
              <h1 className="text-lg font-black tracking-widest uppercase text-pale/90" style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.2em' }}>
                骰子调查员
              </h1>
              <p className="text-xs text-ghost/40 tracking-widest font-mono uppercase">Cthulhu Mythos · 1923</p>
            </div>
          </div>
          <button
            onClick={handleRestart}
            className="text-xs text-ghost/30 hover:text-brass/60 transition-colors tracking-widest uppercase font-mono border border-ghost/10 hover:border-brass/30 px-3 py-1.5"
          >
            重新开始
          </button>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="relative max-w-6xl mx-auto px-4 py-8">
        {/* 游戏结束覆层 */}
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="panel p-10 max-w-md text-center flex flex-col items-center gap-6" style={{ border: '1px solid rgba(139,26,26,0.4)' }}>
              <p className="text-6xl">☽</p>
              <h2 className="text-2xl font-black text-red-500 tracking-widest uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                {!gameState.isAlive ? '调查员已倒下' : '理智已崩溃'}
              </h2>
              <p className="text-pale/60 text-sm leading-loose">
                {!gameState.isAlive
                  ? '黑暗中某种东西终结了你的调查。阿卡姆将再无人知晓真相。'
                  : '你的心智已无法承受它所见到的一切。现实与幻觉的边界彻底消融。'}
              </p>
              <button className="btn-roll w-full" onClick={handleRestart}>重燃蜡烛，重新调查</button>
            </div>
          </div>
        )}

        {/* 终章结束提示 */}
        {isConcluded && !isGameOver && (
          <div className="mb-8 panel p-6 border border-brass/20 text-center">
            <p className="text-brass/80 text-lg font-bold tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
              ✦ 调查结束 ✦
            </p>
            <p className="text-pale/50 text-sm mt-2">你已走到故事的尽头。获得线索 {gameState.clues.length} 条。</p>
            <button className="btn-roll mt-4 w-48" onClick={handleRestart}>开启新的调查</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* 左栏：角色状态 */}
          <aside className="flex flex-col gap-4">
            <StatPanel gameState={gameState} sceneTitle={scene.title} />
          </aside>

          {/* 右栏：游戏主区域 */}
          <div className="flex flex-col gap-6">

            {/* 场景标题 */}
            <div className="panel p-6">
              <div className="flex items-start gap-4">
                <div className="text-brass/30 text-4xl leading-none mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>§</div>
                <div>
                  <h2 className="text-xl font-black text-pale tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {scene.title}
                  </h2>
                  <p className="text-xs text-ghost/40 font-mono mt-1 tracking-widest">
                    {scene.location} · {scene.year}
                  </p>
                </div>
              </div>
            </div>

            {/* 叙事区域 */}
            <NarrativeBox
              scene={scene}
              result={rollResult && resolved ? rollResult : null}
            />

            {/* 骰子区域 */}
            {!isConcluded && (
              <div className="panel p-8">
                <DiceRoller
                  dc={scene.dc}
                  onResult={handleResult}
                  onBurnSanity={handleBurnSanity}
                  sanity={gameState.san}
                  disabled={isGameOver}
                />
              </div>
            )}

            {/* 继续按钮 */}
            {showNext && !isLastScene && !isGameOver && (
              <div className="flex justify-center animate-fade-slide">
                <button
                  className="btn-roll px-10"
                  onClick={handleNextScene}
                >
                  {rollResult?.success ? '循线追查 →' : '硬着头皮继续 →'}
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* 底部装饰 */}
      <footer className="relative border-t border-brass/5 mt-16 py-6 text-center">
        <p className="text-xs text-ghost/20 tracking-widest font-mono uppercase">
          Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn
        </p>
      </footer>
    </div>
  );
}
