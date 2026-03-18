// 版本信息文件
// 每次发布前更新此文件，版本号会自动同步到网页 header

export const VERSION = 'v0.3.1';

export const CHANGELOG = [
  {
    version: 'v0.3.1',
    date: '2026-03-18',
    title: '音频与稳定性',
    changes: [
      '新增 BGM 系统：normal / sanlow 双轨自动切换',
      '新增静音按钮，支持淡入淡出',
      '修复低 SAN 时 glitch 特效导致浏览器超载的问题',
      '所有 glitch 动画改为纯 transform，移除 filter repaint',
      '逆天改命动效：RGB 色散闪屏（纯 transform/opacity 实现）',
    ],
  },
  {
    version: 'v0.3.0',
    date: '2026-03-18',
    title: '核心玩法重构',
    changes: [
      '引入调查度系统（investigationProgress 0-100）',
      '实装博弈缓冲区：掷骰失败后弹出「命运的裂缝」弹窗',
      '核心特色：燃烧理智（-10 SAN）骰点 +3 逆天改命',
      '大成功（d20=20）：额外 +10 调查度，金色光晕',
      '大失败（d20=1）：逆天改命封印，深红光晕',
      '实装 10 种结局判定矩阵（SAN × 调查度 × 线索）',
      '修复调查度字段不关联（discovery vs inv）',
      '新增开发者模式：一键关闭打字机效果',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2026-03-17',
    title: '第二章上线',
    changes: [
      '新增第二章「归来的灯光」（关卡 6-10）',
      '章节过渡画面：HP/SAN/线索完整继承',
      '米娅·科斯塔剧情线索延续（因果关系）',
      '调整布局：剧情文本 → 行动选择 → 骰子',
    ],
  },
  {
    version: 'v0.1.0',
    date: '2026-03-17',
    title: '初始发布',
    changes: [
      '第一章「诅咒的灯塔」完整五关',
      '克苏鲁神话世界观，爱德华·霍珀画风',
      '理智值系统（SAN）与生命值（HP）',
      '打字机文字效果与 Glitch 特效',
      '线索收集系统',
    ],
  },
];
