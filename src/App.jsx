import { useState, useCallback, useRef } from 'react';
import { CHAPTER1_LIGHTHOUSE, CHAPTER1_SCENE_ORDER, CHAPTER1_META } from './data/chapter1_lighthouse.js';
import { CHAPTER2_RETURN, CHAPTER2_SCENE_ORDER, CHAPTER2_META } from './data/chapter2_return.js';
import { useGameState } from './hooks/useGameState.js';
import DiceRoller from './components/DiceRoller.jsx';
import NarrativeBox from './components/NarrativeBox.jsx';
import StatPanel from './components/StatPanel.jsx';

const ALL_NODES = [...CHAPTER1_LIGHTHOUSE, ...CHAPTER2_RETURN];
const ALL_ORDER = [...CHAPTER1_SCENE_ORDER, ...CHAPTER2_SCENE_ORDER];
const NODE_MAP  = Object.fromEntries(ALL_NODES.map((n) => [n.id, n]));
const CH1_LAST  = CHAPTER1_SCENE_ORDER[CHAPTER1_SCENE_ORDER.length - 1];

function getChapterMeta(nodeId) {
  return CHAPTER1_SCENE_ORDER.includes(nodeId) ? CHAPTER1_META : CHAPTER2_META;
}

function nodeToScene(node, choiceIdx) {
  const meta   = getChapterMeta(node.id);
  const choice = node.options?.[choiceIdx] ?? node.options?.[0];
  return {
    id: String(node.id),
    title: meta.title,
    location: meta.location,
    year: meta.year,
    atmosphere: meta.atmosphere,
    description: node.text,
    dc: choice?.dc ?? 10,
    success: choice ? [choice.onSuccess] : ['调查继续。'],
    failure: choice ? [choice.onFailure] : ['调查受阻。'],
  };
}

function getNextNodeId(currentId) {
  const idx = ALL_ORDER.indexOf(currentId);
  return idx >= 0 && idx < ALL_ORDER.length - 1 ? ALL_ORDER[idx + 1] : null;
}

export default function App() {
  const { gameState, burnSanity, takeDamage, restore, addClue } = useGameState();
  const [nodeId, setNodeId]         = useState(ALL_ORDER[0]);
  const [choiceIdx, setChoiceIdx]   = useState(0);
  const [rollResult, setRollResult] = useState(null);
  const [resolved, setResolved]     = useState(false);
  const [bridge, setBridge]         = useState(false);

  const currentNode   = NODE_MAP[nodeId];
  const currentChoice = currentNode?.options?.[choiceIdx] ?? currentNode?.options?.[0];
  const scene         = currentNode ? nodeToScene(currentNode, choiceIdx) : null;
  const chapterMeta   = currentNode ? getChapterMeta(nodeId) : CHAPTER1_META;
  const isChapter2    = CHAPTER2_SCENE_ORDER.includes(nodeId);
  const isGameOver    = !gameState.isAlive || !gameState.isSane;
  const isLastNode    = !getNextNodeId(nodeId);
  const san           = gameState.san;
  const nodeIndex     = ALL_ORDER.indexOf(nodeId) + 1;
  const localIndex    = isChapter2
    ? CHAPTER2_SCENE_ORDER.indexOf(nodeId) + 1
    : CHAPTER1_SCENE_ORDER.indexOf(nodeId) + 1;
  const glitchMild   = san < 40 && san >= 20;
  const glitchSevere = san < 20;
  const glitchClass  = glitchSevere ? 'glitch-effect-severe glitch-scanlines' : glitchMild ? 'glitch-effect' : '';
  const accentColor  = isChapter2 ? '#60a5fa' : '#b5921a';
  const accentBorder = isChapter2 ? 'rgba(96,165,250,0.3)' : 'rgba(181,146,26,0.3)';

  const resolvedRef      = useRef(false);
  const currentChoiceRef = useRef(currentChoice);
  currentChoiceRef.current = currentChoice;

  const handleResult = useCallback((result) => {
    const choice = currentChoiceRef.current;
    if (!choice || resolvedRef.current) return;
    resolvedRef.current = true;
    if (!result.success) {
      const txt = choice.onFailure || '';
      if (txt.includes('体力损失')) takeDamage(1);
      if (txt.includes('理智损失2')) burnSanity(10);
      else if (txt.includes('理智损失3')) burnSanity(15);
      else if (txt.includes('理智损失')) burnSanity(5);
    }
    if (result.success) {
      const match = (choice.onSuccess || '').match(/获得【([^】]+)】/);
      if (match) addClue(match[1]);
    }
    setRollResult(result);
    setResolved(true);
  }, [takeDamage, burnSanity, addClue]);

  const handleBurnSanity = useCallback((amt) => burnSanity(amt), [burnSanity]);

  const handleNextNode = useCallback(() => {
    const nextId = getNextNodeId(nodeId);
    if (!nextId) return;
    if (nodeId === CH1_LAST) { setBridge(true); return; }
    resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, [nodeId]);

  const handleEnterCh2 = useCallback(() => {
    const nextId = getNextNodeId(CH1_LAST);
    setBridge(false); resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, []);

  const handleRestart = useCallback(() => {
    resolvedRef.current = false; restore();
    setNodeId(ALL_ORDER[0]); setChoiceIdx(0); setRollResult(null); setResolved(false); setBridge(false);
  }, [restore]);

  if (!scene) return null;
  const panelState = { hp: gameState.hp, san, clues: gameState.clues, isAlive: gameState.isAlive, isSane: gameState.isSane };

  return (
    <div className={`min-h-screen text-parchment ${glitchClass}`}
      style={{ fontFamily: "'Noto Serif SC', 'Playfair Display', Georgia, serif" }}>

      {glitchSevere && (
        <div className="fixed top-0 left-0 right-0 z-40 text-center py-1 text-xs font-mono tracking-widest uppercase"
          style={{ background: 'rgba(80,0,0,0.7)', color: '#ff4444', animation: 'flickerText 1.5s infinite' }}>
          ██ 理智崩溃临界 · SAN {san} / 100 ██
        </div>
      )}
      {glitchMild && !glitchSevere && (
        <div className="fixed top-0 left-0 right-0 z-40 text-center py-0.5 text-xs font-mono tracking-widest"
          style={{ background: 'rgba(30,10,0,0.6)', color: '#ff8844', opacity: 0.8 }}>
          理智动摇 · SAN {san} / 100
        </div>
      )}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: isChapter2
        ? 'radial-gradient(ellipse at 50% 100%, rgba(0,20,50,0.5) 0%, transparent 60%)'
        : 'radial-gradient(ellipse at 10% 90%, rgba(10,40,15,0.08) 0%, transparent 50%)' }} />

      {bridge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <div className="panel p-10 max-w-lg text-center flex flex-col items-center gap-5"
            style={{ border: '1px solid rgba(96,165,250,0.3)' }}>
            <p className="text-5xl">🌊</p>
            <h2 className="text-2xl font-black tracking-widest"
              style={{ fontFamily: "'Playfair Display', serif", color: '#60a5fa' }}>✦ 第一章完结 ✦</h2>
            <p className="text-pale/50 text-sm">获得线索 {gameState.clues.length} 条 · SAN {san} / 100</p>
            <div className="w-full h-px bg-blue-900/30" />
            <p className="text-pale/80 text-sm leading-loose italic">
              三个月后，你收到了米娅·科斯塔的来信。<br />
              她写道：「它又亮了。我在那里。请来。」<br />
              你的调查还没有结束。
            </p>
            <button className="btn-roll w-full"
              style={{ borderColor: 'rgba(96,165,250,0.5)', color: '#60a5fa' }}
              onClick={handleEnterCh2}>进入第二章：归来的灯光 →</button>
          </div>
        </div>
      )}

      <header className="relative border-b border-emerald-900/20 bg-black/50 backdrop-blur-sm"
        style={{ marginTop: glitchMild || glitchSevere ? '1.5rem' : 0 }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl"
              style={{ color: isChapter2 ? 'rgba(96,165,250,0.6)' : 'rgba(55,83,59,0.6)' }}>⬡</span>
            <div>
              <h1 className="text-lg font-black tracking-widest uppercase text-pale/90"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.2em' }}>骰子调查员</h1>
              <p className="text-xs text-ghost/40 tracking-widest font-mono uppercase">
                {chapterMeta.location} · {chapterMeta.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2 py-0.5 border"
              style={{ color: accentColor, borderColor: accentBorder }}>
              {isChapter2 ? '第二章' : '第一章'} · {nodeIndex} / {ALL_ORDER.length}
            </span>
            <button onClick={handleRestart}
              className="text-xs text-ghost/30 hover:text-brass/60 transition-colors tracking-widest uppercase font-mono border border-ghost/10 hover:border-brass/30 px-3 py-1.5">
              重新开始</button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-8">
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
            <div className="panel p-10 max-w-md text-center flex flex-col items-center gap-6"
              style={{ border: '1px solid rgba(139,26,26,0.4)' }}>
              <p className="text-6xl">☽</p>
              <h2 className="text-2xl font-black text-red-500 tracking-widest uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {!gameState.isAlive ? '调查员已倒下' : '理智已崩溃'}</h2>
              <p className="text-pale/60 text-sm leading-loose">
                {!gameState.isAlive
                  ? '黑暗终结了你的调查。灯塔将永远矗立在礁石之上。'
                  : '你的心智已无法承受。现实与幻觉的边界彻底消融。'}
              </p>
              <button className="btn-roll w-full" onClick={handleRestart}>重燃蜡烛，重新调查</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="flex flex-col gap-4">
            <StatPanel gameState={panelState} sceneTitle={chapterMeta.title} />
          </aside>
          <div className="flex flex-col gap-6">
            <div className="panel p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl leading-none mt-1"
                  style={{ fontFamily: "'Playfair Display', serif",
                    color: isChapter2 ? 'rgba(29,78,216,0.4)' : 'rgba(6,78,59,0.4)' }}>§</div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-pale tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {chapterMeta.title} · 第 {localIndex} 关</h2>
                  <p className="text-xs text-ghost/40 font-mono mt-1 tracking-widest">
                    {chapterMeta.location} · {chapterMeta.year}</p>
                </div>
              </div>
            </div>

            <NarrativeBox
              scene={scene}
              result={rollResult && resolved ? rollResult : null}
              glitch={glitchSevere}
              onContinue={resolved && !isLastNode && !isGameOver ? handleNextNode : null}
            />

            {!resolved && currentNode?.options?.length > 1 && (
              <div className="panel p-4 flex flex-col gap-2">
                <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono mb-1">选择行动方式</p>
                {currentNode.options.map((opt, i) => (
                  <button key={i} onClick={() => setChoiceIdx(i)}
                    className={['text-left px-4 py-3 text-sm border transition-all duration-200',
                      choiceIdx === i
                        ? 'border-brass/60 bg-brass/10 text-pale'
                        : 'border-ghost/10 text-ghost/50 hover:border-ghost/30 hover:text-ghost/70',
                    ].join(' ')}>
                    <span className="font-mono text-xs mr-2" style={{ color: accentColor }}>{i + 1}.</span>
                    {opt.label}
                    <span className="ml-2 text-xs text-ghost/40 font-mono">DC {opt.dc}</span>
                  </button>
                ))}
              </div>
            )}

            {!isGameOver && !resolved && (
              <div className="panel p-8">
                <DiceRoller dc={scene.dc} onResult={handleResult}
                  onBurnSanity={handleBurnSanity} sanity={san} disabled={isGameOver} />
              </div>
            )}

            {resolved && isLastNode && !isGameOver && (
              <div className="panel p-6 border text-center animate-fade-slide"
                style={{ borderColor: accentBorder }}>
                <p className="text-lg font-bold tracking-widest"
                  style={{ fontFamily: "'Playfair Display', serif", color: accentColor }}>
                  ✦ 调查完结 ✦</p>
                <p className="text-pale/50 text-sm mt-2">
                  获得线索 {gameState.clues.length} 条 · SAN {san} / 100</p>
                <button className="btn-roll mt-4 w-48" onClick={handleRestart}>开启新的调查</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="relative border-t border-emerald-900/10 mt-16 py-6 text-center">
        <p className="text-xs text-ghost/20 tracking-widest font-mono uppercase">
          Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn</p>
      </footer>
    </div>
  );
}

