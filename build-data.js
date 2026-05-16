#!/usr/bin/env node
// Parses the past-exam markdown in 知识仓库/ into structured data files.
// Run: node build-data.js
//
// Each TARGET produces a <json> (structured) and a <js> (window.<varName>
// assignment so the site runs from file:// without a fetch). Both are
// committed so the site needs no Node toolchain on the deploy target.

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname);
const SRC = path.join(REPO, '知识仓库');

const TARGETS = [
  // Occupational Health — the original site data (legacy window.SITE_DATA).
  { md: '职业卫生学往年题考点整理.md', json: 'data.json',    js: 'site-data.js', varName: 'SITE_DATA' },
  // Toxicology — second real subject (window.TOX_SITE_DATA). Its excerpts are
  // long unbroken blocks; break them at sentence terminators for readability.
  { md: '毒理学往年题考点整理.md',     json: 'tox-data.json', js: 'tox-data.js',  varName: 'TOX_SITE_DATA', breakExcerpt: true },
];

const CHAPTER_NUM_TO_ID = {
  '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,
  '九':9,'十':10,'十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,
};

// Chapter titles vary by source:
//   OH:  "绪论" / "职业生理与工效（何丽华）"  → strip a trailing （…） aside.
//   TOX: "/ 《1 绪论》" / "/ 《3 …》（生物转运）" → take the 《…》 inner
//        text (dropping its leading file number), preferring a trailing
//        （中文）gloss when present, and dropping a trailing year.
function cleanChapterTitle(raw) {
  let t = raw.trim().replace(/^[\/／]\s*/, '');
  const m = t.match(/《([^》]+)》/);
  if (m) {
    const inner = m[1].replace(/^\d+\s*/, '').trim();
    const gloss = t.match(/》\s*（([^）]+)）\s*$/);
    t = (gloss ? gloss[1] : inner).trim();
    t = t.replace(/\s*\d{4}\s*$/, '').trim();
  } else {
    t = t.replace(/（[^）]*）\s*$/, '').trim();
  }
  return t;
}

// Insert a line break after every sentence terminator (。！？, plus any
// trailing closing quotes/brackets that belong to it), so long excerpt
// paragraphs read one sentence per line. Operates per existing line so
// paragraph breaks (blank lines) are preserved; the trailing terminator of
// a line gets no extra break.
function breakSentences(text) {
  return text.split('\n').map(seg => {
    if (!seg.trim()) return seg;
    return seg
      .replace(/([。！？]+[”’」』）)】》]*)/g, '$1\n')
      .replace(/\n+$/, '');
  }).join('\n').replace(/\n{3,}/g, '\n\n');
}

function parse(md, opts = {}) {
  const lines = md.split(/\r?\n/);
  const chapters = [];
  let curCh = null;
  let curKP = null;
  let mode = null; // 'excerpt' | 'questions' | null
  let buf = [];

  function flushBuf() {
    if (!curKP || !mode) { buf = []; return; }
    if (mode === 'excerpt') {
      let ex = buf.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      if (opts.breakExcerpt) ex = breakSentences(ex);
      curKP.excerpt = ex;
    } else if (mode === 'questions') {
      // Parse 【...】blocks; each followed by question text until next 【 or end.
      const text = buf.join('\n').trim();
      const blocks = [];
      const re = /【往年题(\d+)[｜|]([^｜|】]+)[｜|]([^】]+)】\s*([\s\S]*?)(?=\n【往年题\d+|$)/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        blocks.push({
          n: parseInt(m[1], 10),
          source: m[2].trim(),
          type: m[3].trim(),
          text: m[4].trim(),
        });
      }
      curKP.questions = blocks;
    }
    buf = [];
  }

  function startChapter(num, rawTitle) {
    flushBuf();
    mode = null;
    curKP = null;
    const id = CHAPTER_NUM_TO_ID[num] || chapters.length + 1;
    curCh = {
      id,
      num,
      title: cleanChapterTitle(rawTitle),
      rawTitle: rawTitle.trim(),
      points: [],
    };
    chapters.push(curCh);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chapter heading: ## 第X章 标题   (OH and TOX both use this)
    const chMatch = line.match(/^##\s+第([一二三四五六七八九十]+)章\s+(.+?)\s*$/);
    if (chMatch) { startChapter(chMatch[1], chMatch[2]); continue; }

    // Appendix section (TOX): ## 附：实验操作题…  — real KPs, treat as a chapter.
    const fuMatch = line.match(/^##\s+(附[：:].*?)\s*$/);
    if (fuMatch && curCh) {
      startChapter('附', fuMatch[1].replace(/^附[：:]\s*/, ''));
      continue;
    }

    // KP heading: ### N. 标题
    const kpMatch = line.match(/^###\s+(\d+)\.\s+(.+?)\s*$/);
    if (kpMatch && curCh) {
      flushBuf();
      mode = null;
      curKP = {
        id: `ch${curCh.id}-${kpMatch[1]}`,
        index: parseInt(kpMatch[1], 10),
        chapterId: curCh.id,
        chapterTitle: curCh.title,
        title: kpMatch[2].trim(),
        freq: 0,
        section: '',
        basis: '',
        excerpt: '',
        questions: [],
      };
      curCh.points.push(curKP);
      continue;
    }

    if (!curKP) continue;

    // **考频：N 次**  (OH)  or  **考频：** N 次 / N 余次（…）  (TOX)
    const freqMatch = line.match(/^\*\*考频[：:]\*{0,2}\s*(\d+)/);
    if (freqMatch) {
      flushBuf(); mode = null;
      curKP.freq = parseInt(freqMatch[1], 10);
      continue;
    }

    // **对应小节：** ...
    const secMatch = line.match(/^\*\*对应小节[：:]\*\*\s*(.+?)\s*$/);
    if (secMatch) {
      flushBuf(); mode = null;
      curKP.section = secMatch[1].trim();
      continue;
    }

    // **匹配依据：** ...
    const basisMatch = line.match(/^\*\*匹配依据[：:]\*\*\s*(.+?)\s*$/);
    if (basisMatch) {
      flushBuf(); mode = null;
      curKP.basis = basisMatch[1].trim();
      continue;
    }

    // **知识来源：** ...   (TOX only — capture so it does not leak into excerpt)
    const srcMatch = line.match(/^\*\*知识来源[：:]\*\*\s*(.+?)\s*$/);
    if (srcMatch) {
      flushBuf(); mode = null;
      curKP.source = srcMatch[1].trim();
      continue;
    }

    // **知识点原文摘取：**
    if (/^\*\*知识点原文摘取[：:]\*\*\s*$/.test(line)) {
      flushBuf(); mode = 'excerpt';
      continue;
    }

    // **对应往年题：**
    if (/^\*\*对应往年题[：:]\*\*\s*$/.test(line)) {
      flushBuf(); mode = 'questions';
      continue;
    }

    // Separator
    if (/^---\s*$/.test(line)) {
      flushBuf(); mode = null;
      continue;
    }

    // Body content
    if (mode) buf.push(line);
  }
  flushBuf();

  // Sort points within each chapter by freq desc, then by index.
  for (const ch of chapters) {
    ch.points.sort((a, b) => b.freq - a.freq || a.index - b.index);
    ch.totalFreq = ch.points.reduce((s, p) => s + p.freq, 0);
    ch.totalQuestions = ch.points.reduce((s, p) => s + p.questions.length, 0);
    ch.peak = ch.points.length ? ch.points[0].freq : 0;
    ch.hi = ch.points.filter(p => p.freq >= 3).length;
  }

  // Flat list of past questions tagged with KP info, for the exercises view.
  const allQuestions = [];
  for (const ch of chapters) {
    for (const p of ch.points) {
      for (const q of p.questions) {
        const yearMatch = q.source.match(/(\d{2,4})\s*[级年]/);
        allQuestions.push({
          ...q,
          year: yearMatch ? yearMatch[1] : '',
          chapterId: ch.id,
          chapterTitle: ch.title,
          pointId: p.id,
          pointTitle: p.title,
          pointFreq: p.freq,
        });
      }
    }
  }

  const meta = {
    chapters: chapters.length,
    points: chapters.reduce((s, c) => s + c.points.length, 0),
    questions: allQuestions.length,
    hiFreqPoints: chapters.reduce((s, c) => s + c.hi, 0),
  };

  return { meta, chapters, allQuestions };
}

for (const t of TARGETS) {
  const mdPath = path.join(SRC, t.md);
  if (!fs.existsSync(mdPath)) {
    console.warn(`SKIP ${t.md} — not found`);
    continue;
  }
  const data = parse(fs.readFileSync(mdPath, 'utf8'), { breakExcerpt: t.breakExcerpt });
  const jsonPath = path.join(REPO, t.json);
  const jsPath = path.join(REPO, t.js);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(jsPath,
    '// Auto-generated by build-data.js — do not edit by hand.\n' +
    `window.${t.varName} = ` + JSON.stringify(data) + ';\n');

  console.log(`${t.md}`);
  console.log(`  → ${t.json}, ${t.js} (window.${t.varName})`);
  console.log(`  chapters: ${data.meta.chapters}, points: ${data.meta.points}, ` +
    `questions: ${data.meta.questions}, hi-freq: ${data.meta.hiFreqPoints}`);
  for (const ch of data.chapters) {
    console.log(`    第${ch.num}章 ${ch.title} — ${ch.points.length} pts / ` +
      `${ch.totalQuestions} qs / peak ${ch.peak}`);
  }
}
