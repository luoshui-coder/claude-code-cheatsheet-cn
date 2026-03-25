import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const dataDir = path.join(root, 'data');

const SOURCES = [
  { key: 'overview', title: '官方 Overview', pageTitle: 'Claude Code overview', url: 'https://code.claude.com/docs/en/overview' },
  { key: 'quickstart', title: '官方 Quickstart', pageTitle: 'Quickstart', url: 'https://code.claude.com/docs/en/quickstart' },
  { key: 'common-workflows', title: '官方 Common workflows', pageTitle: 'Common workflows', url: 'https://code.claude.com/docs/en/common-workflows' },
  { key: 'best-practices', title: '官方 Best practices', pageTitle: 'Best practices', url: 'https://code.claude.com/docs/en/best-practices' },
  { key: 'memory', title: '官方 Memory', pageTitle: 'Store instructions and memories', url: 'https://code.claude.com/docs/en/memory' },
  { key: 'permission-modes', title: '官方 Permission modes', pageTitle: 'Permission modes', url: 'https://code.claude.com/docs/en/permission-modes' },
  { key: 'settings', title: '官方 Settings', pageTitle: 'Settings', url: 'https://code.claude.com/docs/en/settings' },
  { key: 'cli-reference', title: '官方 CLI reference', pageTitle: 'CLI reference', url: 'https://code.claude.com/docs/en/cli-reference' },
  { key: 'changelog', title: '官方 Changelog', pageTitle: 'Changelog', url: 'https://code.claude.com/docs/en/changelog' },
  { key: 'storyfox', title: '参考：cc.storyfox.cz', url: 'https://cc.storyfox.cz/' }
];

const fetchMarkdown = async (url) => {
  const mirror = `https://r.jina.ai/http://${url}`;
  const res = await fetch(mirror, {
    headers: { 'User-Agent': 'Mozilla/5.0 Claude Code CN Builder' }
  });
  if (!res.ok) throw new Error(`${url} => ${res.status}`);
  return res.text();
};

const stripBoilerplate = (md) => md
  .replace(/^Title:.*$/m, '')
  .replace(/^URL Source:.*$/m, '')
  .replace(/^Markdown Content:/m, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const focusMainContent = (md, pageTitle) => {
  const marker = `# ${pageTitle}`;
  const first = md.indexOf(marker);
  const second = first >= 0 ? md.indexOf(marker, first + marker.length) : -1;
  const fromTitle = second >= 0 ? md.slice(second) : md;
  const copyPageIdx = fromTitle.indexOf('Copy page');
  return (copyPageIdx >= 0 ? fromTitle.slice(copyPageIdx + 'Copy page'.length) : fromTitle).trim();
};

const bullets = (text, limit = 8) => text
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => /^[-*]\s+/.test(line))
  .map((line) => line.replace(/^[-*]\s+/, '').replace(/`/g, '').replace(/\[(.*?)\]\((.*?)\)/g, '$1').replace(/\s+/g, ' ').trim())
  .filter((line) => line && !/^Copy page$/i.test(line) && line !== '* *')
  .slice(0, limit);

const sectionFromHeading = (md, heading, limit = 8) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`## .*?${escaped}[\\s\\S]*?(?=\\n## |$)`, 'i');
  const hit = md.match(re);
  return hit ? bullets(hit[0], limit) : [];
};

const firstCodeBlockItems = (md) => {
  const blocks = [...md.matchAll(/```([\s\S]*?)```/g)].map((m) => m[1].trim());
  return blocks.flatMap((block) => block.split('\n').map((x) => x.trim()).filter(Boolean));
};

const pickVersionBlocks = (md, limit = 10) => {
  const lines = md.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(/^(\d+\.\d+\.\d+)$/);
    if (!m) continue;
    const version = m[1];
    let j = i + 1;
    const bucket = [];
    while (j < lines.length && !lines[j].trim().match(/^(\d+\.\d+\.\d+)$/)) {
      if (/^\*\s+/.test(lines[j].trim())) bucket.push(lines[j].trim());
      j++;
    }
    blocks.push({ version, body: bucket.join('\n').trim() });
    if (blocks.length >= limit) break;
    i = j - 1;
  }
  return blocks;
};

const makeTable = (pairs) => pairs.map(([k, v]) => ({ key: k, value: v }));

const buildData = (docs) => {
  const overview = docs.overview;
  const quickstart = docs.quickstart;
  const common = docs['common-workflows'];
  const practices = docs['best-practices'];
  const memory = docs.memory;
  const permission = docs['permission-modes'];
  const settings = docs.settings;
  const cli = docs['cli-reference'];
  const changelog = docs.changelog;

  const installSnippets = firstCodeBlockItems(overview).filter((x) => /claude|install|brew|winget|curl|irm/.test(x)).slice(0, 8);
  const quickstartBullets = bullets(quickstart, 10);

  return {
    meta: {
      title: 'Claude Code 命令速查表（中文）',
      description: '高密度、多分栏、默认中文的 Claude Code 单页速查表，按周自动重建。',
      generatedAt: new Date().toISOString()
    },
    header: {
      title: 'Claude Code 命令速查表',
      subtitle: '中文重写版 · 高密度速查 · 周更自动重建',
      summary: '保留 cc.storyfox.cz 的速查表阅读形态：多分栏、卡片密集、查了就走；但内容来源改为官方文档与 changelog，文案按中文开发者习惯重组。'
    },
    columns: [
      {
        id: 'col-1',
        sections: [
          {
            theme: 'keyboard',
            title: '⌨️ 快速上手',
            intro: '先安装，再进入项目，再开始会话。',
            list: [
              ...installSnippets.slice(0, 5),
              '进入项目目录后运行：claude',
              '首次使用先登录，再给目标 + 约束 + 验收'
            ].slice(0, 8)
          },
          {
            theme: 'mcp',
            title: '⚡ 常见工作流',
            intro: '最值得高频复用的 Claude Code 使用方式。',
            list: [
              '理解新仓库：先总览，再定位模块，再问术语表',
              ...sectionFromHeading(common, 'Get a quick codebase overview', 3),
              ...sectionFromHeading(common, 'Fix bugs efficiently', 3),
              ...sectionFromHeading(common, 'Refactor code', 2)
            ].slice(0, 8)
          }
        ]
      },
      {
        id: 'col-2',
        sections: [
          {
            theme: 'slash',
            title: '⚡ 提示词写法',
            intro: 'Claude Code 吃“上下文完整、边界明确”的任务描述。',
            list: [
              '推荐结构：背景 / 目标 / 限制 / 输出 / 验收',
              ...bullets(practices, 7)
            ].slice(0, 8)
          },
          {
            theme: 'memory',
            title: '📁 Memory 与权限',
            intro: '把稳定规则写入记忆，把执行边界交给权限模式。',
            list: [
              ...bullets(memory, 4),
              ...bullets(permission, 4)
            ].slice(0, 8)
          }
        ]
      },
      {
        id: 'col-3',
        sections: [
          {
            theme: 'workflows',
            title: '🧠 配置速记',
            intro: '只留中文开发者最常碰到的配置概念。',
            list: bullets(settings, 8)
          },
          {
            theme: 'config',
            title: '⚙️ CLI / Flags',
            intro: '不是全量手册，而是常见入口心智。',
            list: [
              'claude：启动交互式会话',
              'claude -p：非交互/脚本模式',
              'claude --version：查看版本',
              ...bullets(cli, 5)
            ].slice(0, 8)
          }
        ]
      },
      {
        id: 'col-4',
        sections: [
          {
            theme: 'skills',
            title: '🔧 开局清单',
            intro: '第一次使用最容易忽略的动作。',
            list: quickstartBullets.slice(0, 8)
          },
          {
            theme: 'cli',
            title: '🖥️ 最近更新',
            intro: '来自官方 changelog 的最近版本片段。',
            versions: pickVersionBlocks(changelog, 6).map((item) => ({
              version: item.version,
              bullets: bullets(item.body, 3)
            }))
          }
        ]
      }
    ],
    tables: [
      {
        theme: 'dense',
        title: '中文开发者默认心智',
        rows: makeTable([
          ['起步入口', '先用 Terminal CLI，最稳、最全'],
          ['任务写法', '目标 + 约束 + 验收'],
          ['适合交给它', '读代码、改代码、跑命令、整理方案'],
          ['不该模糊的点', '是否能执行命令、是否能改文件、输出格式'],
          ['长期规则放哪', 'CLAUDE.md / Memory'],
          ['周更来源', '官方 changelog + 官方公开文档']
        ])
      }
    ],
    notes: [
      '本站不是官网翻译镜像，而是速查表形态的中文重写。',
      '每周 workflow 会全量抓取公开页面并重建整个页面。',
      'cc.storyfox.cz 仅参考布局与阅读风格，不直接复制原文。'
    ],
    sources: SOURCES.map((source) => ({ title: source.title, url: source.url }))
  };
};

const renderList = (items) => `<ul class="dense-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
const esc = (s) => String(s ?? '');

const html = (data) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(data.meta.title)}</title>
  <meta name="description" content="${esc(data.meta.description)}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⌨️</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div class="page">
    <header class="header">
      <div>
        <h1>${esc(data.header.title)}</h1>
        <p class="subtitle">${esc(data.header.subtitle)}</p>
      </div>
      <div class="header-meta">
        <span class="version-info">官方文档驱动 · 默认中文</span>
        <span class="last-updated">更新于 ${new Date(data.meta.generatedAt).toLocaleString('zh-CN', { hour12: false })}</span>
      </div>
    </header>

    <section class="changelog-banner">
      <div class="banner-title">📌 站点说明</div>
      <div class="banner-copy">${esc(data.header.summary)}</div>
    </section>

    <main class="main-grid">
      ${data.columns.map((column) => `
        <div class="column">
          ${column.sections.map((section) => `
            <section class="section section-${section.theme}">
              <div class="section-header">${esc(section.title)}</div>
              <div class="section-body">
                <p class="section-intro">${esc(section.intro)}</p>
                ${section.list ? renderList(section.list) : ''}
                ${section.versions ? `<div class="version-stack">${section.versions.map((v) => `<article class="version-item"><div class="version-name">v${esc(v.version)}</div>${renderList(v.bullets)}</article>`).join('')}</div>` : ''}
              </div>
            </section>
          `).join('')}
        </div>
      `).join('')}
    </main>

    <section class="bottom-grid">
      ${data.tables.map((table) => `
        <section class="section section-dense bottom-card">
          <div class="section-header">${esc(table.title)}</div>
          <div class="section-body">
            <div class="kv-table">
              ${table.rows.map((row) => `<div class="kv-row"><div class="kv-key">${esc(row.key)}</div><div class="kv-value">${esc(row.value)}</div></div>`).join('')}
            </div>
          </div>
        </section>
      `).join('')}

      <section class="section section-cli bottom-card">
        <div class="section-header">🔎 数据来源</div>
        <div class="section-body">
          ${renderList(data.sources.map((source) => `${source.title} → ${source.url}`))}
          <div class="notes">${data.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>
        </div>
      </section>
    </section>
  </div>
  <script src="./script.js"></script>
</body>
</html>`;

const run = async () => {
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  const docs = {};
  for (const source of SOURCES) {
    const raw = await fetchMarkdown(source.url);
    const cleaned = stripBoilerplate(raw);
    const focused = source.key === 'storyfox' ? cleaned : focusMainContent(cleaned, source.pageTitle);
    docs[source.key] = focused;
    await fs.writeFile(path.join(dataDir, `${source.key}.md`), focused);
  }

  const data = buildData(docs);
  await fs.writeFile(path.join(publicDir, 'site-data.json'), JSON.stringify(data, null, 2));
  await fs.writeFile(path.join(publicDir, 'index.html'), html(data));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
