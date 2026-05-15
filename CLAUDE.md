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

## Data pipeline (occupational-health only)

Source of truth: `知识仓库/职业卫生学往年题考点整理.md` (the `知识仓库/` dir is in the repo but not referenced by the site, so it isn't served). `build-data.js` parses `## 第X章`, `### N. 知识点`, and the fields beneath (`**考频：N 次**`, `**对应小节：**`, `**匹配依据：**`, `**知识点原文摘取：**`, `**对应往年题：**` followed by `【往年题N｜source｜type】` blocks).

It emits two committed artifacts (both must exist so the site works with no Node toolchain on the deploy target):

- `data.json` — `{ meta, chapters, allQuestions }`.
- `site-data.js` — same payload as `window.SITE_DATA` so the site runs from `file://` with no fetch.

It also re-sorts each chapter's points by frequency desc, computes rollups (`totalFreq`, `totalQuestions`, `peak`, `hi` = count of points with freq ≥ 3), and flattens `allQuestions` (tagged with chapter/point + a year extracted from the source) for the exercises and search views.

Regenerate after editing the source markdown:

```bash
node build-data.js
```

**`build-data.js`'s `MD_PATH` is hardcoded to the occupational-health markdown.** `知识仓库/毒理学往年题考点整理.md` also exists but is **not** wired into the build — toxicology still serves placeholder data. Adding a real second subject means generalizing the parser (or hand-writing a data file), plus a registry entry.

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
