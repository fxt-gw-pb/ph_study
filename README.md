# 预防医学复习站 · 多学科 + 主题菜单

> 在原有「职业卫生学往年题考点复习」静态网站的基础上扩展为多学科架构，并新增主题菜单与两个参考主题。仓库根目录就是 GitHub Pages 发布目录。

## 直接部署

1. 把整个文件夹上传到 GitHub 仓库。
2. 打开仓库的 **Settings → Pages**。
3. Source 选择 **Deploy from a branch**。
4. Branch 选择 **main**，目录选择 **/root**。
5. 保存后等待 1–2 分钟访问 Pages 地址。

本项目是纯静态网站，不需要 `npm install`、不需要构建命令，也不需要选择 `/docs`。

## 入口文件

```
index.html
tokens.css        所有主题色彩变量
site.css          布局与组件样式
subjects.js       学科注册表（SUBJECTS_REGISTRY）+ 数据查询函数
site-data.js      职业卫生学真实数据（自动生成）
subjects-data.js  其余 6 个学科的占位数据
site.js           应用主逻辑（路由 + 视图 + 主题）
```

`.nojekyll` 已放在根目录，用于避免 GitHub Pages 的 Jekyll 处理影响静态文件发布。

## 路由

* `#/` — 学科选择首页（hub）
* `#/s/<slug>` — 学科首页
* `#/s/<slug>/ch/<id>` — 章节页
* `#/s/<slug>/p/<pid>` — 知识点详情
* `#/s/<slug>/exercises` — 题库
* `#/s/<slug>/search?q=…` — 搜索结果
* 旧版 `#/ch/…`、`#/p/…`、`#/exercises`、`#/search` 自动跳转到 `occupational-health` 对应路由。

## 新增学科数据

1. 在 `subjects.js` 的 `SUBJECTS_REGISTRY` 数组中新增条目（slug / 标题 / dataVar 等）。
2. 在 `subjects-data.js` 中调用 `window.makePlaceholderData(subj, [...])` 生成与 `OH_SITE_DATA` 同结构的数据；或直接写一个手工对象，保持 `{ meta, chapters, allQuestions }` 字段。
3. 把对象赋给注册表里声明的 `dataVar` 全局变量。

## 新增主题

1. 在 `tokens.css` 末尾添加 `.theme-<id> { --bg-page: …; --primary: …; … }`，覆盖任何需要变化的 CSS 变量。
2. 在 `site.js` 的 `THEMES` 数组中追加 `{ id, label, desc, swatch:[bg, primary, accent] }`。

## 主题菜单

主题切换按钮位于顶栏右侧，点击展开迷你菜单，列出所有主题（带色块预览）。选择后立即切换全站主题，并保存到 `localStorage['oh-review-theme-v1']`。

## 已掌握标记

按学科分别存储，键为 `oh-review-mastered-v1::<slug>`。原 `oh-review-mastered-v1` 对 `occupational-health` 自动迁移。
