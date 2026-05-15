// ─────────────────────────────────────────────────────────────────
// Placeholder data for the six non-occupational-health subjects.
// Each block assigns to its registered `dataVar` and uses
// `makePlaceholderData` to keep the shape identical to OH_SITE_DATA.
// To replace with real content: keep the same shape; you can either
// (a) keep using makePlaceholderData with richer chapter defs, or
// (b) assign a hand-crafted object identical in shape to OH_SITE_DATA.
// ─────────────────────────────────────────────────────────────────

(function () {
  const R = window.SUBJECTS_REGISTRY;
  const find = (slug) => R.find(s => s.slug === slug);
  const build = window.makePlaceholderData;

  window.TOX_SITE_DATA = build(find('toxicology'), [
    { title: '绪论', points: [
      { title: '毒理学的概念与任务', freq: 2 },
      { title: '毒物、毒性、毒作用', freq: 1 },
    ]},
    { title: '外源化学物的生物转运', points: [
      { title: '吸收、分布、排泄', freq: 2 },
      { title: '血脑屏障 / 胎盘屏障', freq: 1 },
    ]},
    { title: '外源化学物的生物转化', points: [
      { title: 'I 相反应（氧化、还原、水解）', freq: 1 },
      { title: 'II 相反应（结合反应）', freq: 1 },
    ]},
    { title: '毒作用机制', points: [
      { title: '终毒物与靶分子', freq: 1 },
    ]},
    { title: '化学致癌、致畸与致突变', points: [
      { title: '化学致癌物的分类与机制', freq: 2 },
      { title: '致畸作用的敏感期', freq: 1 },
    ]},
    { title: '毒理学安全性评价与风险评估', points: [
      { title: '风险评估的四步法', freq: 1 },
    ]},
  ]);

  window.EPI_SITE_DATA = build(find('epidemiology'), [
    { title: '绪论与基本概念', points: [
      { title: '流行病学的定义与任务', freq: 2 },
      { title: '三大常用指标：发病率/患病率/死亡率', freq: 1 },
    ]},
    { title: '描述性研究', points: [
      { title: '横断面研究', freq: 1 },
      { title: '生态学研究与个案调查', freq: 1 },
    ]},
    { title: '队列研究', points: [
      { title: '相对危险度（RR）与归因危险度（AR）', freq: 2 },
      { title: '前瞻性队列研究的实施', freq: 1 },
    ]},
    { title: '病例对照研究', points: [
      { title: 'OR 值的计算与解读', freq: 2 },
      { title: '匹配与混杂的控制', freq: 1 },
    ]},
    { title: '实验流行病学', points: [
      { title: '随机对照试验（RCT）设计要点', freq: 1 },
    ]},
    { title: '偏倚、混杂与因果推断', points: [
      { title: '选择偏倚 / 信息偏倚 / 混杂', freq: 1 },
      { title: 'Bradford-Hill 因果推断准则', freq: 1 },
    ]},
  ]);

  window.ENV_SITE_DATA = build(find('environmental-health'), [
    { title: '环境健康学绪论', points: [
      { title: '环境与健康的基本关系', freq: 1 },
    ]},
    { title: '大气环境与健康', points: [
      { title: 'PM2.5 与心肺健康效应', freq: 2 },
      { title: '大气污染的主要来源与种类', freq: 1 },
    ]},
    { title: '水环境与健康', points: [
      { title: '饮用水卫生标准与水污染', freq: 1 },
    ]},
    { title: '土壤环境与健康', points: [
      { title: '土壤重金属污染与健康', freq: 1 },
    ]},
    { title: '室内环境与健康', points: [
      { title: '室内空气污染与病态建筑综合征', freq: 1 },
    ]},
    { title: '环境健康风险评估', points: [
      { title: '风险评估的基本框架', freq: 1 },
    ]},
  ]);

  window.NUTR_SITE_DATA = build(find('nutrition-food-hygiene'), [
    { title: '营养学基础', points: [
      { title: '能量代谢与膳食能量推荐摄入量', freq: 1 },
      { title: '宏量营养素：蛋白质 / 脂类 / 碳水化合物', freq: 2 },
    ]},
    { title: '维生素与矿物质', points: [
      { title: '脂溶性 vs 水溶性维生素', freq: 1 },
      { title: '常见矿物质的生理功能与缺乏症', freq: 1 },
    ]},
    { title: '特殊人群营养', points: [
      { title: '孕妇与乳母营养', freq: 1 },
      { title: '婴幼儿、老年人营养', freq: 1 },
    ]},
    { title: '公共营养', points: [
      { title: '膳食指南与平衡膳食宝塔', freq: 1 },
    ]},
    { title: '食品卫生学', points: [
      { title: '食品的细菌污染与腐败变质', freq: 2 },
      { title: '食物中毒：细菌性 / 化学性 / 有毒动植物', freq: 1 },
    ]},
    { title: '食品安全管理', points: [
      { title: 'HACCP 体系与食品安全监管', freq: 1 },
    ]},
  ]);

  window.PSY_SITE_DATA = build(find('psychiatry'), [
    { title: '精神病学绪论', points: [
      { title: '精神障碍的概念与分类', freq: 1 },
    ]},
    { title: '精神症状学', points: [
      { title: '感知障碍：幻觉与错觉', freq: 1 },
      { title: '思维障碍：妄想与思维形式障碍', freq: 2 },
      { title: '情感与意志行为障碍', freq: 1 },
    ]},
    { title: '心境障碍', points: [
      { title: '抑郁障碍：诊断与治疗要点', freq: 2 },
      { title: '双相情感障碍', freq: 1 },
    ]},
    { title: '焦虑及相关障碍', points: [
      { title: '广泛性焦虑 / 惊恐障碍', freq: 1 },
    ]},
    { title: '精神分裂症', points: [
      { title: '阳性 / 阴性症状', freq: 1 },
      { title: '抗精神病药物的分类', freq: 1 },
    ]},
    { title: '器质性精神障碍', points: [
      { title: '谵妄与痴呆', freq: 1 },
    ]},
  ]);

  window.OD_SITE_DATA = build(find('occupational-disease'), [
    { title: '职业病学概论', points: [
      { title: '职业病的定义与法定职业病分类', freq: 2 },
      { title: '职业病诊断与鉴定程序', freq: 1 },
    ]},
    { title: '尘肺', points: [
      { title: '矽肺的发病机制与临床分期', freq: 2 },
      { title: '煤工尘肺与石棉肺', freq: 1 },
    ]},
    { title: '职业中毒', points: [
      { title: '铅、汞、镉慢性中毒的临床特征', freq: 2 },
      { title: '有机磷农药急性中毒处理', freq: 1 },
    ]},
    { title: '物理因素职业病', points: [
      { title: '噪声聋 / 手臂振动病 / 中暑', freq: 1 },
    ]},
    { title: '职业性肿瘤与皮肤病', points: [
      { title: '常见职业性致癌物与靶器官', freq: 1 },
    ]},
    { title: '职业病三级预防', points: [
      { title: '工程控制、个人防护与健康监护', freq: 1 },
    ]},
  ]);
})();
