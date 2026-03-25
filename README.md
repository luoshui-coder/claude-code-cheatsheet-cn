# Claude Code 命令速查表（中文）

一个面向中文开发者的 Claude Code 单页命令速查表网站。

目标是尽量贴近 `cc.storyfox.cz` 的视觉与信息结构：四列、多模块、高密度、速查表导向；同时把核心内容改成中文版本，并用官方 changelog 做周更。

## 在线地址

- GitHub Pages：`https://luoshui-coder.github.io/claude-code-cheatsheet-cn/`
- 仓库：`https://github.com/luoshui-coder/claude-code-cheatsheet-cn`

## 设计目标

1. 默认中文
2. 形态上贴近速查表：多分栏、信息密集、查了就走
3. 不简单镜像原站，但保留其信息架构风格
4. 支持周更：每周自动重抓官方 changelog 和相关公开文档，全量重建页面
5. 技术栈尽量轻：纯静态 HTML/CSS/JS + 一个 Node 生成脚本

## 数据来源

每次构建会全量抓取以下公开页面：

- Claude Code 官方 changelog：`https://code.claude.com/docs/en/changelog`
- Claude Code 官方 overview / quickstart / workflows / best practices / memory / permission / settings / CLI reference
- 参考结构：`https://cc.storyfox.cz/`

说明：

- 官方页面通过 `r.jina.ai` 进行只读抓取与 Markdown 提取，避免依赖浏览器自动化
- `cc.storyfox.cz` 仅作为信息架构参考，不直接复制文案
- 生成结果会落盘到 `data/*.md` 与 `public/site-data.json`

## 更新机制

### 本地构建

```bash
npm install
npm run build
python3 -m http.server 4173 -d public
```

### GitHub Actions 周更

仓库内置 `.github/workflows/rebuild-and-deploy.yml`：

- 每周一 UTC 03:13 自动运行（北京时间 11:13）
- 每次运行都会重新抓取全部来源页面
- 重新生成 `data/`、`public/site-data.json`、`public/index.html`
- 如果内容有变化，自动提交 `chore: weekly full rebuild`
- 然后部署到 GitHub Pages

重点：**这是全量重建，不是增量 patch。**

## 主要文件

- `scripts/build.js`：抓取公开文档、抽取要点、生成站点数据和 HTML
- `public/index.html`：构建产物，单页站主文件
- `public/styles.css`：页面样式，偏高密度卡片 + 深色现代界面
- `public/script.js`：轻量交互脚本
- `data/*.md`：每次全量抓取后的原始 Markdown 快照
- `.github/workflows/rebuild-and-deploy.yml`：周更与部署 workflow

## 技术说明

- 无前端框架
- 无服务端
- 无数据库
- 适合 GitHub Pages 长期托管
