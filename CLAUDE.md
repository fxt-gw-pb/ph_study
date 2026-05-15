# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A pure-static, Chinese-language, **multi-subject** preventive-medicine (预防医学) past-exam review site. The repo root **is** the GitHub Pages publish directory (`.nojekyll` present). There is no bundler, no `package.json`, no `npm install`, no framework, no CI, no tests, no linter — files are served as-is. Hash-based routing only.

It started as a single 职业卫生学 (Occupational Health) site and was generalized to N subjects. Only **occupational-health** has real content; the other six subjects are placeholder data.

## Architecture: subject registry + data indirection

`index.html` loads four scripts, and **the order is load-bearing**:

```
subjects.js      → SUBJECTS_REGISTRY + helpers (no data)
site-data.js     → assigns window.SITE_DATA  (real OH data, auto-generated)
subjects-data.js → assigns window.{TOX,EPI,ENV,NUTR,PSY,OD}_SITE_DATA (placeholders)
site.js          → the whole app (routing + views + theme)
```

`subjects.js` is the single source of truth for which subjects exist. Each registry entry has a `slug`, display fields, and a `dataVar` naming the global the data lives on. The app never reads a data global directly — it calls `window.getSubjectData(slug)`, which resolves `window[subj.dataVar]`.

**Legacy bridge (easy to trip over):** the occupational-health entry's `dataVar` is `OH_SITE_DATA`, but the generated `site-data.js` still assigns the *old* `window.SITE_DATA`. `getSubjectData('occupational-health')` copies `window.SITE_DATA` → `window.OH_SITE_DATA` on first access. Don't "fix" this mismatch by renaming one side without changing both `subjects.js` and `build-data.js`.

`window.makePlaceholderData(subj, chapterDefs)` builds a payload **shape-identical** to the real one. Every subject's data — real or placeholder — must satisfy this contract:

```
{ meta:{chapters,points,questions,hiFreqPoints,...},
  chapters:[ { id,num,title,rawTitle,points:[ {id,index,chapterId,chapterTitle,title,freq,section,basis,excerpt,questions} ],
               totalFreq,totalQuestions,peak,hi } ],
  allQuestions:[ … ] }
```

`site.js`'s chapter/point/exercise/search views assume exactly these fields across all subjects.

## Data pipeline

Source of truth lives in `知识仓库/` (in the repo but not referenced by the site, so not served). `build-data.js` holds a `TARGETS` list — one entry per real subject — and runs the same `parse()` over each:

| Source markdown | → json | → js (global) |
|---|---|---|
| `职业卫生学往年题考点整理.md` | `data.json` | `site-data.js` (`window.SITE_DATA`) |
| `毒理学往年题考点整理.md` | `tox-data.json` | `tox-data.js` (`window.TOX_SITE_DATA`) |

All four artifacts are committed (the site must work with no Node toolchain on the deploy target). `parse()` reads `## 第X章` / `## 附：…` chapter headings, `### N. 知识点`, and the fields beneath. **Field formats differ by subject and the parser tolerates both** — do not "tighten" these regexes:
- 考频: OH `**考频：2 次**` *and* TOX `**考频：** 12 次` / `30 余次（…）` → `/^\*\*考频[：:]\*{0,2}\s*(\d+)/`.
- `**知识来源：**` exists only in TOX; captured into `point.source` so it doesn't leak into the excerpt (OH points simply omit `source`).
- Chapter titles: OH `第一章 绪论`; TOX `第一章 / 《1 绪论》（生物转运）` → `cleanChapterTitle()` strips the `/ `, takes the 《》 inner text (dropping its leading file number), prefers a trailing （中文）gloss, drops a trailing year.
- `## 附：…` (TOX appendix) is a real chapter (num `附`, integer id continuing the sequence; the site renders chapters by `ch.id`, not `ch.num`).

Then it parses `**对应小节：**`, `**匹配依据：**`, `**知识点原文摘取：**`, and `**对应往年题：**` followed by `【往年题N｜source｜type】` blocks.

It also re-sorts each chapter's points by frequency desc, computes rollups (`totalFreq`, `totalQuestions`, `peak`, `hi` = count of points with freq ≥ 3), and flattens `allQuestions` (tagged with chapter/point + a year extracted from the source) for the exercises and search views.

Regenerate after editing the source markdown:

```bash
node build-data.js
```

**To wire a new real subject:** add a `TARGETS` entry in `build-data.js`, set the registry entry's `status: 'ready'` in `subjects.js`, load the generated `*-data.js` in `index.html` (after `subjects-data.js` so it overrides any placeholder), and drop that subject's placeholder block from `subjects-data.js`. Other source markdown may sit in `知识仓库/` (e.g. `环境健康学往年题考点整理.md`) without being wired in — those subjects stay placeholder until added to `TARGETS`.

## Knowledge-point ID schemes (do not change casually)

- Real OH points: `ch{chapterId}-{index}` (e.g. `ch3-2`), assigned in `build-data.js`.
- Placeholder points: `{slug}-ch{id}-{j+1}`, assigned in `subjects.js`'s `makePlaceholderData`.

These IDs are the keys for per-subject saved mastery state, so changing either scheme silently invalidates users' progress.

## Routing & persisted state (`site.js`)

Subject-scoped hash routes: `#/` (subject hub), `#/s/<slug>`, `#/s/<slug>/ch/<id>`, `#/s/<slug>/p/<pid>`, `#/s/<slug>/exercises`, `#/s/<slug>/search?q=…`. Legacy bare routes (`#/ch/…`, `#/p/…`, `#/exercises`, `#/search`) `location.replace` into the `occupational-health` subject.

`localStorage`:
- `oh-review-mastered-v1::<slug>` — mastered point IDs, **per subject**. The old global `oh-review-mastered-v1` is auto-migrated into the occupational-health key on first run.
- `oh-review-theme-v1` — active theme id (global, not per-subject).

## Extension recipes

**Add a subject:** add an entry to `SUBJECTS_REGISTRY` in `subjects.js` (`slug`, `title`, `dataVar`, `accent`, `status`); in `subjects-data.js` call `window.makePlaceholderData(...)` (or assign a hand-built object of the same shape) to the declared `dataVar`.

**Add a theme:** append `.theme-<id> { … }` to the end of `tokens.css` overriding the needed CSS variables, then add a matching `{ id, label, desc, swatch }` to the `THEMES` array in `site.js`. `site.js` applies the choice via a `theme-<id>` body class (it clears the known theme classes first, so add new ids to that removal list too).

## Run / preview locally

Open `index.html` directly in a browser — it works over `file://` because all data is inlined into the `*-data.js` files (no fetch). A static server (`python3 -m http.server`) is only needed to test hash-routing edge cases / clean URLs.

## Deploy

This working copy is **not a git repository** (no `.git`). Do not assume `git`/push commands work or invent a git workflow. Deployment is: get the repo-root files into a GitHub repo and enable **Settings → Pages → Deploy from a branch → `main` / `/root`** (not `/docs`). `.nojekyll` prevents Jekyll from filtering files. `.gitignore` excludes `.claude/` and `memory/` (Claude Code session state — never publish these).

Intended GitHub target (per project history, not currently wired up locally): user **fxt-gw-pb**, repo `occupational-health-review-test`. If a git remote is ever added, prefer the SSH form (`git@github.com:fxt-gw-pb/<repo>.git`); if a remote does not point to a repo owned by `fxt-gw-pb`, do not push — warn the user first.
