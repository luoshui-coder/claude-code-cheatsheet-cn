# Claude Code 中文速查站

一个面向中文开发者的 Claude Code 单页速查网站：保留高密度 cheat sheet 的信息效率，但不做原站镜像，而是按中文用户的理解路径重组内容。

## 在线地址

- GitHub Pages：部署后可访问 `https://luoshui-coder.github.io/claude-code-cheatsheet-cn/`
- 仓库：`https://github.com/luoshui-coder/claude-code-cheatsheet-cn`

## 设计目标

1. 默认中文，不直接翻译或镜像 `cc.storyfox.cz`
2. 把官方文档拆成“上手 / 工作流 / 配置 / 更新”四条主线
3. 保留高密度速查风格，但视觉上更现代，移动端可读
4. 用尽量轻的技术栈：纯静态 HTML/CSS/JS + 一个 Node 生成脚本

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
