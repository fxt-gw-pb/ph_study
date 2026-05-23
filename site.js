// ─────────────────────────────────────────────────────────────────
// Review site app — subject-aware, hash routing, vanilla JS.
// Routes:
//   #/                                   subject hub (picker)
//   #/s/<slug>                           subject home (was the old "home")
//   #/s/<slug>/ch/<id>                   chapter
//   #/s/<slug>/p/<pid>                   knowledge point
//   #/s/<slug>/exercises                 question bank
//   #/s/<slug>/search?q=…                search
// Legacy routes (#/ch/…, #/p/…, #/exercises, #/search) redirect to
// `/s/occupational-health/…` so old URLs keep working.
// ─────────────────────────────────────────────────────────────────

(function () {
  const SUBJECTS = window.SUBJECTS_REGISTRY || [];
  if (!SUBJECTS.length) {
    document.body.innerHTML = '<div style="padding:40px">学科注册表未加载（subjects.js 未引入）。</div>';
    return;
  }

  // ── Subject context (set by loadSubject) ─────────────────────
  let currentSubject = null;
  let D = null;
  let chById = new Map();
  let pointById = new Map();

  function loadSubject(slug) {
    const s = window.getSubject(slug);
    if (!s) return false;
    const data = window.getSubjectData(slug);
    if (!data) return false;
    currentSubject = s;
    D = data;
    chById = new Map(D.chapters.map(c => [c.id, c]));
    pointById = new Map();
    for (const ch of D.chapters) for (const p of ch.points) pointById.set(p.id, p);
    loadMastered();
    return true;
  }

  // ── Mastered marks, namespaced per subject ───────────────────
  function masteredKey() {
    return `oh-review-mastered-v1::${currentSubject ? currentSubject.slug : 'occupational-health'}`;
  }
  let mastered = new Set();
  function loadMastered() {
    mastered = new Set();
    try {
      let raw = localStorage.getItem(masteredKey());
      // legacy migration: occupational-health previously stored under unsuffixed key
      if (!raw && currentSubject && currentSubject.slug === 'occupational-health') {
        const legacy = localStorage.getItem('oh-review-mastered-v1');
        if (legacy) {
          localStorage.setItem(masteredKey(), legacy);
          raw = legacy;
        }
      }
      if (raw) mastered = new Set(JSON.parse(raw));
    } catch (_) {}
  }
  function toggleMastered(pid) {
    if (mastered.has(pid)) mastered.delete(pid); else mastered.add(pid);
    localStorage.setItem(masteredKey(), JSON.stringify([...mastered]));
  }

  // ── Theme ────────────────────────────────────────────────────
  const THEMES = [
    { id: 'light', label: '雅蓝', desc: '默认 · 学术蓝',  swatch: ['#ffffff', '#2d5fd5', '#e8f0ff'] },
    { id: 'paper', label: '护眼', desc: '米黄羊皮纸',     swatch: ['#fbf6e7', '#6c5d2a', '#efe6c2'] },
    { id: 'dark',  label: '深夜', desc: '深色模式',       swatch: ['#161c28', '#6e95ff', '#1c2a4d'] },
  ];
  const THEME_KEY = 'oh-review-theme-v1';
  function getTheme() {
    const t = localStorage.getItem(THEME_KEY);
    return THEMES.some(x => x.id === t) ? t : 'light';
  }
  function setTheme(t) {
    if (!THEMES.some(x => x.id === t)) t = 'light';
    localStorage.setItem(THEME_KEY, t);
    document.body.classList.remove('theme-paper', 'theme-dark', 'theme-butterfly', 'theme-akaza');
    if (t !== 'light') document.body.classList.add('theme-' + t);
    document.body.setAttribute('data-theme', t);
  }
  setTheme(getTheme());

  // ── Routing ──────────────────────────────────────────────────
  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = raw.split('?');
    const segs = pathPart.split('/').filter(Boolean);
    const query = {};
    if (queryPart) {
      for (const kv of queryPart.split('&')) {
        const [k, v] = kv.split('=');
        query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }
    return { segs, query };
  }
  function go(hash) {
    if (location.hash === hash) render(); else location.hash = hash;
  }
  function subjPath(rest) {
    const slug = (currentSubject || SUBJECTS[0]).slug;
    return '#/s/' + slug + (rest || '');
  }

  // ── Util ─────────────────────────────────────────────────────
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function highlight(text, q) {
    if (!q) return escapeHTML(text);
    const safe = escapeHTML(text);
    const tokens = q.split(/\s+/).filter(t => t.length > 0);
    if (!tokens.length) return safe;
    const re = new RegExp('(' + tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }
  function freqClass(n) { return n >= 4 ? 'hi' : (n >= 2 ? 'mid' : 'low'); }
  function freqLabel(n) { return n >= 4 ? '高频' : (n >= 2 ? '中频' : '低频'); }
  function pad2(n) { return String(n).padStart(2, '0'); }

  const REPO = 'fxt-gw-pb/ph_study';
  function errataUrl(p) {
    const ch = chById.get(p.chapterId);
    const subjTitle = currentSubject ? currentSubject.title : '';
    const title = `[勘误·${subjTitle}] 第${pad2(ch.id)}章 · ${p.title}`;
    const body = [
      `**学科：** ${subjTitle}`,
      `**知识点：** 第 ${pad2(ch.id)} 章 ${ch.title} / ${p.title}`,
      `**ID：** \`${p.id}\``,
      `**链接：** ${location.origin}${location.pathname}#/s/${currentSubject.slug}/p/${p.id}`,
      '',
      '---',
      '',
      '## 勘误内容',
      '（请描述发现的问题，例如：知识点匹配错误 / 原文摘取有误 / 往年题归类不当 / 缺失补充等）',
      '',
      '## 建议修改',
      '（如有具体修改建议，请贴在这里）',
    ].join('\n');
    return `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  // ── Render shell ─────────────────────────────────────────────
  function renderShell() {
    document.body.innerHTML = `
      <div class="app">
        <header class="topbar">
          <button class="icon-btn menu-btn" id="menu-btn" aria-label="菜单" title="章节目录">
            <span class="menu-icon"></span>
          </button>
          <div class="brand" id="brand">
            <span class="brand-dot" id="brand-dot">职</span>
            <span class="brand-text" id="brand-text">大四下学期往年题整理</span>
            <span class="brand-sub" id="brand-sub"></span>
          </div>
          <div class="search-box" id="search-box">
            <span aria-hidden="true">⌕</span>
            <input id="search-input" placeholder="搜索知识点 / 往年题 / 关键词…" autocomplete="off"/>
            <span class="kbd">⌘K</span>
          </div>
          <nav id="topnav">
            <a data-nav="home"      id="nav-home">首页</a>
            <a data-nav="exercises" id="nav-ex">题库</a>
            <a data-nav="hub"       id="nav-hub" title="切换学科">学科</a>
          </nav>
          <div class="theme-wrap" id="theme-wrap">
            <button class="icon-btn theme-trigger" id="theme-btn" title="切换主题" aria-haspopup="true" aria-expanded="false">
              <span class="theme-trigger-dot"></span>
            </button>
            <div class="theme-menu" id="theme-menu" role="menu" hidden></div>
          </div>
        </header>
        <div class="main">
          <aside class="sidebar" id="sidebar"></aside>
          <main class="content"><div class="content-inner" id="content"></div></main>
        </div>
        <div class="sidebar-backdrop" id="sidebar-backdrop" aria-hidden="true"></div>
      </div>
      <div id="palette-mount"></div>
    `;

    // ── Brand: go home for current subject (or hub if none) ──
    document.getElementById('brand').onclick = () => {
      if (currentSubject) go(subjPath('')); else go('#/');
    };

    // ── Theme mini-menu ───────────────────────────────────────
    const themeBtn = document.getElementById('theme-btn');
    const themeMenu = document.getElementById('theme-menu');
    function buildThemeMenu() {
      const active = getTheme();
      themeMenu.innerHTML = `
        <div class="theme-menu-head">主题</div>
        ${THEMES.map(t => `
          <button class="theme-item ${active === t.id ? 'active' : ''}" data-theme="${t.id}" role="menuitem">
            <span class="theme-swatch" style="--s1:${t.swatch[0]};--s2:${t.swatch[1]};--s3:${t.swatch[2]}">
              <span></span><span></span><span></span>
            </span>
            <span class="theme-text">
              <span class="theme-label">${t.label}</span>
              <span class="theme-desc">${t.desc}</span>
            </span>
            ${active === t.id ? '<span class="theme-tick">✓</span>' : ''}
          </button>`).join('')}
      `;
      themeMenu.querySelectorAll('.theme-item').forEach(b => {
        b.addEventListener('click', () => {
          setTheme(b.dataset.theme);
          buildThemeMenu();
          // close after a brief beat so user sees the tick move
          setTimeout(closeThemeMenu, 180);
          // refresh brand-dot decoration
          updateBrandDecor();
        });
      });
    }
    function openThemeMenu() {
      buildThemeMenu();
      themeMenu.hidden = false;
      requestAnimationFrame(() => themeMenu.classList.add('open'));
      themeBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick, true);
      document.addEventListener('keydown', onMenuKey, true);
    }
    function closeThemeMenu() {
      themeMenu.classList.remove('open');
      themeBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onMenuKey, true);
      // wait for fade-out
      setTimeout(() => { themeMenu.hidden = true; }, 160);
    }
    function onDocClick(e) {
      if (!e.target.closest('#theme-wrap')) closeThemeMenu();
    }
    function onMenuKey(e) {
      if (e.key === 'Escape') closeThemeMenu();
    }
    themeBtn.onclick = (e) => {
      e.stopPropagation();
      if (themeMenu.classList.contains('open')) closeThemeMenu(); else openThemeMenu();
    };

    // ── Top nav ──────────────────────────────────────────────
    document.getElementById('topnav').addEventListener('click', (e) => {
      const a = e.target.closest('a[data-nav]');
      if (!a) return;
      e.preventDefault();
      const nav = a.dataset.nav;
      if (nav === 'hub') go('#/');
      else if (nav === 'home') {
        if (currentSubject) go(subjPath('')); else go('#/');
      } else if (nav === 'exercises') {
        if (currentSubject) go(subjPath('/exercises')); else go('#/');
      }
    });

    document.getElementById('menu-btn').onclick = (e) => {
      e.stopPropagation();
      document.body.classList.toggle('sidebar-open');
    };
    document.getElementById('sidebar-backdrop').onclick = () => {
      document.body.classList.remove('sidebar-open');
    };

    document.getElementById('search-box').onclick = () => openPalette();

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); openPalette();
      } else if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault(); openPalette();
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });
  }

  function updateBrandDecor() {
    if (!currentSubject) return;
    const dot = document.getElementById('brand-dot');
    if (dot) dot.textContent = currentSubject.icon;
    const txt = document.getElementById('brand-text');
    if (txt) txt.textContent = currentSubject.title + '复习';
    const sub = document.getElementById('brand-sub');
    if (sub) sub.textContent = '· ' + (currentSubject.subtitle.split('·')[0].trim() || '复习');
  }

  function renderSidebar(activeChId) {
    const sb = document.getElementById('sidebar');
    if (!currentSubject || !D) {
      sb.innerHTML = `
        <h4>学科</h4>
        <ol>
          ${SUBJECTS.map(s => `
            <li>
              <a class="ch" data-subj="${s.slug}">
                <span class="ch-num">${s.icon}</span>
                <span class="ch-title">${escapeHTML(s.title)}</span>
                <span class="ch-meta ${s.status === 'placeholder' ? 'placeholder' : ''}">${s.status === 'placeholder' ? '占位' : '·'}</span>
              </a>
            </li>`).join('')}
        </ol>
      `;
      sb.querySelectorAll('a[data-subj]').forEach(a => {
        a.addEventListener('click', () => go('#/s/' + a.dataset.subj));
      });
      return;
    }
    const items = D.chapters.map(c => {
      const lvl = Math.min(5, Math.max(1, Math.round(c.peak)));
      const isActive = c.id === activeChId;
      return `
        <li>
          <a class="ch ${isActive ? 'active' : ''}" data-ch="${c.id}">
            <span class="ch-num">${pad2(c.id)}</span>
            <span class="ch-title">${escapeHTML(c.title)}</span>
            <span class="ch-meta">
              <span class="ch-dot lvl-${lvl}"></span>
              ${c.points.length}
            </span>
          </a>
        </li>`;
    }).join('');
    sb.innerHTML = `
      <div class="sidebar-header">
        <h4>章节 · ${D.chapters.length}</h4>
        <a class="sidebar-back" data-go="hub" title="返回学科选择">← 学科</a>
      </div>
      <ol>${items}</ol>
    `;
    if (!sb.dataset.bound) {
      sb.dataset.bound = '1';
      sb.addEventListener('click', (e) => {
        const back = e.target.closest('.sidebar-back');
        if (back) { go('#/'); return; }
        const a = e.target.closest('a.ch[data-ch]');
        if (a) go(subjPath('/ch/' + a.dataset.ch));
        const s = e.target.closest('a.ch[data-subj]');
        if (s) go('#/s/' + s.dataset.subj);
      });
    }
  }

  // ── Subject Hub (new home) ───────────────────────────────────
  function viewHub() {
    return `
      <div class="hub">
        <div class="hub-head">
          <div class="page-eyebrow">SUBJECTS · 学科选择</div>
          <h1 class="page-title">选择一个学科开始复习</h1>
          <p style="margin:14px 0 0;font-size:18px;font-weight:600;line-height:1.65;color:var(--primary);">如果你觉得有帮助,请在阅读时顺手点点勘误按钮,修正补充知识点与题目解答,或是记忆技巧~</p>
        </div>
        <div class="subj-grid">
          ${SUBJECTS.map((s, i) => {
            const data = window.getSubjectData(s.slug);
            const placeholder = s.status === 'placeholder';
            const meta = data ? data.meta : null;
            return `
              <a class="subj-card ${placeholder ? 'is-placeholder' : 'is-ready'}" data-slug="${s.slug}" style="--accent:${s.accent};--enter-delay:${i * 40}ms">
                <div class="subj-card-head">
                  <span class="subj-icon">${escapeHTML(s.icon)}</span>
                  <span class="subj-status">${placeholder ? '占位 · 待补充' : '已接入 · 真实数据'}</span>
                </div>
                <div class="subj-title-row">
                  <h3 class="subj-title">${escapeHTML(s.title)}</h3>
                  <span class="subj-en">${escapeHTML(s.en)}</span>
                </div>
                <p class="subj-blurb">${escapeHTML(s.blurb)}</p>
                <div class="subj-stats">
                  ${meta ? `
                    <span><b>${meta.chapters}</b>章</span>
                    <span><b>${meta.points}</b>知识点</span>
                    ${meta.questions ? `<span><b>${meta.questions}</b>题</span>` : '<span class="dim">题库待入</span>'}
                  ` : '<span class="dim">尚未接入</span>'}
                </div>
                <div class="subj-cta">
                  <span class="subj-cta-text">${placeholder ? '查看占位结构' : '进入复习'}</span>
                  <span class="subj-cta-arrow">→</span>
                </div>
              </a>`;
          }).join('')}
        </div>
      </div>
    `;
  }
  function attachHubHandlers() {
    document.querySelectorAll('.subj-card[data-slug]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        go('#/s/' + el.dataset.slug);
      });
    });
  }

  // ── Subject Home (per-subject) ───────────────────────────────
  function viewHome() {
    const total = D.meta;
    const isPlaceholder = !!total.placeholder;
    const allPoints = D.chapters.flatMap(c => c.points.map(p => ({ ...p, chapterTitle: c.title })));
    const topPoints = allPoints.sort((a, b) => b.freq - a.freq || a.chapterId - b.chapterId).slice(0, 8);

    return `
      <div class="crumb">
        <a data-go="hub">学科</a>
        <span class="sep">›</span>
        <span>${escapeHTML(currentSubject.title)}</span>
      </div>
      <div class="page-eyebrow">REVIEW · ${escapeHTML(currentSubject.subtitle)}</div>
      <h1 class="page-title">${escapeHTML(currentSubject.title)} · 复习</h1>
      ${isPlaceholder ? `
        <div class="placeholder-banner">
          <span class="placeholder-pill">占位数据</span>
          <span>该学科的章节与知识点为占位结构，便于后续把真实考题/教材内容直接对位填入。</span>
        </div>` : `
        ${(currentSubject.intro || []).map(t => `<p class="page-sub">${escapeHTML(t)}</p>`).join('')}
        <p class="page-sub">每个知识点卡片和详情页右上角已加入"勘误"按钮，点击会在新标签页打开预填好的 GitHub Issue。提交需要 GitHub 账号并登录后才能完成。</p>
      `}

      <div class="stat-row">
        <div class="stat"><div class="v">${total.chapters}</div><div class="k">章节</div></div>
        <div class="stat"><div class="v">${total.points}</div><div class="k">${isPlaceholder ? '占位知识点' : '命中知识点'}</div></div>
        <div class="stat hi"><div class="v">${total.hiFreqPoints}</div><div class="k">高频考点（≥3 次）</div></div>
        <div class="stat"><div class="v">${total.questions}</div><div class="k">${isPlaceholder ? '待入题目' : '往年题条目'}</div></div>
      </div>

      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin:16px 0 8px">
        <h2 style="margin:0;font-size:17px;font-weight:600;">章节速览</h2>
        <span class="muted" style="font-size:12px">点击进入章节复习</span>
      </div>
      <div class="ch-grid">
        ${D.chapters.map(c => {
          const tested = c.points.length;
          const masteredHere = c.points.filter(p => mastered.has(p.id)).length;
          const pct = tested ? masteredHere / tested : 0;
          return `
            <a class="ch-card" data-ch="${c.id}">
              <div>
                <div class="ch-no">第 ${pad2(c.id)} 章</div>
                <div class="ch-name">${escapeHTML(c.title)}</div>
              </div>
              <div class="ch-bar"><span style="width:${Math.round(pct * 100)}%"></span></div>
              <div class="ch-stats">
                <span><b>${c.points.length}</b>知识点</span>
                <span><b>${c.totalQuestions}</b>题</span>
                <span><b>${c.hi}</b>高频</span>
              </div>
            </a>`;
        }).join('')}
      </div>

      ${topPoints.length ? `
        <h2 style="margin:24px 0 10px;font-size:17px;font-weight:600;">${isPlaceholder ? '示例知识点' : '全站高频 Top 8'}</h2>
        <div>
          ${topPoints.map((p, i) => kpCardHTML(p, i + 1, false)).join('')}
        </div>` : ''}
    `;
  }

  function attachHomeHandlers() {
    document.querySelectorAll('.ch-card[data-ch]').forEach(el => {
      el.addEventListener('click', () => go(subjPath('/ch/' + el.dataset.ch)));
    });
    document.querySelectorAll('.crumb a[data-go="hub"]').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); go('#/'); });
    });
    attachKPHandlers();
  }

  function viewChapter(chId) {
    const ch = chById.get(chId);
    if (!ch) return `<div class="empty">未找到第 ${chId} 章。</div>`;

    const peak = ch.peak || 1;
    const heat = ch.points.map((p, i) => {
      const ratio = p.freq / peak;
      const lvl = Math.min(5, Math.max(0, Math.round(ratio * 5)));
      const h = 6 + ratio * 44;
      return `
        <a class="heat-col" href="${subjPath('/p/' + p.id).replace('#','#')}" title="${escapeHTML(p.title)} · ${p.freq} 次">
          <div class="heat-bar" style="height:${h}px;background:var(--heat-${lvl})"></div>
          <span class="lbl">${pad2(i + 1)}</span>
        </a>`;
    }).join('');

    const masteredHere = ch.points.filter(p => mastered.has(p.id)).length;
    const masteredLabel = ch.points.length ? `${masteredHere}/${ch.points.length}` : '0';

    return `
      <div class="crumb">
        <a data-go="hub">学科</a>
        <span class="sep">›</span>
        <a data-go="home">${escapeHTML(currentSubject.title)}</a>
        <span class="sep">›</span>
        <span>第 ${pad2(ch.id)} 章</span>
      </div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap">
        <div style="flex:1;min-width:280px">
          <div class="page-eyebrow">第 ${pad2(ch.id)} 章 · CHAPTER ${ch.id}</div>
          <h1 class="page-title">${escapeHTML(ch.title)}</h1>
          <p class="page-sub">本章共纳入 <strong>${ch.points.length}</strong> 个被往年题命中的知识点，对应 <strong>${ch.totalQuestions}</strong> 道往年题；其中峰值考频为 <strong>${ch.peak}</strong> 次。</p>
        </div>
        <div class="stat-row" style="flex:0 0 auto;grid-template-columns:repeat(3, minmax(80px, 1fr));margin-top:6px;min-width:280px">
          <div class="stat"><div class="v">${ch.points.length}</div><div class="k">知识点</div></div>
          <div class="stat hi"><div class="v">${ch.hi}</div><div class="k">高频</div></div>
          <div class="stat"><div class="v">${masteredLabel}</div><div class="k">已掌握</div></div>
        </div>
      </div>

      ${ch.points.length ? `<div class="heat-strip">
        <div class="heat-strip-head">
          <div class="eyebrow">本章考频热力</div>
          <div class="heat-legend">
            <span>低</span>
            ${[0,1,2,3,4,5].map(l => `<span class="heat-cell" style="background:var(--heat-${l})"></span>`).join('')}
            <span>高</span>
          </div>
        </div>
        <div class="heat-bars">${heat}</div>
      </div>` : ''}

      <div class="tabs" id="ch-tabs">
        <button class="active" data-tab="all">全部 · ${ch.points.length}</button>
        <button data-tab="hi">高频（≥3 次） · ${ch.points.filter(p => p.freq >= 3).length}</button>
        <button data-tab="todo">未掌握 · ${ch.points.filter(p => !mastered.has(p.id)).length}</button>
        <button data-tab="done">已掌握 · ${masteredHere}</button>
      </div>

      <div id="kp-list" class="kp-list">
        ${ch.points.length ? ch.points.map((p, i) => kpCardHTML(p, i + 1, false)).join('') : '<div class="empty">本章暂未从往年题中归入知识点。</div>'}
      </div>
    `;
  }

  function attachChapterHandlers(chId) {
    document.querySelectorAll('.crumb a[data-go]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.go === 'hub') go('#/');
        else if (el.dataset.go === 'home') go(subjPath(''));
      });
    });
    document.querySelectorAll('.heat-col[href]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const href = el.getAttribute('href');
        go(href);
      });
    });
    const ch = chById.get(chId);
    if (!ch) return;
    const tabs = document.getElementById('ch-tabs');
    const list = document.getElementById('kp-list');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-tab]');
        if (!b) return;
        tabs.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        const tab = b.dataset.tab;
        let pts = ch.points;
        if (tab === 'hi') pts = pts.filter(p => p.freq >= 3);
        else if (tab === 'todo') pts = pts.filter(p => !mastered.has(p.id));
        else if (tab === 'done') pts = pts.filter(p => mastered.has(p.id));
        // Quick fade swap
        list.classList.remove('kp-list-enter');
        void list.offsetWidth;
        list.innerHTML = pts.length ? pts.map((p, i) => kpCardHTML(p, i + 1, false)).join('') : '<div class="empty">暂无内容。</div>';
        list.classList.add('kp-list-enter');
        attachKPHandlers();
      });
    }
    attachKPHandlers();
  }

  function viewPoint(pid) {
    const p = pointById.get(pid);
    if (!p) return `<div class="empty">未找到该知识点。</div>`;
    const ch = chById.get(p.chapterId);
    const isMastered = mastered.has(p.id);

    return `
      <div class="crumb">
        <a data-go="hub">学科</a>
        <span class="sep">›</span>
        <a data-go="home">${escapeHTML(currentSubject.title)}</a>
        <span class="sep">›</span>
        <a data-go="ch" data-cid="${ch.id}">第 ${pad2(ch.id)} 章 ${escapeHTML(ch.title)}</a>
        <span class="sep">›</span>
        <span>${escapeHTML(p.title)}</span>
      </div>

      <div class="page-eyebrow">§ ${escapeHTML(p.section.split('/')[0] || '')} · 第 ${pad2(ch.id)} 章</div>
      <h1 class="page-title">${escapeHTML(p.title)}</h1>
      <div style="margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="fchip ${freqClass(p.freq)}">${freqLabel(p.freq)} · 考频 ${p.freq} 次</span>
        <span class="muted" style="font-size:12.5px">关联往年题 ${p.questions.length} 条</span>
        <span style="flex:1"></span>
        <button class="icon-btn" id="mark-btn" style="width:auto;padding:0 12px;color:${isMastered ? 'var(--success)' : 'var(--ink-2)'}">
          ${isMastered ? '✓ 已掌握' : '标记已掌握'}
        </button>
        <a class="icon-btn" id="errata-btn" href="${errataUrl(p)}" target="_blank" rel="noopener" title="提交勘误（打开 GitHub Issue）" style="width:auto;padding:0 12px;text-decoration:none;color:var(--ink-2)">
          ✎ 勘误反馈
        </a>
      </div>

      <div class="card card-pad" style="margin-top:18px">
        <h5 style="margin:0 0 6px;font-size:11px;letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase">对应小节</h5>
        <p class="kp-section section-path" style="background:transparent;padding:0">${escapeHTML(p.section)}</p>
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h5 style="margin:0 0 6px;font-size:11px;letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase">匹配依据</h5>
        <p style="margin:0;font-size:13px;color:var(--ink-2);line-height:1.7">${escapeHTML(p.basis)}</p>
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h5 style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase">知识点原文摘取</h5>
        <p style="margin:0;font-family:var(--font-serif);font-size:var(--read-size, 15px);line-height:var(--read-leading, 1.78);white-space:pre-wrap">${escapeHTML(p.excerpt)}</p>
      </div>

      ${p.questions.length ? `
        <h2 style="margin:28px 0 10px;font-size:17px;font-weight:600">对应往年题 · ${p.questions.length}</h2>
        <div class="q-list">
          ${p.questions.map(q => `
            <div class="q">
              <span class="q-tag">${escapeHTML(q.type)}</span>
              <div>
                <div class="q-text">${escapeHTML(q.text)}</div>
                <span class="q-src">来源：${escapeHTML(q.source)}${q.year ? ` · ${escapeHTML(q.year)}级/年` : ''}</span>
              </div>
            </div>`).join('')}
        </div>
      ` : '<div class="empty" style="margin-top:18px">该知识点尚未关联往年题（占位）。</div>'}
    `;
  }

  function attachPointHandlers(pid) {
    document.querySelectorAll('.crumb a[data-go]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.go === 'hub') go('#/');
        else if (el.dataset.go === 'home') go(subjPath(''));
        else if (el.dataset.go === 'ch') go(subjPath('/ch/' + el.dataset.cid));
      });
    });
    const btn = document.getElementById('mark-btn');
    if (btn) btn.onclick = () => { toggleMastered(pid); render(); };
  }

  function viewExercises(query) {
    const all = D.allQuestions || [];
    const yearF = query.year || '';
    const typeF = query.type || '';
    const chF = query.ch ? Number(query.ch) : 0;

    const years = [...new Set(all.map(q => q.year).filter(Boolean))].sort();
    function baseType(t) {
      if (/名解|名词解释/.test(t)) return '名解';
      if (/单选|单项选择/.test(t)) return '单选';
      if (/多选|多项选择/.test(t)) return '多选';
      if (/简答/.test(t)) return '简答';
      if (/论述/.test(t)) return '论述';
      if (/应用|案例/.test(t)) return '应用/案例';
      if (/填空/.test(t)) return '填空';
      if (/实验操作/.test(t)) return '实验操作';
      if (/口试/.test(t)) return '口试';
      if (/复习题|附录/.test(t)) return '其他';
      return '其他';
    }
    const baseTypes = ['名解', '单选', '多选', '简答', '论述', '应用/案例', '填空', '实验操作', '口试', '其他'];

    let list = all.slice();
    if (yearF) list = list.filter(q => q.year === yearF);
    if (typeF) list = list.filter(q => baseType(q.type) === typeF);
    if (chF) list = list.filter(q => q.chapterId === chF);

    return `
      <div class="crumb">
        <a data-go="hub">学科</a>
        <span class="sep">›</span>
        <a data-go="home">${escapeHTML(currentSubject.title)}</a>
        <span class="sep">›</span>
        <span>题库</span>
      </div>
      <div class="page-eyebrow">EXERCISES · 往年题库</div>
      <h1 class="page-title">题库 · ${all.length} 条</h1>
      ${all.length ? `
        <p class="page-sub">所有从往年题中匹配到的题目，按知识点对齐。点击题目右侧链接跳转到对应知识点详情。</p>
      ` : `
        <div class="placeholder-banner" style="margin-top:14px">
          <span class="placeholder-pill">占位</span>
          <span>该学科尚未接入题库数据；待补充。</span>
        </div>
      `}

      ${all.length ? `
        <div class="filters">
          <span class="label">年份</span>
          <button class="${!yearF ? 'active' : ''}" data-f="year" data-v="">全部</button>
          ${years.map(y => `<button class="${yearF === y ? 'active' : ''}" data-f="year" data-v="${y}">${y}</button>`).join('')}
        </div>
        <div class="filters">
          <span class="label">题型</span>
          <button class="${!typeF ? 'active' : ''}" data-f="type" data-v="">全部</button>
          ${baseTypes.map(t => `<button class="${typeF === t ? 'active' : ''}" data-f="type" data-v="${t}">${t}</button>`).join('')}
        </div>
        <div class="filters">
          <span class="label">章节</span>
          <button class="${!chF ? 'active' : ''}" data-f="ch" data-v="">全部</button>
          ${D.chapters.map(c => `<button class="${chF === c.id ? 'active' : ''}" data-f="ch" data-v="${c.id}">${pad2(c.id)} ${escapeHTML(c.title)}</button>`).join('')}
        </div>

        <div class="muted" style="margin:0 0 10px;font-size:12px">命中 ${list.length} 条</div>

        <div class="q-list kp-list-enter">
          ${list.length ? list.map(q => `
            <div class="q" style="grid-template-columns: 60px auto 1fr">
              <span class="q-tag" style="background:var(--bg-sunken);color:var(--ink-2);font-weight:600">${escapeHTML(q.year || '–')}</span>
              <span class="q-tag">${escapeHTML(q.type)}</span>
              <div>
                <div class="q-text">${escapeHTML(q.text)}</div>
                <span class="q-src">
                  <a data-pid="${q.pointId}" style="cursor:pointer;color:var(--primary)">→ ${escapeHTML(q.pointTitle)}</a>
                  · 第 ${pad2(q.chapterId)} 章 · 来源 ${escapeHTML(q.source)}
                </span>
              </div>
            </div>`).join('') : '<div class="empty">暂无匹配题目。</div>'}
        </div>
      ` : ''}
    `;
  }

  function attachExercisesHandlers() {
    document.querySelectorAll('.crumb a[data-go]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.go === 'hub') go('#/');
        else if (el.dataset.go === 'home') go(subjPath(''));
      });
    });
    document.querySelectorAll('.filters button[data-f]').forEach(b => {
      b.addEventListener('click', () => {
        const r = parseRoute();
        const next = { ...r.query };
        if (b.dataset.v) next[b.dataset.f] = b.dataset.v;
        else delete next[b.dataset.f];
        const qs = Object.entries(next).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        go(subjPath('/exercises' + (qs ? '?' + qs : '')));
      });
    });
    document.querySelectorAll('.q a[data-pid]').forEach(a => {
      a.addEventListener('click', (e) => { e.preventDefault(); go(subjPath('/p/' + a.dataset.pid)); });
    });
  }

  function viewSearch(q) {
    const term = (q || '').trim();
    if (!term) return `
      <div class="crumb">
        <a data-go="hub">学科</a>
        <span class="sep">›</span>
        <a data-go="home">${escapeHTML(currentSubject.title)}</a>
        <span class="sep">›</span>
        <span>搜索</span>
      </div>
      <div class="page-eyebrow">SEARCH</div><h1 class="page-title">搜索</h1><p class="muted">请在上方输入关键词。</p>`;

    const lower = term.toLowerCase();
    const ptHits = [];
    for (const p of pointById.values()) {
      const hay = (p.title + ' ' + p.section + ' ' + p.basis + ' ' + p.excerpt).toLowerCase();
      if (hay.includes(lower)) ptHits.push(p);
    }
    const qHits = (D.allQuestions || []).filter(x => (x.text + ' ' + x.source + ' ' + x.type).toLowerCase().includes(lower));
    const chHits = D.chapters.filter(c => c.title.toLowerCase().includes(lower));

    return `
      <div class="crumb">
        <a data-go="hub">学科</a>
        <span class="sep">›</span>
        <a data-go="home">${escapeHTML(currentSubject.title)}</a>
        <span class="sep">›</span>
        <span>搜索 "${escapeHTML(term)}"</span>
      </div>
      <div class="page-eyebrow">SEARCH · ${escapeHTML(currentSubject.title)}</div>
      <h1 class="page-title">搜索 "${escapeHTML(term)}"</h1>
      <p class="muted" style="margin-top:6px;font-size:12.5px">命中：知识点 ${ptHits.length} · 往年题 ${qHits.length} · 章节 ${chHits.length}</p>

      ${chHits.length ? `
        <div class="search-result-grp">
          <h3>章节</h3>
          <div class="ch-grid">
            ${chHits.map(c => `
              <a class="ch-card" data-ch="${c.id}">
                <div>
                  <div class="ch-no">第 ${pad2(c.id)} 章</div>
                  <div class="ch-name">${highlight(c.title, term)}</div>
                </div>
                <div class="ch-stats"><span><b>${c.points.length}</b>知识点</span><span><b>${c.totalQuestions}</b>题</span></div>
              </a>`).join('')}
          </div>
        </div>` : ''}

      ${ptHits.length ? `
        <div class="search-result-grp">
          <h3>知识点 · ${ptHits.length}</h3>
          ${ptHits.slice(0, 30).map((p, i) => kpCardHTML(p, i + 1, false, term)).join('')}
        </div>` : ''}

      ${qHits.length ? `
        <div class="search-result-grp">
          <h3>往年题 · ${qHits.length}</h3>
          <div class="q-list">
            ${qHits.slice(0, 40).map(qq => `
              <div class="q" style="grid-template-columns: 60px auto 1fr">
                <span class="q-tag" style="background:var(--bg-sunken);color:var(--ink-2);font-weight:600">${escapeHTML(qq.year || '–')}</span>
                <span class="q-tag">${escapeHTML(qq.type)}</span>
                <div>
                  <div class="q-text">${highlight(qq.text, term)}</div>
                  <span class="q-src">
                    <a data-pid="${qq.pointId}" style="cursor:pointer;color:var(--primary)">→ ${escapeHTML(qq.pointTitle)}</a>
                    · 第 ${pad2(qq.chapterId)} 章 · ${escapeHTML(qq.source)}
                  </span>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

      ${(!chHits.length && !ptHits.length && !qHits.length) ? '<div class="empty">没有找到匹配项。</div>' : ''}
    `;
  }
  function attachSearchHandlers() {
    document.querySelectorAll('.crumb a[data-go]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.go === 'hub') go('#/');
        else if (el.dataset.go === 'home') go(subjPath(''));
      });
    });
    document.querySelectorAll('.ch-card[data-ch]').forEach(el => {
      el.addEventListener('click', () => go(subjPath('/ch/' + el.dataset.ch)));
    });
    document.querySelectorAll('.q a[data-pid]').forEach(a => {
      a.addEventListener('click', (e) => { e.preventDefault(); go(subjPath('/p/' + a.dataset.pid)); });
    });
    attachKPHandlers();
  }

  // ── Knowledge-point card (used in chapter / home / search views) ──
  function kpCardHTML(p, idx, expanded, hl) {
    const klass = freqClass(p.freq);
    const isMastered = mastered.has(p.id);
    return `
      <div class="kp ${klass} ${expanded ? 'expanded' : ''}" data-pid="${p.id}">
        <div class="kp-head">
          <div class="kp-num">${pad2(idx)}</div>
          <div>
            <div class="kp-title">${highlight(p.title, hl)}</div>
            <div class="kp-meta">
              <span class="fchip ${klass}">${p.freq} 次</span>
              <span class="dim">小节</span>
              <span class="sec">${escapeHTML(p.section.split('/').slice(-1)[0].slice(0, 30))}</span>
              <span class="dim">·</span>
              <span><span class="dim">第 ${pad2(p.chapterId)} 章</span> ${escapeHTML(chById.get(p.chapterId).title)}</span>
              <span class="dim">·</span>
              <span><span class="dim">关联题</span> <strong>${p.questions.length}</strong></span>
              ${isMastered ? '<span class="fchip" style="background:var(--success-bg);color:var(--success);box-shadow:inset 0 0 0 1px var(--success)">已掌握</span>' : ''}
            </div>
          </div>
          <div class="kp-actions">
            <button data-act="toggle" title="${isMastered ? '取消掌握' : '标记掌握'}" class="${isMastered ? 'on' : ''}">${isMastered ? '✓' : '○'}</button>
            <button data-act="errata" title="提交勘误（打开 GitHub Issue）">勘误</button>
            <button data-act="open">阅读 →</button>
          </div>
        </div>
        <div class="kp-body" style="display:${expanded ? 'block' : 'none'}">
          <div class="kp-section">
            <div>
              <h5>匹配依据</h5>
              <p class="basis">${highlight(p.basis, hl)}</p>
            </div>
            <div>
              <h5>知识点原文摘取</h5>
              <p class="excerpt">${highlight(p.excerpt, hl)}</p>
            </div>
            ${p.questions.length ? `
              <div>
                <h5>对应往年题 · ${p.questions.length}</h5>
                <div class="q-list">
                  ${p.questions.map(q => `
                    <div class="q">
                      <span class="q-tag">${escapeHTML(q.type)}</span>
                      <div>
                        <div class="q-text">${highlight(q.text, hl)}</div>
                        <span class="q-src">${escapeHTML(q.source)}</span>
                      </div>
                    </div>`).join('')}
                </div>
              </div>` : ''}
          </div>
        </div>
      </div>`;
  }

  function attachKPHandlers() {
    document.querySelectorAll('.kp').forEach(el => {
      const pid = el.dataset.pid;
      const head = el.querySelector('.kp-head');
      head.addEventListener('click', (e) => {
        const actBtn = e.target.closest('button[data-act]');
        if (actBtn) {
          e.stopPropagation();
          if (actBtn.dataset.act === 'toggle') { toggleMastered(pid); render(); }
          else if (actBtn.dataset.act === 'open') { go(subjPath('/p/' + pid)); }
          else if (actBtn.dataset.act === 'errata') { window.open(errataUrl(pointById.get(pid)), '_blank', 'noopener'); }
          return;
        }
        const body = el.querySelector('.kp-body');
        const open = body.style.display !== 'block';
        body.style.display = open ? 'block' : 'none';
        el.classList.toggle('expanded', open);
      });
    });
  }

  // ── Command palette ─────────────────────────────────────────
  function openPalette() {
    const mount = document.getElementById('palette-mount');
    const subjLabel = currentSubject ? `· ${currentSubject.title}` : '· 所有学科';
    mount.innerHTML = `
      <div class="palette-veil" id="veil">
        <div class="palette" onclick="event.stopPropagation()">
          <div class="palette-head">
            <span style="color:var(--ink-3)">⌕</span>
            <input id="palette-input" placeholder="搜索知识点 / 往年题 / 章节 / 学科…" autocomplete="off"/>
            <span class="palette-scope">${subjLabel}</span>
            <span class="kbd">Esc</span>
          </div>
          <div class="palette-list" id="palette-list">
            <div class="palette-empty">输入关键词开始搜索</div>
          </div>
        </div>
      </div>
    `;
    const input = document.getElementById('palette-input');
    input.focus();
    document.getElementById('veil').addEventListener('click', closePalette);
    input.addEventListener('input', () => updatePaletteResults(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        if (currentSubject) {
          closePalette();
          go(subjPath('/search?q=' + encodeURIComponent(input.value.trim())));
        }
      }
    });
  }
  function closePalette() {
    const m = document.getElementById('palette-mount');
    if (m) m.innerHTML = '';
  }
  function updatePaletteResults(term) {
    const list = document.getElementById('palette-list');
    if (!list) return;
    term = term.trim();
    if (!term) { list.innerHTML = '<div class="palette-empty">输入关键词开始搜索</div>'; return; }
    const lower = term.toLowerCase();
    const hits = [];
    // Subject matches first (always available)
    for (const s of SUBJECTS) {
      if (s.title.toLowerCase().includes(lower) || s.en.toLowerCase().includes(lower)) {
        hits.push({ kind: 's', item: s });
        if (hits.length >= 4) break;
      }
    }
    if (currentSubject && D) {
      for (const p of pointById.values()) {
        const hay = (p.title + ' ' + p.section + ' ' + p.excerpt).toLowerCase();
        if (hay.includes(lower)) hits.push({ kind: 'p', item: p });
        if (hits.length >= 14) break;
      }
      if (hits.length < 14) {
        for (const c of D.chapters) {
          if (c.title.toLowerCase().includes(lower)) hits.push({ kind: 'c', item: c });
          if (hits.length >= 14) break;
        }
      }
    }
    if (!hits.length) {
      list.innerHTML = `<div class="palette-empty">没有匹配${currentSubject ? '，按 Enter 进入完整搜索' : ''}</div>`;
      return;
    }
    list.innerHTML = hits.map((h) => {
      if (h.kind === 's') {
        return `
          <a class="palette-item" data-go="#/s/${h.item.slug}">
            <span class="q-tag" style="margin-top:1px">学科</span>
            <span style="font-size:13.5px;color:var(--ink-1)">${highlight(h.item.title, term)} <span style="color:var(--ink-4);font-size:11.5px">· ${escapeHTML(h.item.en)}</span></span>
          </a>`;
      }
      if (h.kind === 'p') {
        const ch = chById.get(h.item.chapterId);
        return `
          <a class="palette-item" data-go="${subjPath('/p/' + h.item.id)}">
            <span class="fchip ${freqClass(h.item.freq)}" style="margin-top:1px">${h.item.freq}</span>
            <span style="flex:1;min-width:0">
              <span style="display:block;font-size:13.5px;color:var(--ink-1);line-height:1.45">${highlight(h.item.title, term)}</span>
              <span style="display:block;font-size:11px;color:var(--ink-3);margin-top:2px">第 ${pad2(ch.id)} 章 ${escapeHTML(ch.title)}</span>
            </span>
          </a>`;
      }
      return `
        <a class="palette-item" data-go="${subjPath('/ch/' + h.item.id)}">
          <span class="q-tag" style="margin-top:1px">章节</span>
          <span style="font-size:13.5px;color:var(--ink-1)">第 ${pad2(h.item.id)} 章 · ${highlight(h.item.title, term)}</span>
        </a>`;
    }).join('');
    list.querySelectorAll('a[data-go]').forEach(a => {
      a.addEventListener('click', () => { closePalette(); go(a.dataset.go); });
    });
  }

  // ── Render ──────────────────────────────────────────────────
  function render() {
    const r = parseRoute();
    let segs = r.segs;
    if (!document.getElementById('content')) renderShell();

    // Legacy redirects: /ch/X, /p/X, /exercises, /search → occupational-health
    if (segs.length && segs[0] !== 's' && segs[0] !== 'hub') {
      if (['ch','p','exercises','search'].includes(segs[0])) {
        location.replace('#/s/occupational-health/' + segs.join('/') + (r.query && Object.keys(r.query).length
          ? '?' + Object.entries(r.query).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
          : ''));
        return;
      }
    }

    // Determine view: hub or subject?
    let view = 'hub';
    let subjectSlug = null;
    let innerSegs = [];
    if (segs[0] === 's' && segs[1]) {
      subjectSlug = segs[1];
      innerSegs = segs.slice(2);
      view = 'subject';
    }

    // Hub view
    if (view !== 'subject') {
      currentSubject = null; D = null; chById = new Map(); pointById = new Map();
      document.body.classList.add('view-hub');
      document.body.classList.remove('view-subject');
      const html = viewHub();
      paintContent(html, () => attachHubHandlers());
      renderSidebar(null);
      // nav active state
      setNavActive('hub');
      updateBrandShellForHub();
      return;
    }

    // Subject view — load it
    const ok = loadSubject(subjectSlug);
    if (!ok) {
      // unknown subject → back to hub
      location.replace('#/');
      return;
    }
    document.body.classList.add('view-subject');
    document.body.classList.remove('view-hub');
    updateBrandDecor();

    let activeChId = null;
    let html = '';
    if (innerSegs.length === 0) {
      html = viewHome();
    } else if (innerSegs[0] === 'ch' && innerSegs[1]) {
      activeChId = Number(innerSegs[1]);
      html = viewChapter(activeChId);
    } else if (innerSegs[0] === 'p' && innerSegs[1]) {
      const p = pointById.get(innerSegs[1]);
      activeChId = p ? p.chapterId : null;
      html = viewPoint(innerSegs[1]);
    } else if (innerSegs[0] === 'exercises') {
      html = viewExercises(r.query);
    } else if (innerSegs[0] === 'search') {
      html = viewSearch(r.query.q || '');
    } else {
      html = viewHome();
    }

    paintContent(html, () => {
      if (innerSegs.length === 0) attachHomeHandlers();
      else if (innerSegs[0] === 'ch') attachChapterHandlers(activeChId);
      else if (innerSegs[0] === 'p') attachPointHandlers(innerSegs[1]);
      else if (innerSegs[0] === 'exercises') attachExercisesHandlers();
      else if (innerSegs[0] === 'search') attachSearchHandlers();
    });
    renderSidebar(activeChId);
    document.body.classList.remove('sidebar-open');
    setNavActive(innerSegs[0] === 'exercises' ? 'exercises' : (innerSegs.length === 0 ? 'home' : ''));
  }

  function paintContent(html, attach) {
    const inner = document.getElementById('content');
    inner.innerHTML = html;
    inner.scrollTop = 0;
    if (attach) attach();
  }

  function setNavActive(which) {
    const map = { home: 'nav-home', exercises: 'nav-ex', hub: 'nav-hub' };
    ['nav-home','nav-ex','nav-hub'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', map[which] === id);
    });
  }

  function updateBrandShellForHub() {
    const dot = document.getElementById('brand-dot');
    if (dot) dot.textContent = '医';
    const txt = document.getElementById('brand-text');
    if (txt) txt.textContent = '大四下学期往年题整理';
    const sub = document.getElementById('brand-sub');
    if (sub) sub.textContent = '';
  }

  // Boot
  renderShell();
  render();
  // Enable view-transition animations only after the first paint, so
  // the initial render is never invisible due to a stuck animation.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add('has-view-anim'));
  });
  window.addEventListener('hashchange', render);
})();
