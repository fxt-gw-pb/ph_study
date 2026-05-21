# Repository Guidelines

## Project Structure & Module Organization

This repository is a pure-static GitHub Pages site for Chinese preventive-medicine exam review. The repository root is the publish directory.

- `index.html` is the only page entry point.
- `subjects.js` defines `SUBJECTS_REGISTRY` and subject data lookup helpers.
- `site-data.js`, `tox-data.js`, `subjects-data.js` provide browser globals consumed by the app.
- `site.js` contains routing, views, search, exercises, theme handling, and localStorage behavior.
- `tokens.css` contains theme variables; `site.css` contains layout and component styles.
- `知识仓库/` contains source markdown used by `build-data.js`; generated `*.json` and `*-data.js` files are committed.

There is no framework, bundler, package manager setup, CI, linter, or test suite.

## Build, Test, and Development Commands

- Open `index.html` directly to preview the site over `file://`.
- `python3 -m http.server` serves the root locally when browser routing or clean static serving needs verification.
- `node build-data.js` regenerates committed data artifacts after editing markdown in `知识仓库/`.
- `node --check site.js` and `node -c subjects.js` provide quick syntax checks for JavaScript edits.

Keep the script load order in `index.html`: `subjects.js`, `site-data.js`, `subjects-data.js`, then `site.js`.

## Coding Style & Naming Conventions

Use plain browser JavaScript and CSS. Follow the existing style: two-space indentation in JS object literals, `const`/`let`, semicolons, descriptive camelCase helpers, and uppercase global data names such as `TOX_SITE_DATA`.

Do not casually change knowledge-point IDs. Real occupational-health points use `ch{chapterId}-{index}`; placeholder points use `{slug}-ch{id}-{n}`. These IDs back saved mastery state.

## Testing Guidelines

No automated tests are configured. For data changes, run `node build-data.js`, then inspect regenerated `data.json`, `tox-data.json`, and browser pages. For UI changes, verify key routes: `#/`, `#/s/occupational-health`, chapter pages, point pages, exercises, and search.

## Commit & Pull Request Guidelines

Recent commits use short, imperative English subjects, for example `Fix exercises type filter` or `Add 口试 category to exercises type filter`. Keep commits focused and mention generated data when included.

Pull requests should describe the user-visible change, list data files regenerated, note manual verification steps, and include screenshots for visual or layout changes.

## GitHub Workflow

This computer has GitHub SSH configured for user `fxt-gw-pb`. Prefer SSH remotes such as `git@github.com:fxt-gw-pb/<repo>.git`; use HTTPS token auth only if SSH fails.

Before repository changes, run `pwd`, `git status`, `git remote -v`, and `git branch`. Before editing code, state which files will change. After edits, run necessary checks, review `git diff`, ensure no unrelated files are staged, use a concise commit message, run `git status` again before pushing, then push to the user's GitHub repo.

If the remote is not owned by `fxt-gw-pb` or points to another user's repository, do not push; tell the user to fork or update the remote first.

For GitHub REST or GraphQL API tasks, SSH keys do not replace API authentication. Prefer the logged-in GitHub CLI via `gh api`; if unavailable, ask for `GH_TOKEN` or `GITHUB_TOKEN` with the minimum required permissions.

## Agent-Specific Notes

Do not publish `.claude/`, local memory, or other assistant session state. Preserve the legacy occupational-health bridge: `site-data.js` assigns `window.SITE_DATA`, while `subjects.js` maps it to `OH_SITE_DATA` on first access.

When the user provides a web-content correction or supplement for a specific subject and knowledge-point ID, add it to that point using this exact visible format: `【勘误补充】`, then the supplied correction/supplement text on the next line with no blank line between them. Update the source markdown in `知识仓库/`, regenerate data artifacts with `node build-data.js`, verify the target point, then commit and push.
