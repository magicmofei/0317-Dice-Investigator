import { useState, useCallback, useRef } from 'react';
import { CHAPTER1_LIGHTHOUSE, CHAPTER1_SCENE_ORDER, CHAPTER1_META } from './data/chapter1_lighthouse.js';
import { CHAPTER2_RETURN, CHAPTER2_SCENE_ORDER, CHAPTER2_META } from './data/chapter2_return.js';
import { CHAPTER3_ABYSS, CHAPTER3_SCENE_ORDER, CHAPTER3_META } from './data/chapter3_abyss.js';
import { useGameState } from './hooks/useGameState.js';
import { useAudio } from './hooks/useAudio.js';
import { VERSION, CHANGELOG } from './version.js';
import DiceRoller from './components/DiceRoller.jsx';
import NarrativeBox from './components/NarrativeBox.jsx';
import StatPanel from './components/StatPanel.jsx';
import CharacterCreation from './components/CharacterCreation.jsx';

const ALL_NODES = [...CHAPTER1_LIGHTHOUSE, ...CHAPTER2_RETURN, ...CHAPTER3_ABYSS];
const ALL_ORDER = [...CHAPTER1_SCENE_ORDER, ...CHAPTER2_SCENE_ORDER, ...CHAPTER3_SCENE_ORDER];
const NODE_MAP  = Object.fromEntries(ALL_NODES.map((n) => [n.id, n]));
const CH1_LAST  = CHAPTER1_SCENE_ORDER[CHAPTER1_SCENE_ORDER.length - 1];
const CH2_LAST  = CHAPTER2_SCENE_ORDER[CHAPTER2_SCENE_ORDER.length - 1];

// ── 结局判定矩阵 ──────────────────────────────────────────────
const ENDINGS = [
  { id: 'sacrificed', title: '海祭品', type: 'failure', desc: '礁石吞噬了你的躯壳，海浪洗刷了你存在过的痕迹。没有人会来寻找你——就像你曾经寻找那三个技术人员一样。', condition: (gs) => !gs.isAlive },
  { id: 'shattered', title: '坍塌的理性', type: 'failure', desc: '你的大脑为了自保，彻底切断了与现实的联系。你被发现时坐在灯室地板上，双手掌心向上，反复叠写着一个词，直到笔迹模糊。', condition: (gs) => !gs.isSane },
  { id: 'sealed', title: '封印者', type: 'success', desc: '你完成了封印协议。灯塔的蓝绿色光熄灭了。霍利斯说这是暂时的——但暂时对人类来说已经足够了。你离开法尔角，没有回头。', condition: (gs) => gs.clues.includes('封印完成·符文') && gs.investigationProgress >= 90 },
  { id: 'covenant', title: '立约者', type: 'hidden', desc: '你和它达成了协议。你不完全理解协议的内容，但你知道它会守约——因为它足够古老，知道诺言的重量。你欠它一个承诺，而它欠你沉默。', condition: (gs) => gs.clues.includes('和平协议·达成') },
  { id: 'lost_in_signal', title: '信号中的迷失', type: 'failure', desc: '你的意识在那个频率里迷失了。你的身体完好，但那个你再也没有完全回来。有时你会在深夜起身，走向窗外，以四十秒为间隔呼吸。', condition: (gs) => gs.san < 15 && gs.clues.includes('意识封印·完成') },
  { id: 'ultimate_awakening', title: '终极觉醒', type: 'hidden', desc: '你不再抗拒。你就是那旋转的光。你的身体留在灯塔里，但那个被称为「你」的东西早已随着光束延伸进入了更深的地方。', condition: (gs) => gs.san < 10 && gs.clues.includes('星图残页') },
  { id: 'inheritor', title: '继承者', type: 'success', desc: '你带着霍利斯的笔记本离开了。你将成为下一任「调查员」——不是因为你想，而是因为你现在知道得太多，再也无法假装这个世界是安全的。', condition: (gs) => gs.clues.includes('霍利斯日记') && gs.investigationProgress >= 100 },
  { id: 'truth_prisoner', title: '真相的囚徒', type: 'success', desc: '你洞悉了一切——那个存在是什么，它想要什么，以及为什么法尔角灯塔从1847年起就是它的眼睛。你活了下来，但余生都将在这种恐怖的清醒中度过。', condition: (gs) => gs.san > 50 && gs.investigationProgress >= 80 },
  { id: 'prophet', title: '疯狂的先知', type: 'failure', desc: '你成了神谕的传声筒。你能听见它说话，能感受到它呼吸的节律，你的身体开始在人类与异类之间异变。', condition: (gs) => gs.san < 20 && gs.investigationProgress >= 90 },
  { id: 'gray_survivor', title: '灰色的生还', type: 'success', desc: '你们逃离了法尔角，但再也不敢靠近任何水源。米娅也是。你们从未谈论过那一晚，但每次雨夜你们都会同时醒来。', condition: (gs) => gs.san >= 30 && gs.san <= 50 && gs.clues.includes('米娅的证词') },
  { id: 'total_blindness', title: '彻底的盲目', type: 'neutral', desc: '你什么也没发现。三名技术人员的失踪依然是个谜。你的报告被存入档案，再也没有人打开它。这或许是你最大的幸运。', condition: (gs) => gs.san > 50 && gs.investigationProgress < 30 },
];
function determineEnding(gs) {
  for (const e of ENDINGS) {
    if (e.condition(gs)) return e;
  }
  return ENDINGS[ENDINGS.length - 1];
}

function getChapterMeta(nodeId) {
  if (CHAPTER3_SCENE_ORDER.includes(nodeId)) return CHAPTER3_META;
  if (CHAPTER2_SCENE_ORDER.includes(nodeId)) return CHAPTER2_META;
  return CHAPTER1_META;
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
    attribute: choice?.attribute ?? 'STR', // CoC 属性名
    difficulty: choice?.difficulty ?? 1,   // 1=常规 2=困难 5=极难
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
  const { muted, toggleMute } = useAudio(gameState.san);
  const [phase, setPhase] = useState('creation'); // 'creation' | 'game' | 'rolling'

  const handleStartGame = useCallback(({ attrs, derived }) => {
    restore(attrs);
    setPhase('game');
  }, [restore]);
  const [nodeId, setNodeId]           = useState(ALL_ORDER[0]);
  const [choiceIdx, setChoiceIdx]     = useState(0);
  const [rollResult, setRollResult]   = useState(null);
  const [resolved, setResolved]       = useState(false);
  const [bridge, setBridge]           = useState(false);
  const [pendingResult, setPendingResult] = useState(null); // 博弈缓冲区
  const [ending, setEnding]           = useState(null);     // 触发的结局
  const [devMode, setDevMode]         = useState(false);    // 开发者模式
  const [defyFlash, setDefyFlash]     = useState(false);    // 逆天改命闪屏
  const [showChangelog, setShowChangelog] = useState(false); // 版本信息弹窗

  const currentNode   = NODE_MAP[nodeId];
  const currentChoice = currentNode?.options?.[choiceIdx] ?? currentNode?.options?.[0];
  const scene         = currentNode ? nodeToScene(currentNode, choiceIdx) : null;
  const chapterMeta   = currentNode ? getChapterMeta(nodeId) : CHAPTER1_META;
  const isChapter2    = CHAPTER2_SCENE_ORDER.includes(nodeId);
  const isChapter3    = CHAPTER3_SCENE_ORDER.includes(nodeId);
  const isGameOver    = !gameState.isAlive || !gameState.isSane;
  const isLastNode    = !getNextNodeId(nodeId);
  const san           = gameState.san;
  const inv           = gameState.investigationProgress;
  const nodeIndex     = ALL_ORDER.indexOf(nodeId) + 1;
  const localIndex    = isChapter3
    ? CHAPTER3_SCENE_ORDER.indexOf(nodeId) + 1
    : isChapter2
    ? CHAPTER2_SCENE_ORDER.indexOf(nodeId) + 1
    : CHAPTER1_SCENE_ORDER.indexOf(nodeId) + 1;
  const glitchMild   = san < 40 && san >= 20;
  const glitchSevere = san < 20;
  const glitchClass  = glitchSevere ? 'glitch-effect-severe glitch-scanlines' : glitchMild ? 'glitch-effect' : '';
  const accentColor  = isChapter3 ? '#f87171' : isChapter2 ? '#60a5fa' : '#b5921a';
  const accentBorder = isChapter3 ? 'rgba(248,113,113,0.3)' : isChapter2 ? 'rgba(96,165,250,0.3)' : 'rgba(181,146,26,0.3)';

  // CoC 属性映射：scene.attribute 字符串 → 玩家属性值
  const ATTR_KEY_MAP = { '体魄': 'STR', '敏锐': 'DEX', '意志': 'POW', '学识': 'EDU', '魅力': 'CHA',
                         'STR': 'STR', 'DEX': 'DEX', 'POW': 'POW', 'EDU': 'EDU', 'CHA': 'CHA' };
  const attrs = gameState.attributes || { STR:50, DEX:50, POW:50, EDU:50, CHA:50 };
  const skillValue = scene ? (attrs[ATTR_KEY_MAP[scene.attribute] || 'STR'] ?? 50) : 50;
  const difficulty = scene?.difficulty ?? 1;

  const resolvedRef      = useRef(false);
  const currentChoiceRef = useRef(currentChoice);
  currentChoiceRef.current = currentChoice;

  // 最终结算逻辑
  const finalizeResult = useCallback((result, choice) => {
    const isCriticalSuccess = result.successLevel === 'critical';
    const isCriticalFail    = result.successLevel === 'fumble';
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
      const baseInv  = choice.investigationValue || 0;
      const bonusInv = isCriticalSuccess ? 10 : 0;
      if (baseInv + bonusInv > 0) addInvestigation(baseInv + bonusInv);
    }
    setRollResult({ ...result, isCriticalSuccess, isCriticalFail });
    setResolved(true);
  }, [takeDamage, burnSanity, addClue, addInvestigation]);

  // 掷骰结果处理：失败进入博弈缓冲区
  const handleResult = useCallback((result) => {
    const choice = currentChoiceRef.current;
    if (!choice || resolvedRef.current) return;
    resolvedRef.current = true;
    setPhase('game'); // 退出投骰过渡界面
    if (result.success) {
      finalizeResult(result, choice);
    } else {
      setPendingResult({ result, choice });
    }
  }, [finalizeResult]);

  // 逆天改命：燃烧 SAN，骰点 -10（CoC 百分骰越低越好）
  const handleDefyFate = useCallback(() => {
    if (!pendingResult) return;
    const { result, choice } = pendingResult;
    burnSanity(10);
    setDefyFlash(true);
    setTimeout(() => setDefyFlash(false), 600);
    // 百分骰：降低点数 = 更容易成功
    const boostedTotal = Math.max(1, result.total - 10);
    const threshold = difficulty === 5 ? Math.floor(skillValue/5) : difficulty === 2 ? Math.floor(skillValue/2) : skillValue;
    const success = boostedTotal <= threshold;
    const successLevel = boostedTotal === 1 ? 'critical' : success ? (boostedTotal <= Math.floor(skillValue/5) ? 'extreme' : boostedTotal <= Math.floor(skillValue/2) ? 'hard' : 'success') : 'failure';
    const boosted = { ...result, total: boostedTotal, success, successLevel,
      isCriticalSuccess: successLevel === 'critical', isCriticalFail: false };
    setPendingResult(null);
    finalizeResult(boosted, choice);
  }, [pendingResult, burnSanity, finalizeResult, skillValue, difficulty]);

  // 接受命运
  const handleAcceptFate = useCallback(() => {
    if (!pendingResult) return;
    const { result, choice } = pendingResult;
    setPendingResult(null);
    finalizeResult(result, choice);
  }, [pendingResult, finalizeResult]);

  const handleBurnSanity = useCallback((amt) => burnSanity(amt), [burnSanity]);

  const [bridge2, setBridge2] = useState(false); // CH2→CH3 桥接弹窗

  const handleNextNode = useCallback(() => {
    const nextId = getNextNodeId(nodeId);
    if (!nextId) {
      setEnding(determineEnding(gameState));
      return;
    }
    if (nodeId === CH1_LAST) { setBridge(true); return; }
    if (nodeId === CH2_LAST) { setBridge2(true); return; }
    resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, [nodeId, gameState]);

  const handleEnterCh2 = useCallback(() => {
    const nextId = getNextNodeId(CH1_LAST);
    setBridge(false); resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, []);

  const handleEnterCh3 = useCallback(() => {
    const nextId = getNextNodeId(CH2_LAST);
    setBridge2(false); resolvedRef.current = false;
    setNodeId(nextId); setChoiceIdx(0); setRollResult(null); setResolved(false);
  }, []);

  const handleRestart = useCallback(() => {
    resolvedRef.current = false; restore();
    setNodeId(ALL_ORDER[0]); setChoiceIdx(0); setRollResult(null);
    setResolved(false); setBridge(false); setBridge2(false); setPendingResult(null); setEnding(null);
    setPhase('creation');
  }, [restore]);

  if (!scene) return null;
  const panelState = { hp: gameState.hp, san, discovery: inv, clues: gameState.clues, isAlive: gameState.isAlive, isSane: gameState.isSane };

  // ── 投骰过渡界面 ──
  if (phase === 'rolling') {
    const diffLabel = difficulty === 5 ? '极难' : difficulty === 2 ? '困难' : '常规';
    const attrLabel = { STR:'体魄', DEX:'敏锐', POW:'意志', EDU:'学识', CHA:'魅力' };
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ fontFamily:"'Noto Serif SC','Playfair Display',Georgia,serif", background:'#060a07' }}>
        {/* 背景光晕 */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage:`radial-gradient(ellipse at 50% 50%, ${accentColor}12 0%, transparent 65%)`,
        }} />
        <div className="relative w-full max-w-lg flex flex-col items-center gap-8 animate-fade-slide">
          {/* 顶部标签 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-mono tracking-[0.4em] uppercase" style={{color:`${accentColor}66`}}>{chapterMeta.title} · 第 {localIndex} 关</p>
            <div className="h-px w-32" style={{background:`linear-gradient(90deg, transparent, ${accentColor}44, transparent)`}} />
          </div>

          {/* 选项确认卡 */}
          <div className="w-full panel p-5 flex flex-col gap-3" style={{border:`1px solid ${accentColor}33`}}>
            <p className="text-xs font-mono tracking-widest uppercase" style={{color:`${accentColor}88`}}>行动确认</p>
            <p className="text-pale/90 text-sm leading-relaxed">{currentChoice?.label}</p>
            <div className="flex gap-4 mt-1">
              <span className="text-xs font-mono px-2 py-0.5 border" style={{color:accentColor, borderColor:`${accentColor}44`}}>
                {attrLabel[scene.attribute] ?? scene.attribute} {skillValue}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 border" style={{
                color: difficulty===5?'#c084fc':difficulty===2?'#60a5fa':'#4ade80',
                borderColor: difficulty===5?'rgba(192,132,252,0.3)':difficulty===2?'rgba(96,165,250,0.3)':'rgba(74,222,128,0.3)'
              }}>{diffLabel}检定</span>
              <span className="text-xs font-mono text-ghost/40">需 ≤{difficulty===5?Math.floor(skillValue/5):difficulty===2?Math.floor(skillValue/2):skillValue}</span>
            </div>
          </div>

          {/* 骰子 */}
          <div className="w-full panel p-8">
            <DiceRoller
              skillValue={skillValue}
              difficulty={difficulty}
              onResult={handleResult}
              onBurnSanity={handleBurnSanity}
              sanity={san}
              disabled={false}
            />
          </div>

          {/* 返回按钮 */}
          <button
            className="text-xs font-mono text-ghost/25 hover:text-ghost/50 transition-colors tracking-widest"
            onClick={() => { resolvedRef.current = false; setPhase('game'); }}
          >← 返回重新选择</button>
        </div>
      </div>
    );
  }

  if (phase === 'creation') {
    return <CharacterCreation onStart={handleStartGame} />;
  }

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
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setShowChangelog(false)}>
          <div className="panel p-8 max-w-lg w-full mx-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
            style={{ border:'1px solid rgba(181,146,26,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-widest text-pale" style={{ fontFamily:"'Playfair Display',serif" }}>更新日志</h2>
              <span className="text-xs font-mono px-2 py-0.5 border" style={{ color:'#b5921a', borderColor:'rgba(181,146,26,0.3)' }}>{VERSION}</span>
            </div>
            <div className="w-full h-px bg-brass/20" />
            {CHANGELOG.map((entry, i) => (
              <div key={entry.version} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-black font-mono text-sm" style={{ color: i===0?'#b5921a':'rgba(255,255,255,0.4)' }}>{entry.version}</span>
                  <span className="text-xs text-ghost/40 font-mono">{entry.date}</span>
                  <span className="text-xs text-pale/60 font-bold">{entry.title}</span>
                  {i===0 && <span className="text-xs px-1.5 py-0.5 font-mono" style={{ background:'rgba(181,146,26,0.15)', color:'#b5921a', border:'1px solid rgba(181,146,26,0.3)' }}>LATEST</span>}
                </div>
                <ul className="flex flex-col gap-1 pl-3">
                  {entry.changes.map((c, j) => (
                    <li key={j} className="text-xs text-pale/60 flex items-start gap-2">
                      <span className="text-brass/40 mt-0.5">◈</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                {i < CHANGELOG.length - 1 && <div className="w-full h-px bg-white/5 mt-1" />}
              </div>
            ))}
            <button className="btn-roll w-full mt-2" onClick={() => setShowChangelog(false)}>关闭</button>
          </div>
        </div>
      )}
      {ending && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"><div className="panel p-10 max-w-lg text-center flex flex-col items-center gap-5" style={{ border: '1px solid rgba(255,255,255,0.15)' }}><p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: ending.type==='success'?'#60a5fa':ending.type==='failure'?'#f87171':'#c084fc' }}>{ending.type==='success'?'── 成功结局 ──':ending.type==='failure'?'── 失败结局 ──':'── 隐藏结局 ──'}</p><h2 className="text-3xl font-black tracking-widest" style={{ fontFamily:"'Playfair Display',serif", color: ending.type==='success'?'#60a5fa':ending.type==='failure'?'#f87171':'#c084fc' }}>{ending.title}</h2><div className="w-full h-px my-2 bg-white/10" /><p className="text-pale/80 text-sm leading-loose">{ending.desc}</p><div className="w-full h-px my-2 bg-white/10" /><p className="text-ghost/40 text-xs font-mono">SAN {san} / 100 · 调查度 {inv}% · 线索 {gameState.clues.length} 条</p><button className="btn-roll w-full mt-2" onClick={handleRestart}>重新调查</button></div></div>)}
      {pendingResult && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"><div className="panel p-8 max-w-md text-center flex flex-col items-center gap-4" style={{ border: '1px solid rgba(239,68,68,0.4)' }}><p className="text-xs font-mono tracking-widest uppercase text-red-400">── 骰子调查员特色 ──</p><h3 className="text-xl font-black text-pale" style={{ fontFamily:"'Playfair Display',serif" }}>{pendingResult.result.successLevel === 'fumble' ? '☠ 大失败 · 命运已定' : '命运的裂缝'}</h3><p className="text-pale/70 text-sm leading-relaxed">你掷出了 <span className={`font-bold ${pendingResult.result.successLevel === 'fumble' ? 'text-red-500' : 'text-red-400'}`}>{String(pendingResult.result.total).padStart(2,'0')}</span>，技能值 <span className="font-bold" style={{color:accentColor}}>{skillValue}</span>（需 ≤{difficulty===5?Math.floor(skillValue/5):difficulty===2?Math.floor(skillValue/2):skillValue}）。{pendingResult.result.successLevel !== 'fumble' && <span>超出 <span className="text-red-400 font-bold">{pendingResult.result.total - (difficulty===5?Math.floor(skillValue/5):difficulty===2?Math.floor(skillValue/2):skillValue)}</span> 点。</span>}</p>{pendingResult.result.successLevel === 'fumble' && <p className="text-red-500/70 text-xs italic">大失败——命运不允许任何挣扎，逆天改命已被封印。</p>}<div className="w-full flex flex-col gap-3 mt-2"><button onClick={handleDefyFate} disabled={san<=10 || pendingResult.result.successLevel === 'fumble'}
                className="w-full px-4 py-3 text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor:'rgba(239,68,68,0.5)',color:'#f87171',background:'rgba(239,68,68,0.08)' }}>{pendingResult.result.successLevel === 'fumble' ? '🔒 逆天改命已封印（大失败）' : '🔥 燃烧理智（-10 SAN）· 骰点 -10 · 逆天改命'}</button><button onClick={handleAcceptFate} className="w-full px-4 py-3 text-sm border transition-all" style={{ borderColor:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)' }}>接受命运 · 承担失败后果</button></div>{san<=10&&pendingResult.result.successLevel!=='fumble'&&<p className="text-red-400/60 text-xs">理智已不足，无法再燃烧。</p>}</div></div>)}
      {bridge && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"><div className="panel p-10 max-w-lg text-center flex flex-col items-center gap-5" style={{ border:'1px solid rgba(96,165,250,0.3)' }}><p className="text-5xl">🌊</p><h2 className="text-2xl font-black tracking-widest" style={{ fontFamily:"'Playfair Display',serif",color:'#60a5fa' }}>✦ 第一章完结 ✦</h2><p className="text-pale/50 text-sm">线索 {gameState.clues.length} 条 · 调查度 {inv}% · SAN {san} / 100</p><div className="w-full h-px bg-blue-900/30" /><p className="text-pale/80 text-sm leading-loose italic">三个月后，你收到了米娅·科斯塔的来信。<br/>她写道：「它又亮了。我在那里。请来。」<br/>你的调查还没有结束。</p><button className="btn-roll w-full" style={{ borderColor:'rgba(96,165,250,0.5)',color:'#60a5fa' }} onClick={handleEnterCh2}>进入第二章：归来的灯光 →</button></div></div>)}
      {bridge2 && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"><div className="panel p-10 max-w-lg text-center flex flex-col items-center gap-5" style={{ border:'1px solid rgba(248,113,113,0.3)' }}><p className="text-5xl">🔴</p><h2 className="text-2xl font-black tracking-widest" style={{ fontFamily:"'Playfair Display',serif",color:'#f87171' }}>✦ 第二章完结 ✦</h2><p className="text-pale/50 text-sm">线索 {gameState.clues.length} 条 · 调查度 {inv}% · SAN {san} / 100</p><div className="w-full h-px bg-red-900/30" /><p className="text-pale/80 text-sm leading-loose italic">一个月后，奥斯本教授出现了。<br/>他说：「霍利斯还活着。封印协议存在。」<br/>「但你只有三十天。」</p><button className="btn-roll w-full" style={{ borderColor:'rgba(248,113,113,0.5)',color:'#f87171' }} onClick={handleEnterCh3}>进入第三章：深渊之眼 →</button></div></div>)}
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
            <button
              onClick={toggleMute}
              className="text-xs tracking-widest font-mono border px-3 py-1.5 transition-all duration-200"
              style={muted
                ? { borderColor:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.25)' }
                : { borderColor:'rgba(96,165,250,0.3)', color:'rgba(96,165,250,0.7)' }}
              title={muted ? '取消静音' : '静音'}
            >{muted ? '🔇' : '🔊'}</button>
            <button
              onClick={() => setDevMode(v => !v)}
              className="text-xs tracking-widest uppercase font-mono border px-3 py-1.5 transition-all duration-200"
              style={devMode
                ? { borderColor:'rgba(96,165,250,0.5)', color:'#60a5fa', background:'rgba(96,165,250,0.08)' }
                : { borderColor:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.25)' }}
              title="开发者模式：关闭打字机效果"
            >{devMode ? '⚡ DEV' : 'DEV'}</button>
          </div>
        </div>
      </header>
      <main className="relative max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_320px_1fr] gap-4">

          {/* ── 左栏：状态面板 ── */}
          <aside className="flex flex-col gap-3">
            <StatPanel gameState={panelState} sceneTitle={chapterMeta.title} />
          </aside>

          {/* ── 中栏：场景图 ── */}
          <div className="flex flex-col gap-3">
            <div className="scene-frame flex flex-col">
              {/* 场景图占位区 */}
              <div className="scene-image-area flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="text-5xl opacity-20" style={{color:accentColor}}>⬡</span>
                  <p className="text-xs font-mono text-ghost/20 tracking-widest uppercase">Scene Illustration</p>
                  <p className="text-xs font-mono text-ghost/15 tracking-widest">{chapterMeta.location}</p>
                </div>
              </div>
              {/* 场景元数据 */}
              <div className="scene-meta px-4 py-3 border-t" style={{borderColor:'rgba(255,255,255,0.05)'}}>
                <p className="text-xs font-mono tracking-widest uppercase mb-0.5" style={{color:accentColor}}>{chapterMeta.atmosphere}</p>
                <p className="text-xs text-ghost/40 font-mono">{chapterMeta.location} · {chapterMeta.year}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-px" style={{background:`linear-gradient(90deg, ${accentColor}44, transparent)`}} />
                  <span className="text-xs font-mono text-ghost/30">{localIndex} / {isChapter2 ? CHAPTER2_SCENE_ORDER.length : CHAPTER1_SCENE_ORDER.length}</span>
                </div>
              </div>
            </div>

            {/* 骰子区已移至投骰过渡界面 */}
          </div>

          {/* ── 右栏：剧情 + 选项 ── */}
          <div className="flex flex-col gap-4">
            {/* 章节标题条 */}
            <div className="flex items-center gap-3 px-4 py-2 border-b" style={{borderColor:'rgba(255,255,255,0.05)'}}>
              <span className="text-xl font-black" style={{color:`${accentColor}66`, fontFamily:"'Playfair Display',serif"}}>§</span>
              <div>
                <h2 className="text-sm font-black text-pale/80 tracking-wide" style={{fontFamily:"'Playfair Display',serif"}}>{chapterMeta.title} · 第 {localIndex} 关</h2>
              </div>
            </div>

            <NarrativeBox scene={scene} result={rollResult&&resolved?rollResult:null} glitch={glitchSevere}
              instant={devMode}
              onContinue={resolved&&!isLastNode&&!isGameOver?handleNextNode:null} />

            {/* 选项选择器 */}
            {!resolved&&currentNode?.options?.length>0&&(
              <div className="flex flex-col gap-2">
                <p className="text-xs tracking-widest uppercase text-ghost/40 font-mono px-1">选择行动</p>
                {currentNode.options.map((opt,i)=>{
                  const attrKey = ATTR_KEY_MAP[opt.attribute] || opt.attribute;
                  const attrVal = attrs[attrKey] ?? 0;
                  const required = opt.requiredValue ?? 0;
                  const isLocked = attrVal < required;
                  // 非 DEV 模式下隐藏不满足条件的选项
                  if (isLocked && !devMode) return null;
                  const diffLabel = opt.difficulty === 5 ? '极难' : opt.difficulty === 2 ? '困难' : '常规';
                  const attrLabel = { STR:'体魄', DEX:'敏锐', POW:'意志', EDU:'学识', CHA:'魅力' };
                  return (
                    <button key={i} onClick={()=>!isLocked&&setChoiceIdx(i)}
                      className={['text-left px-4 py-3 text-sm border transition-all duration-200 option-btn',
                        choiceIdx===i&&!isLocked?'option-btn--active':'',
                        isLocked?'opacity-40 cursor-not-allowed':''].join(' ')}
                      style={choiceIdx===i&&!isLocked?{borderColor:`${accentColor}66`,background:`${accentColor}0d`,color:'#e8dcc8'}:{}}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span>
                          <span className="font-mono text-xs mr-2 opacity-60" style={{color:isLocked?'#666':accentColor}}>{i+1}.</span>
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {isLocked && (
                            <span className="text-xs font-mono px-1.5 py-0.5 border" style={{color:'#666',borderColor:'#333'}}>
                              🔒 {attrLabel[attrKey]}{required}
                            </span>
                          )}
                          {!isLocked && (
                            <span className="text-xs font-mono" style={{color:
                              opt.difficulty===5?'rgba(192,132,252,0.6)':
                              opt.difficulty===2?'rgba(96,165,250,0.6)':'rgba(74,222,128,0.5)'
                            }}>{attrLabel[attrKey]} {attrVal} · {diffLabel}</span>
                          )}
                          {opt.investigationValue&&!isLocked&&(
                            <span className="text-xs opacity-40" style={{color:'#60a5fa'}}>+{opt.investigationValue}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {/* 确认行动按钮 */}
                <button
                  className="btn-roll w-full mt-1 py-3 tracking-widest"
                  onClick={() => setPhase('rolling')}
                  style={{ borderColor: accentColor + '88', color: accentColor }}
                >
                  ✦ 确认行动 · 开始检定
                </button>
              </div>
            )}
            {/* 单选项时也显示确认按钮 */}
            {!resolved&&currentNode?.options?.length===1&&(
              <button
                className="btn-roll w-full py-3 tracking-widest"
                onClick={() => setPhase('rolling')}
                style={{ borderColor: accentColor + '88', color: accentColor }}
              >
                ✦ 开始检定
              </button>
            )}

            {resolved&&isLastNode&&!isGameOver&&(
              <div className="panel p-6 border text-center animate-fade-slide" style={{borderColor:accentBorder}}>
                <p className="text-lg font-bold tracking-widest" style={{fontFamily:"'Playfair Display',serif",color:accentColor}}>✦ 调查完结 ✦</p>
                <p className="text-pale/50 text-sm mt-2">线索 {gameState.clues.length} 条 · 调查度 {inv}% · SAN {san}</p>
                <button className="btn-roll mt-4 w-48" onClick={()=>setEnding(determineEnding(gameState))}>查看结局</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="relative border-t border-emerald-900/10 mt-8 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-ghost/20 tracking-widest font-mono uppercase hidden sm:block">Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn</p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setShowChangelog(true)}
              className="text-xs font-mono border px-2 py-1 transition-all hover:border-brass/40 hover:text-brass/60"
              style={{ borderColor:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.2)' }}
              title="查看版本更新说明"
            >{VERSION}</button>
            <button
              onClick={handleRestart}
              className="text-xs font-mono border px-3 py-1 transition-all hover:border-red-900/50 hover:text-red-400/60"
              style={{ borderColor:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.2)' }}
            >重新开始</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
