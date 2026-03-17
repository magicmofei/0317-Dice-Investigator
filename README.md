# 骰子调查员 · Dice Investigator

> 克苏鲁神话风格的掷骰叙事游戏 · 1923年，阿卡姆

---

## 启动方式

```bash
# 1. 安装依赖（首次克隆后执行一次）
npm install

# 2. 启动开发服务器（热更新）
npm run dev
# 默认地址：http://localhost:5173

# 3. 构建生产版本
npm run build

# 4. 本地预览生产构建
npm run preview
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 18 + Vite 5 |
| 样式 | Tailwind CSS 3 |
| 语言 | JavaScript (ES Module) |
| 构建 | Vite |

---

## 文件架构

```
0317-Dice-Investigator/
│
├── public/
│   ├── favicon.svg          # 网站图标
│   └── icons.svg            # 通用图标素材
│
├── src/
│   ├── assets/              # 静态资源（图片等）
│   │   └── hero.png
│   │
│   ├── components/          # UI 组件
│   │   ├── DiceRoller.jsx   # 掷骰核心组件：骰子动画、DC判定、燃烧理智
│   │   ├── NarrativeBox.jsx # 叙事文本框：展示场景描述与成功/失败结果
│   │   └── StatPanel.jsx    # 角色状态面板：HP、SAN值、线索列表
│   │
│   ├── data/                # 游戏数据层
│   │   ├── scenes.js        # 现有场景数据（序章 + 4个场景）
│   │   └── chapter1_lighthouse.js  # 第一章：诅咒的灯塔（5个关卡）
│   │
│   ├── hooks/               # 自定义 React Hooks
│   │   ├── useGameState.js  # 游戏核心状态管理（HP/SAN/场景/线索）
│   │   └── useGlitch.js     # 理智崩溃时的故障视觉效果
│   │
│   ├── App.jsx              # 根组件：游戏主循环、场景调度、结局判定
│   ├── App.css              # 全局样式（glitch动效、panel样式等）
│   ├── index.css            # Tailwind 基础注入 + CSS变量定义
│   └── main.jsx             # React 入口挂载点
│
├── index.html               # HTML 模板
├── vite.config.js           # Vite 配置
├── tailwind.config.js       # Tailwind 主题配置（自定义颜色：parchment/ghost/brass等）
├── postcss.config.js        # PostCSS 配置
├── package.json             # 依赖与脚本
└── README.md                # 本文件
```

---

## 游戏核心机制

- **掷骰判定**：每个场景有固定 DC 值，玩家掷 1d20，结果 ≥ DC 为成功
- **燃烧理智**：消耗 SAN 值换取骰点加成，理智归零则游戏结束
- **双轨结局**：每个场景有独立的成功/失败叙事文本与后续场景分支
- **线索系统**：成功通过场景可获得线索道具，记录于状态面板
- **故障视效**：SAN < 40 触发轻度 glitch，SAN < 20 触发重度扭曲效果

---

## 数据结构规范

### scenes.js（现有格式）

```js
{
  id: 'sceneId',
  title: '场景标题',
  location: '地点',
  year: '年份',
  description: '场景叙事文本',
  atmosphere: '氛围标签',
  dc: 12,                        // 判定难度
  clue_on_success: '线索名称',   // 成功时获得的线索
  success: ['成功文本段落...'],   // 数组，支持多段
  failure: ['失败文本段落...'],
  next_on_success: 'nextSceneId',
  next_on_failure: 'nextSceneId',
}
```

### chapter1_lighthouse.js（新增章节格式）

```js
{
  id: 1,                         // 关卡编号
  text: '叙事描述',
  options: [
    {
      label: '选项名',
      attribute: '判定类型',      // 感知 / 意志 / 学识 / 体魄 / 敏锐
      dc: 10,                    // 难度值
      onSuccess: '成功后续文本',
      onFailure: '失败后果文本',
    }
  ]
}
```

---

## 更新日志

### v0.1.0 · 2026-03-17
- 初始化项目，基于 React + Vite + Tailwind
- 实现掷骰核心循环（`DiceRoller` + `useGameState`）
- 完成序章及4个场景数据（`scenes.js`）
- 新增第一章「诅咒的灯塔」5关卡数据（`chapter1_lighthouse.js`）
  - 关卡1：抵达灯塔外围（感知/意志，DC 10/8）
  - 关卡2：值班室遗留物调查（学识/敏锐，DC 12/10）
  - 关卡3：无源运转的机械室（体魄/学识，DC 13/11）
  - 关卡4：失语幸存者米娅·科斯塔（学识/意志，DC 11/9）
  - 关卡5：霍利斯遗留的控制台抉择（学识/意志，DC 14/16，三分支结局）

---

## 待办 / 后续计划

- [ ] 将 `chapter1_lighthouse.js` 接入游戏主循环（`App.jsx`）
- [ ] 将 `chapter2_wetikon.js` + `useChapterState.js` 接入游戏主循环
- [ ] 实现多选项分支 UI（`chapter2` 格式支持多选项）
- [ ] 实现 `even_only` 骰子机制（节点7：必须掷偶数）
- [ ] 实现 `humidity` 骰子打滑视觉反馈
- [ ] 实现 `corruptedText` 乱码注入（san < 30 或 humidity ≥ 70）
- [ ] 实现「新神结局」UI 崩溃特效（满屏6点）
- [ ] 添加道具栏 UI，展示收集到的线索道具
- [ ] 音效与背景音乐层
- [ ] 存档/读档功能（localStorage）

---

## 第一章设计文档：《湿润的圣像画》

### 基本信息

| 项目 | 内容 |
|------|------|
| 章节文件 | `src/data/chapter2_wetikon.js` |
| 状态 Hook | `src/hooks/useChapterState.js` |
| 地点 | 马萨诸塞州 · 黑潮镇（Blacktide） |
| 年份 | 1923年，十一月 |
| 节点数 | 10个 |
| 结局数 | 4个 |

### 新增数值机制

| 数值 | 范围 | 说明 |
|------|------|------|
| `discovery` 调查度 | 0–100 | ≥ 80 才能开启真相结局 |
| `humidity` 潮湿感 | 0–100 | ≥ 40 时骰子打滑（-1~-2）；≥ 70 时显示幻象文本 |
| `sanCap` SAN上限 | 0–100 | 喝下祭司液体后永久 -10 |
| `drankLiquid` | bool | 影响结局判定与 DC 难度 |

### 三条核心支线

**支线 A · 苦行僧之路**（意志与信仰判定）
- 节点2：圣像画渗水 → 【擦拭】敏捷 DC12 / 【祈祷】意志 DC13
- 成功擦拭获得「洋流坐标」，是真相结局的关键线索

**支线 B · 禁忌的解剖**（体力与工具判定）
- 节点3：不明物种鱼尸 → 【切开】体魄 DC16
- 燃烧理智强行成功 → 发现哥哥的结婚戒指，触发个人叙事线
- 腹部搏动频率是摩尔斯电码，解码得「WARS」→ 海底裂缝坐标

**支线 C · 沉默的祭典**（社交与伪装判定）
- 节点4：混入夜间仪式 → 敏锐 DC13
- 节点5：祭司递上液体 → 【喝】无需掷骰（sanCap -10，DC全程 -3）/ 【拒绝】敏捷 DC14

### 10个逻辑节点一览

| ID | 标题 | 支线 | 关键判定 | DC |
|----|------|------|----------|----|
| node_01 | 抵达黑潮镇 | 入口 | 感知 / 学识 | 9/11 |
| node_02 | 渗水的圣像 | A | 敏捷 / 意志 | 12/13 |
| node_03 | 禁忌的解剖 | B | 体魄 / 学识 | 16/10 |
| node_04 | 沉默的祭典 | C | 敏锐 / 感知 | 13/11 |
| node_05 | 祭司的馈赠 | C | 敏捷（拒绝时）| 14 |
| node_06 | 镇长的密室 | 汇聚 | 学识 / 敏锐 | 14/11 |
| node_07 | 潮汐门 | 汇聚 | 敏捷（必须偶数）| 12 |
| node_08 | 育儿囊 | 汇聚 | 意志 | 15/18 |
| node_09 | 归还的代价 | 结局分叉 | 意志 | 16 |
| node_10 | 最后一掷 | 结局触发 | 各结局条件 | — |

### 4个结局达成条件

| 结局 | 条件 |
|------|------|
| 平凡的疯子 | san = 0，discovery < 50 |
| 灯塔守护者 | discovery ≥ 80，未喝液体 |
| 新神之声 | discovery ≥ 90，san < 20，已喝液体 |
| 绝望的解药 | discovery = 100，san ≥ 50 |

### 隐藏谜题系统

**文本藏字密码**：节点1-6的场景描述中，每个节点各有一个故意拼错的英文单词，其首字母依次构成：`B-L-A-C-K-T` → `BLACKTIDE`（解药的真名）

| 节点 | 错误单词 | 正确单词 | 首字母 |
|------|----------|----------|--------|
| 01 | Brime | Brine | B |
| 02 | Liment | Lament | L |
| 03 | Anotomy | Anatomy | A |
| 04 | Currint | Current | C |
| 05 | Knowlidge | Knowledge | K |
| 06 | Threshhold | Threshold | T |

**骰子双关**：节点7必须掷出偶数。若玩家燃烧理智将奇数变偶数，触发「扭曲因果」剧情，获得【因果裂痕】道具，并在结局文本中留下痕迹。

---

## 更新日志

### v0.2.0 · 第一章完整设计
- 新增 `src/data/chapter2_wetikon.js`：第一章《湿润的圣像画》完整10节点数据
  - 三条支线（苦行僧/解剖/祭典）
  - 四种结局（疯子/灯塔/新神/解药）
  - 10个内嵌谜题（文字藏字 + 摩尔斯 + 数学 + 逻辑推理）
  - 隐藏坐标密码：BLACKTIDE → 42°N · 70°W
- 新增 `src/hooks/useChapterState.js`：章节专属状态管理
  - 调查度（discovery）/ 潮湿感（humidity）/ SAN上限（sanCap）
  - 骰子打滑机制（humidity ≥ 40）
  - 幻象/乱码注入机制（san < 30 或 humidity ≥ 70）
  - `applyChoiceResult` 统一处理成功/失败/燃烧理智三种分支
- 修复 `useGlitch.js` → 重命名为 `useGlitch.jsx`（JSX语法报错）

### v0.1.0 · 2026-03-17
- 初始化项目，基于 React + Vite + Tailwind
- 实现掷骰核心循环（`DiceRoller` + `useGameState`）
- 完成序章及4个场景数据（`scenes.js`）
- 新增「法尔角灯塔」5关卡数据（`chapter1_lighthouse.js`）
