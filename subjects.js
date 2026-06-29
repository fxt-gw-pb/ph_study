// ─────────────────────────────────────────────────────────────────
// Subjects registry — single source of truth for all study subjects.
// Each subject's content data lives on `window[dataVar]` (set by the
// matching data file). 职业卫生学 reuses the legacy `window.SITE_DATA`.
// ─────────────────────────────────────────────────────────────────

(function () {
  const CN_NUM = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];

  window.SUBJECTS_REGISTRY = [
    {
      slug: 'occupational-health',
      title: '职业卫生学',
      en: 'Occupational Health',
      icon: '职',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 04 / 09 / 10 / 11 / 14 / 21 / 24 级往年题整理，按考频从高到低排序。',
      dataVar: 'OH_SITE_DATA',
      accent: '#2d5fd5',
      status: 'ready',
      intro: [
        "基于《职业卫生学知识点总结》PDF 与 04 / 09 / 10 / 11 / 14 / 21 / 24 级往年题整理。同章节内按考频从高到低排序，仅纳入往年题中确实出现过的知识点。",
        "所有章节结构和知识点匹配均基于《职业卫生学知识点总结by17级ybn.pdf》，部分往年题匹配到的知识点有缺失，欢迎勘误和补充。",
      ],
    },
    {
      slug: 'toxicology',
      title: '毒理学',
      en: 'Toxicology',
      icon: '毒',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 07 / 09 / 14 / 15 / 17 / 18 / 19 / 20 / 21 级往年题与 14 节课件整理，按考频从高到低排序。',
      dataVar: 'TOX_SITE_DATA',
      accent: '#0f8a78',
      status: 'ready',
      intro: [
        "基于大礼包毒理学'21级课件(第4节补充18级)'和'往年题'整理",
        "5月21日更新：补充了大礼包'相对久远的总结'中原题库没有的内容",
        "所有章节结构和知识点匹配均基于大礼包'21级课件(第4节补充18级)'，部分往年题匹配到的知识点有缺失，欢迎勘误和补充。",
      ],
    },
    {
      slug: 'epidemiology',
      title: '流行病学',
      en: 'Epidemiology',
      icon: '流',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 04 / 05 / 07 / 10 / 11 / 12 / 14 / 17 / 19 / 20 / 21 级往年题整理，按授课顺序与考频组织。',
      dataVar: 'EPI_SITE_DATA',
      accent: '#b16a2b',
      status: 'ready',
      intro: [
        "基于《流行病学》第 9 版课本知识点与大礼包历年往年题文件整理（04 / 05 / 07 级回忆，10 / 11 / 12 级口试题库，14 / 17 / 19 / 20 / 21 级口试回忆）。",
        "排序依据真实授课顺序；同一章节内按考频从高到低排列。考频按“出现的年级数”计（同一年级内多人重复回忆合并计 1 次），故最大为 11。",
        "知识点正文均摘自课本知识点；仅纳入在往年题中匹配到的考点，部分匹配可能仍有缺失，欢迎勘误与补充。",
      ],
    },
    {
      slug: 'environmental-health',
      title: '环境健康学',
      en: 'Environmental Health',
      icon: '环',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 03 / 04 / 08 / 10 / 11 / 12 / 14 / 18 / 20 / 21 级往年题整理，按章节与考频组织。',
      dataVar: 'ENV_SITE_DATA',
      accent: '#3d8a4f',
      status: 'ready',
      intro: [
        "基于《环境健康学——笔记by徐庆松》PDF 和大礼包环境健康学往年题文件夹整理。",
        "本次将往年题拆分为 280 个题目条目；每个条目均已归入至少一个考点。",
        "知识点正文均摘自《环境健康学——笔记by徐庆松》PDF；未找到明确原文的题目已保留并标记为“未完全匹配到”。",
      ],
    },
    {
      slug: 'nutrition-food-hygiene',
      title: '营养与食品卫生学',
      en: 'Nutrition & Food Hygiene',
      icon: '营',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 04 / 05 / 08 / 09 / 14 / 20 / 21 级往年题整理，按章节与考频组织。',
      dataVar: 'NUTR_SITE_DATA',
      accent: '#c25a26',
      status: 'ready',
      intro: [
        "基于《营养与食品卫生学·18 柯雅蕾笔记》和大礼包「5 往年题」文件夹中全部往年题整理（04 / 05 / 08 / 09 / 14 / 20 / 21 级）。",
        "本次将往年题拆分为 175 个题目条目；每个条目均已归入至少一个考点（含标记为“未完全匹配到”者）。同一章节内按考频从高到低排序。",
        "知识点正文均摘自《营养与食品卫生学·18 柯雅蕾笔记》；未找到明确原文的题目已保留并标记为“未完全匹配到”，欢迎勘误与补充。",
      ],
    },
    {
      slug: 'psychiatry',
      title: '精神病学',
      en: 'Psychiatry',
      icon: '精',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 06-07 / 16 / 20 / 21 级往年题与《精神病学复习整理by18级杨子铭》整理，按考频从高到低排序。',
      dataVar: 'PSY_SITE_DATA',
      accent: '#7a4ec9',
      status: 'ready',
      intro: [
        "基于《精神病学复习整理by18级杨子铭》和「4 往年题」文件夹中 06-07 / 16 / 20 / 21 级往年题整理。",
        "本次将往年题拆分为 104 个题目条目；每个条目均已归入至少一个考点。同一章节内按考频从高到低排序。",
        "知识点正文均摘自《精神病学复习整理by18级杨子铭》；未找到明确原文的题目已保留并标记为「未完全匹配到」，欢迎勘误与补充。",
      ],
    },
    {
      slug: 'occupational-disease',
      title: '职业病学',
      en: 'Occupational Disease',
      icon: '职病',
      subtitle: '往年题考点 · 2026 春',
      blurb: '基于 04 / 05 / 07 / 08 / 14 / 2015-2022 汇总 / 20 / 21 / 22 / 24 级往年题整理，按章节与考频组织。',
      dataVar: 'OD_SITE_DATA',
      accent: '#b6432f',
      status: 'ready',
      intro: [
        "基于《职业病学知识点总结by17级杨贝妮》和职业病学「4 往年题」文件夹中 04 / 05 / 07 / 08 / 14 / 2015-2022 汇总 / 2020 题图 / 2021 级考题 / 2022 参考样题 / 24 年完整试题回忆整理。",
        "本次将往年题按来源与题型拆分为题目条目；一道考题若同时考查多个知识点，会分别归入多个考点。同一章节内按关联题块数量与高频标记排序。",
        "知识点正文主要摘自《职业病学知识点总结by17级杨贝妮》；题源中出现而知识点总结未覆盖或版本不一致者，已标记为“未完全匹配到”或“版本提示”。",
      ],
    },
  ];

  // ── Helpers exposed for the data files to use ────────────────
  window.makePlaceholderData = function makePlaceholderData(subj, chapterDefs) {
    // chapterDefs: [{ title, points: [{ title, freq?, section?, excerpt? }] }]
    const chapters = chapterDefs.map((ch, i) => {
      const id = i + 1;
      const points = (ch.points || []).map((p, j) => ({
        id: `${subj.slug}-ch${id}-${j + 1}`,
        index: j + 1,
        chapterId: id,
        chapterTitle: ch.title,
        title: p.title,
        freq: p.freq || 1,
        section: p.section || `第 ${id} 章 / 占位小节`,
        basis: p.basis || '占位匹配依据（待补充真实考题来源与原文摘取）。',
        excerpt: p.excerpt || '本知识点为占位数据。后续将根据真实教材与往年题进行补充——你可以把此结构作为模板向 SUBJECT 数据文件中填入真实内容。',
        questions: [],
      }));
      const peak = Math.max(1, ...points.map(p => p.freq));
      return {
        id,
        num: CN_NUM[i] || String(id),
        title: ch.title,
        rawTitle: ch.title,
        points,
        totalFreq: points.reduce((a, b) => a + b.freq, 0),
        totalQuestions: 0,
        peak,
        hi: points.filter(p => p.freq >= 3).length,
      };
    });
    const totalPoints = chapters.reduce((a, b) => a + b.points.length, 0);
    return {
      meta: {
        chapters: chapters.length,
        points: totalPoints,
        questions: 0,
        hiFreqPoints: chapters.reduce((a, b) => a + b.hi, 0),
        placeholder: true,
        subjectTitle: subj.title,
      },
      chapters,
      allQuestions: [],
    };
  };

  // Resolve & cache a subject's data
  window.getSubjectData = function (slug) {
    const subj = window.SUBJECTS_REGISTRY.find(s => s.slug === slug);
    if (!subj) return null;
    // Legacy bridge: hand off existing window.SITE_DATA to occupational-health
    if (subj.slug === 'occupational-health' && window.SITE_DATA && !window.OH_SITE_DATA) {
      window.OH_SITE_DATA = window.SITE_DATA;
    }
    return window[subj.dataVar] || null;
  };

  window.getSubject = function (slug) {
    return window.SUBJECTS_REGISTRY.find(s => s.slug === slug) || null;
  };
})();
