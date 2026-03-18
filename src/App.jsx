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
const VERSION   = 'v0.3.0';

// ── 10 种结局判定矩阵 ──────────────────────────────────────────────
const ENDINGS = [
  {
    id: 'sacrificed',
    title: '海祭品',
    type: 'failure',
    desc: '礁石吞噬了你的躯壳，海浪洗刷了你存在过的痕迹。没有人会来寻找你——就像你曾经寻找那三个技术人员一样。',
    condition: (gs) => !gs.isAlive,
  },
  {
    id: 'shattered',
    title: '坍塌的理性',
    type: 'failure',
    desc: '你的大脑为了自保，彻底切断了与现实的联系。你被发现时坐在灯室地板上，双手掌心向上，反复叠写着一个词，直到笔迹模糊。',
    condition: (gs) => !gs.isSane,
  },
  {
    id: 'ultimate_awakening',
    title: '终极觉醒',
    type: 'hidden',
    desc: '你不再抗拒。你就是那旋转的光。你的身体留在灯塔里，但那个被称为「你」的东西早已随着光束延伸进入了更深的地方。',
    condition: (gs) => gs.san < 10 && gs.clues.includes('星图残页'),
  },
  {
    id: 'inheritor',
    title: '继承者',
    type: 'success',
    desc: '你带着霍利斯的笔记本离开了。你将成为下一任「调查员」——不是因为你想，而是因为你现在知道得太多，再也无法假装这个世界是安全的。',
    condition: (gs) => gs.clues.includes('霍利斯日记') && gs.investigationProgress >= 100,
  },
  {
    id: 'prophet',
    title: '疯狂的先知',
    type: 'failure',
    desc: '你成了神谕的传声筒。你能听见它说话，能感受到它呼吸的节律，你的身体开始在人类与异类之间异变。',
    condition: (gs) => gs.san < 20 && gs.investigationProgress >= 90,
  },
  {
    id: 'truth_prisoner',
    title: '真相的囚徒',
    type: 'success',
    desc: '你洞悉了一切——那个存在是什么，它想要什么，以及为什么法尔角灯塔从1847年起就是它的眼睛。你活了下来，但余生都将在这种恐怖的清醒中度过。',
    condition: (gs) => gs.san > 50 && gs.investigationProgress >= 80,
  },
  {
    id: 'lost_echo',
    title: '迷失在回响中',
    type: 'failure',
    desc: '你在灯塔中徘徊，坚信自己是第8任守塔人。每隔四十秒你就会停下来，侧耳倾听，等待那个来自海底的回应。',
    condition: (gs) => gs.san < 30 && gs.investigationProgress >= 50 && gs.investigationProgress < 90,
  },
  {
    id: 'gray_survivor',
    title: '灰色的生还',
    type: 'success',
    desc: '你们逃离了法尔角，但再也不敢靠近任何水源。米娅也是。你们从未谈论过那一晚，但每次雨夜你们都会同时醒来。',
    condition: (gs) => gs.san >= 30 && gs.san <= 50 && gs.clues.includes('米娅的证词'),
  },
  {
    id: 'mortal_salvation',
    title: '凡人的救赎',
    type: 'success',
    desc: '你封印了裂缝，虽然不明白原理，但你活了下来。你回到阿卡姆，写了一份冗长的报告，没有人相信。这或许是最好的结果。',
    condition: (gs) => gs.san > 60 && gs.investigationProgress < 50,
  },
  {
    id: 'total_blindness',
    title: '彻底的盲目',
    type: 'neutral',
    desc: '你什么也没发现。三名技术人员的失踪依然是个谜。你的报告被存入档案，再也没有人打开它。这或许是你最大的幸运。',
    condition: (gs) => gs.san > 50 && gs.investigationProgress < 30,
  },
];

function determineEnding(gs) {
  for (const e of ENDINGS) {
    if (e.condition(gs)) return e;
  }
  return ENDINGS[ENDINGS.length - 1];
}

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
  const { gameState, burnSanity, takeDamage, restore, addClue, addInvestigation } = useGameState();
  const [nodeId, setNodeId]           = useState(ALL_ORDER[0]);
  const [choiceIdx, setChoiceIdx]     = useState(0);
  const [rollResult, setRollResult]   = useState(null);
  const [resolved, setResolved]       = useState(false);
  const [bridge, setBridge]           = useState(false);
  const [pendingResult, setPendingResult] = useState(null); // 博弈缓冲区
  const [ending, setEnding]           = useState(null);     // 触发的结局
  const [devMode, setDevMode]         = useState(false);    // 开发者模式
  const [defyFlash, setDefyFlash]     = useState(false);    // 逆天改命闪屏

  const currentNode   = NODE_MAP[nodeId];
  const currentChoice = currentNode?.options?.[choiceIdx] ?? currentNode?.options?.[0];
  const scene         = currentNode ? nodeToScene(currentNode, choiceIdx) : null;
  const chapterMeta   = currentNode ? getChapterMeta(nodeId) : CHAPTER1_META;
  const isChapter2    = CHAPTER2_SCENE_ORDER.includes(nodeId);
  const isGameOver    = !gameState.isAlive || !gameState.isSane;
  const isLastNode    = !getNextNodeId(nodeId);
  const san           = gameState.san;
  const inv           = gameState.investigationProgress;
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

  // 最终结算逻辑
  const finalizeResult = useCallback((result, choice) => {
    if (!result.success) {
      const txt = choice.onFailure || '';
      if (txt.includes('体力损失')) takeDamage(1);
      if (txt.includes('理智损失2')) burnSanity(10);
      else if (txt.includes('理智损失3')) burnSanity(15);
      else if (txt.includes('理智损失')) burnSanity(5);
    } else {
      // 成功：获得线索 + 调查度
      const clueMatch = (choice.onSuccess || '').match(/获得【([^】]+)】/);
      if (clueMatch) addClue(clueMatch[1]);
      if (choice.clue) addClue(choice.clue);
      if (choice.investigationValue) addInvestigation(choice.investigationValue);
    }
    setRollResult(result);
    setResolved(true);
  }, [takeDamage, burnSanity, addClue, addInvestigation]);

  // 掷骰结果处理：失败进入博弈缓冲区
  const handleResult = useCallback((result) => {
    const choice = currentChoiceRef.current;
    if (!choice || resolvedRef.current) return;
    resolvedRef.current = true; // 防止重复触发
    if (result.success) {
      finalizeResult(result, choice);
    } else {
      // 失败 → 博弈环节（不立即结算，等待玩家选择）
      setPendingResult({ result, choice });
    }
  }, [finalizeResult]);

  // 逆天改命：燃烧 SAN +3 加成
  const handleDefyFate = useCallback(() => {
    if (!pendingResult) return;
    const { result, choice } = pendingResult;
    burnSanity(10);
    // 触发 RGB 色散闪屏
    setDefyFlash(true);
    setTimeout(() => setDefyFlash(false), 600);
    const boosted = { ...result, total: result.total + 3 };
    boosted.success = boosted.total >= (scene?.dc ?? 10);
    setPendingResult(null);
    finalizeResult(boosted, choice);
  }, [pendingResult, burnSanity, finalizeResult, scene]);

  // 接受命运
  const handleAcceptFate = useCallback(() => {
    if (!pendingResult) return;
    const { result, choice } = pendingResult;
    setPendingResult(null);
    finalizeResult(result, choice);
  }, [pendingResult, finalizeResult]);

  const handleBurnSanity = useCallback((amt) => burnSanity(amt), [burnSanity]);

  const handleNextNode = useCallback(() => {
    const nextId = getNextNodeId(nodeId);
    if (!nextId) {
      // 最后一关 → 判定结局
      setEnding(determineEnding(gameState));
      return;
    }
    if (nodeId === CH1_LAST) { setBridge(true); return; }
    resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, [nodeId, gameState]);

  const handleEnterCh2 = useCallback(() => {
    const nextId = getNextNodeId(CH1_LAST);
    setBridge(false); resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, []);

  const handleRestart = useCallback(() => {
    resolvedRef.current = false; restore();
    setNodeId(ALL_ORDER[0]); setChoiceIdx(0); setRollResult(null);
    setResolved(false); setBridge(false); setPendingResult(null); setEnding(null);
  }, [restore]);

  if (!scene) return null;
  const panelState = { hp: gameState.hp, san, inv, clues: gameState.clues, isAlive: gameState.isAlive, isSane: gameState.isSane };

  return (
    <div className={`min-h-screen text-parchment${defyFlash ? ' defy-fate-flash' : ''}`}
      style={{ fontFamily: "'Noto Serif SC', 'Playfair Display', Georgia, serif", willChange: 'transform' }}>
      {/* Glitch overlay — 独立层，不触发整页 repaint */}
      {glitchClass && (
        <div className={`fixed inset-0 pointer-events-none z-10 ${glitchClass}`} />
      )}
      {glitchSevere && (<div className="fixed top-0 left-0 right-0 z-40 text-center py-1 text-xs font-mono tracking-widest uppercase" style={{ background: 'rgba(80,0,0,0.7)', color: '#ff4444', animation: 'flickerText 1.5s infinite' }}>██ 理智崩溃临界 · SAN {san} / 100 ██</div>)}
      {glitchMild && !glitchSevere && (<div className="fixed top-0 left-0 right-0 z-40 text-center py-0.5 text-xs font-mono tracking-widest" style={{ background: 'rgba(30,10,0,0.6)', color: '#ff8844', opacity: 0.8 }}>理智动摇 · SAN {san} / 100</div>)}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: isChapter2 ? 'radial-gradient(ellipse at 50% 100%, rgba(0,20,50,0.5) 0%, transparent 60%)' : 'radial-gradient(ellipse at 10% 90%, rgba(10,40,15,0.08) 0%, transparent 50%)' }} />
      {ending && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"><div className="panel p-10 max-w-lg text-center flex flex-col items-center gap-5" style={{ border: '1px solid rgba(255,255,255,0.15)' }}><p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: ending.type==='success'?'#60a5fa':ending.type==='failure'?'#f87171':'#c084fc' }}>{ending.type==='success'?'── 成功结局 ──':ending.type==='failure'?'── 失败结局 ──':'── 隐藏结局 ──'}</p><h2 className="text-3xl font-black tracking-widest" style={{ fontFamily:"'Playfair Display',serif", color: ending.type==='success'?'#60a5fa':ending.type==='failure'?'#f87171':'#c084fc' }}>{ending.title}</h2><div className="w-full h-px my-2 bg-white/10" /><p className="text-pale/80 text-sm leading-loose">{ending.desc}</p><div className="w-full h-px my-2 bg-white/10" /><p className="text-ghost/40 text-xs font-mono">SAN {san} / 100 · 调查度 {inv}% · 线索 {gameState.clues.length} 条</p><button className="btn-roll w-full mt-2" onClick={handleRestart}>重新调查</button></div></div>)}
      {pendingResult && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"><div className="panel p-8 max-w-md text-center flex flex-col items-center gap-4" style={{ border: '1px solid rgba(239,68,68,0.4)' }}><p className="text-xs font-mono tracking-widest uppercase text-red-400">── 骰子调查员特色 ──</p><h3 className="text-xl font-black text-pale" style={{ fontFamily:"'Playfair Display',serif" }}>命运的裂缝</h3><p className="text-pale/70 text-sm leading-relaxed">你掷出了 <span className="text-red-400 font-bold">{pendingResult.result.total}</span>，目标难度 <span className="font-bold" style={{color:accentColor}}>{scene?.dc}</span>。差距：<span className="text-red-400 font-bold">{(scene?.dc??0)-pendingResult.result.total}</span> 点。</p><div className="w-full flex flex-col gap-3 mt-2"><button onClick={handleDefyFate} disabled={san<=10} className="w-full px-4 py-3 text-sm border transition-all disabled:opacity-30" style={{ borderColor:'rgba(239,68,68,0.5)',color:'#f87171',background:'rgba(239,68,68,0.08)' }}>🔥 燃烧理智（-10 SAN）· 骰点 +3 · 逆天改命</button><button onClick={handleAcceptFate} className="w-full px-4 py-3 text-sm border transition-all" style={{ borderColor:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)' }}>接受命运 · 承担失败后果</button></div>{san<=10&&<p className="text-red-400/60 text-xs">理智已不足，无法再燃烧。</p>}</div></div>)}
      {bridge && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"><div className="panel p-10 max-w-lg text-center flex flex-col items-center gap-5" style={{ border:'1px solid rgba(96,165,250,0.3)' }}><p className="text-5xl">🌊</p><h2 className="text-2xl font-black tracking-widest" style={{ fontFamily:"'Playfair Display',serif",color:'#60a5fa' }}>✦ 第一章完结 ✦</h2><p className="text-pale/50 text-sm">线索 {gameState.clues.length} 条 · 调查度 {inv}% · SAN {san} / 100</p><div className="w-full h-px bg-blue-900/30" /><p className="text-pale/80 text-sm leading-loose italic">三个月后，你收到了米娅·科斯塔的来信。<br/>她写道：「它又亮了。我在那里。请来。」<br/>你的调查还没有结束。</p><button className="btn-roll w-full" style={{ borderColor:'rgba(96,165,250,0.5)',color:'#60a5fa' }} onClick={handleEnterCh2}>进入第二章：归来的灯光 →</button></div></div>)}
      {isGameOver && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"><div className="panel p-10 max-w-md text-center flex flex-col items-center gap-6" style={{ border:'1px solid rgba(139,26,26,0.4)' }}><p className="text-6xl">☽</p><h2 className="text-2xl font-black text-red-500 tracking-widest uppercase" style={{ fontFamily:"'Playfair Display',serif" }}>{!gameState.isAlive?'调查员已倒下':'理智已崩溃'}</h2><p className="text-pale/60 text-sm leading-loose">{!gameState.isAlive?'黑暗终结了你的调查。':'你的心智已无法承受。现实与幻觉的边界彻底消融。'}</p><button className="btn-roll w-full" onClick={handleRestart}>重燃蜡烛，重新调查</button></div></div>)}
      <header className="relative border-b border-emerald-900/20 bg-black/50 backdrop-blur-sm" style={{ marginTop: glitchMild||glitchSevere?'1.5rem':0 }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl" style={{ color: isChapter2?'rgba(96,165,250,0.6)':'rgba(55,83,59,0.6)' }}>⬡</span>
            <div>
              <h1 className="text-lg font-black tracking-widest uppercase text-pale/90" style={{ fontFamily:"'Playfair Display',Georgia,serif", letterSpacing:'0.2em' }}>骰子调查员</h1>
              <p className="text-xs text-ghost/40 tracking-widest font-mono uppercase">{chapterMeta.location} · {chapterMeta.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2 py-0.5 border" style={{ color:accentColor, borderColor:accentBorder }}>{isChapter2?'第二章':'第一章'} · {nodeIndex} / {ALL_ORDER.length}</span>
            <span className="text-xs font-mono text-ghost/25 border border-ghost/10 px-2 py-0.5">{VERSION}</span>
            <button
              onClick={() => setDevMode(v => !v)}
              className="text-xs tracking-widest uppercase font-mono border px-3 py-1.5 transition-all duration-200"
              style={devMode
                ? { borderColor:'rgba(96,165,250,0.5)', color:'#60a5fa', background:'rgba(96,165,250,0.08)' }
                : { borderColor:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.25)' }}
              title="开发者模式：关闭打字机效果"
            >
              {devMode ? '⚡ DEV ON' : 'DEV'}
            </button>
            <button onClick={handleRestart} className="text-xs text-ghost/30 hover:text-brass/60 transition-colors tracking-widest uppercase font-mono border border-ghost/10 hover:border-brass/30 px-3 py-1.5">重新开始</button>
          </div>
        </div>
      </header>
      <main className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="flex flex-col gap-4"><StatPanel gameState={panelState} sceneTitle={chapterMeta.title} /></aside>
          <div className="flex flex-col gap-6">
            <div className="panel p-6"><div className="flex items-start gap-4">
              <div className="text-4xl leading-none mt-1" style={{ fontFamily:"'Playfair Display',serif", color:isChapter2?'rgba(29,78,216,0.4)':'rgba(6,78,59,0.4)' }}>§</div>
              <div className="flex-1"><h2 className="text-xl font-black text-pale tracking-wide" style={{ fontFamily:"'Playfair Display',serif" }}>{chapterMeta.title} · 第 {localIndex} 关</h2>
              <p className="text-xs text-ghost/40 font-mono mt-1 tracking-widest">{chapterMeta.location} · {chapterMeta.year}</p></div>
            </div></div>
            <NarrativeBox scene={scene} result={rollResult&&resolved?rollResult:null} glitch={glitchSevere}
              instant={devMode}
              onContinue={resolved&&!isLastNode&&!isGameOver?handleNextNode:null} />
            {!resolved&&currentNode?.options?.length>1&&(
              <div className="panel p-4 flex flex-col gap-2">
                <p className="text-xs tracking-widest uppercase text-ghost/50 font-mono mb-1">选择行动方式</p>
                {currentNode.options.map((opt,i)=>(
                  <button key={i} onClick={()=>setChoiceIdx(i)}
                    className={['text-left px-4 py-3 text-sm border transition-all duration-200',
                      choiceIdx===i?'border-brass/60 bg-brass/10 text-pale':'border-ghost/10 text-ghost/50 hover:border-ghost/30 hover:text-ghost/70'].join(' ')}>
                    <span className="font-mono text-xs mr-2" style={{color:accentColor}}>{i+1}.</span>
                    {opt.label} <span className="ml-2 text-xs text-ghost/40 font-mono">DC {opt.dc}</span>
                    {opt.investigationValue&&<span className="ml-1 text-xs" style={{color:'rgba(96,165,250,0.5)'}}>+{opt.investigationValue}%调查度</span>}
                  </button>
                ))}
              </div>
            )}
            {!isGameOver&&!resolved&&!pendingResult&&(<div className="panel p-8"><DiceRoller dc={scene.dc} onResult={handleResult} onBurnSanity={handleBurnSanity} sanity={san} disabled={isGameOver||!!pendingResult}/></div>)}
            {resolved&&isLastNode&&!isGameOver&&(
              <div className="panel p-6 border text-center animate-fade-slide" style={{borderColor:accentBorder}}>
                <p className="text-lg font-bold tracking-widest" style={{fontFamily:"'Playfair Display',serif",color:accentColor}}>✦ 调查完结 ✦</p>
                <p className="text-pale/50 text-sm mt-2">线索 {gameState.clues.length} 条 · 调查度 {inv}% · SAN {san} / 100</p>
                <button className="btn-roll mt-4 w-48" onClick={()=>setEnding(determineEnding(gameState))}>查看结局</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="relative border-t border-emerald-900/10 mt-16 py-6 text-center">
        <p className="text-xs text-ghost/20 tracking-widest font-mono uppercase">Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn</p>
      </footer>
    </div>
  );
}
