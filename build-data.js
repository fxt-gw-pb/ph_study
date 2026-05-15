#!/usr/bin/env node
// Parses 知识仓库/职业卫生学往年题考点整理.md into structured data.json.
// Run: node build-data.js

const fs = require('fs');
const path = require('path');

const MD_PATH = path.resolve(__dirname, '知识仓库', '职业卫生学往年题考点整理.md');
const OUT_PATH = path.resolve(__dirname, 'data.json');

const CHAPTER_NUM_TO_ID = {
  '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,
  '九':9,'十':10,'十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,
};

function parse(md) {
  const lines = md.split(/\r?\n/);
  const chapters = [];
  let curCh = null;
  let curKP = null;
  let mode = null; // 'excerpt' | 'questions' | null
  let buf = [];

  function flushBuf() {
    if (!curKP || !mode) { buf = []; return; }
    if (mode === 'excerpt') {
      curKP.excerpt = buf.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    } else if (mode === 'questions') {
      // Parse 【...】blocks; each followed by question text until next 【 or blank-line group end.
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chapter heading: ## 第X章 标题
    const chMatch = line.match(/^##\s+第([一二三四五六七八九十]+)章\s+(.+?)\s*$/);
    if (chMatch) {
      flushBuf();
      mode = null;
      curKP = null;
      const num = chMatch[1];
      const id = CHAPTER_NUM_TO_ID[num] || chapters.length + 1;
      curCh = {
        id,
        num,
        title: chMatch[2].replace(/（[^）]*）$/, '').trim(),
        rawTitle: chMatch[2].trim(),
        points: [],
      };
      chapters.push(curCh);
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

    // **考频：X 次**
    const freqMatch = line.match(/^\*\*考频[：:]\s*(\d+)\s*次\*\*\s*$/);
    if (freqMatch) {
      flushBuf();
      mode = null;
      curKP.freq = parseInt(freqMatch[1], 10);
      continue;
    }

    // **对应小节：** ...
    const secMatch = line.match(/^\*\*对应小节[：:]\*\*\s*(.+?)\s*$/);
    if (secMatch) {
      flushBuf();
      mode = null;
      curKP.section = secMatch[1].trim();
      continue;
    }

    // **匹配依据：** ...
    const basisMatch = line.match(/^\*\*匹配依据[：:]\*\*\s*(.+?)\s*$/);
    if (basisMatch) {
      flushBuf();
      mode = null;
      curKP.basis = basisMatch[1].trim();
      continue;
    }

    // **知识点原文摘取：**
    if (/^\*\*知识点原文摘取[：:]\*\*\s*$/.test(line)) {
      flushBuf();
      mode = 'excerpt';
      continue;
    }

    // **对应往年题：**
    if (/^\*\*对应往年题[：:]\*\*\s*$/.test(line)) {
      flushBuf();
      mode = 'questions';
      continue;
    }

    // Separator
    if (/^---\s*$/.test(line)) {
      flushBuf();
      mode = null;
      continue;
    }

    // Body content
    if (mode) {
      buf.push(line);
    }
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

  // Build a flat list of past questions tagged with KP info, for the exercises view.
  const allQuestions = [];
  for (const ch of chapters) {
    for (const p of ch.points) {
      for (const q of p.questions) {
        // Try to extract a year tag like "24" / "21" from the source.
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

  const totals = {
    chapters: chapters.length,
    points: chapters.reduce((s, c) => s + c.points.length, 0),
    questions: allQuestions.length,
    hiFreqPoints: chapters.reduce((s, c) => s + c.hi, 0),
  };

  return { meta: totals, chapters, allQuestions };
}

const md = fs.readFileSync(MD_PATH, 'utf8');
const data = parse(md);
fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));

// Also emit a JS file that assigns window.SITE_DATA, so the site can be
// opened directly via file:// without a local server (fetch is blocked there).
const SITE_JS = path.resolve(__dirname, 'site-data.js');
fs.writeFileSync(SITE_JS,
  '// Auto-generated by build-data.js — do not edit by hand.\n' +
  'window.SITE_DATA = ' + JSON.stringify(data) + ';\n');

console.log(`Wrote ${OUT_PATH}`);
console.log(`Wrote ${SITE_JS}`);
console.log(`Chapters: ${data.meta.chapters}, knowledge points: ${data.meta.points}, past questions: ${data.meta.questions}, hi-freq points: ${data.meta.hiFreqPoints}`);
for (const ch of data.chapters) {
  console.log(`  第${ch.num}章 ${ch.title} — ${ch.points.length} pts / ${ch.totalQuestions} qs / peak ${ch.peak}`);
}
