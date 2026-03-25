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

const pickSection = (md, heading, fallback = '') => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^## ${escaped}\\n([\\s\\S]*?)(?=\\n## |$)`, 'm');
  const hit = md.match(re);
  return hit ? hit[1].trim() : fallback;
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

const bullets = (text, limit = 6) => text
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => /^[-*]\s+/.test(line))
  .map((line) => line.replace(/^[-*]\s+/, '').replace(/`/g, '').replace(/\[(.*?)\]\((.*?)\)/g, '$1').replace(/\s+/g, ' ').trim())
  .filter((line) => line && !/^Copy page$/i.test(line) && line !== '* *')
  .slice(0, limit);

const buildData = (docs) => {
  const overview = docs.overview;
  const quickstart = docs.quickstart;
  const common = docs['common-workflows'];
  const practices = docs['best-practices'];
  const memory = docs.memory;
  const permission = docs['permission-modes'];
  const settings = docs.settings;
  const cliRef = docs['cli-reference'];
  const changelog = docs.changelog;

  return {
    meta: {
      title: 'Claude Code 中文速查站',
      description: '面向中文开发者的 Claude Code 单页速查与周更摘要。',
      generatedAt: new Date().toISOString(),
      sourceCount: Object.keys(docs).length
    },
    hero: {
      kicker: '面向中文开发者的单页导航',
      title: 'Claude Code 中文速查站',
      summary: '不是原站镜像，而是把官方文档、更新日志和常用工作流重组为“先上手、再提效、最后调优”的中文单页。保留高密度速查表气质，但做成更适合移动端滚动阅读的卡片式结构。'
    },
    sections: [
      {
        id: 'start',
        name: '上手最快',
        intro: '先解决“怎么装、在哪用、第一步做什么”。',
        cards: [
          {
            title: '安装与入口',
            body: '优先从 Terminal CLI 开始：进入项目目录后运行 claude。桌面端适合多会话与定时任务，VS Code/JetBrains 适合编辑器内协作。',
            bullets: bullets(overview, 8)
          },
          {
            title: '开局三件事',
            body: '先登录、让它看懂仓库、再给一个明确目标。中文开发者最常见的正确姿势，是把任务写成“目标 + 约束 + 验收”。',
            bullets: bullets(quickstart, 8)
          }
        ]
      },
      {
        id: 'workflow',
        name: '高频工作流',
        intro: '把散落的文档信息，折叠成几个最常见工作面。',
        cards: [
          {
            title: '需求实现 / Bug 修复',
            body: '适合从小任务切入：先让 Claude Code 理解相关文件，再要求它给计划、改代码、跑测试、解释变更。',
            bullets: bullets(common, 8)
          },
          {
            title: '提效原则',
            body: '高质量提示词通常包含：背景、目标、限制、输出形式、是否允许执行命令。把“少问多做”和“不要越权”同时写清楚。',
            bullets: bullets(practices, 8)
          },
          {
            title: '记忆与权限',
            body: 'Memory 适合放稳定规则；Permission modes 决定执行边界。团队场景里，越明确权限边界，越能减少来回确认。',
            bullets: [...bullets(memory, 4), ...bullets(permission, 4)].slice(0, 8)
          }
        ]
      },
      {
        id: 'config',
        name: '配置速记',
        intro: '需要的时候查，不需要时不打扰。',
        cards: [
          {
            title: 'Settings / 配置项',
            body: '常见关注点包括模型、默认行为、工具接入与环境偏好。站点里只保留中文开发者最常查的认知层摘要。',
            bullets: bullets(settings, 8)
          },
          {
            title: 'CLI / 命令参考',
            body: 'CLI Reference 很长，本页不逐条照搬，而是把常见入口、命令心智和查阅路径压缩成速查片段。',
            bullets: bullets(cliRef, 8)
          }
        ]
      }
    ],
    changelog: pickVersionBlocks(changelog, 12).map((item) => ({
      version: item.version,
      bullets: bullets(item.body, 5)
    })).filter((item) => item.bullets.length),
    sources: SOURCES.map((source) => ({ title: source.title, url: source.url })),
    notes: [
      '内容每周全量抓取并重建，不做差量 patch。',
      '官方文档通过 r.jina.ai 做只读镜像提取，避免依赖浏览器自动化。',
      'cc.storyfox.cz 仅作为信息架构参考，不直接镜像文案。'
    ]
  };
};

const html = (data) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.meta.title}</title>
  <meta name="description" content="${data.meta.description}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div>
        <p class="kicker">${data.hero.kicker}</p>
        <h1>${data.hero.title}</h1>
        <p class="summary">${data.hero.summary}</p>
      </div>
      <div class="meta-card">
        <div><span>生成时间</span><strong>${new Date(data.meta.generatedAt).toLocaleString('zh-CN', { hour12: false })}</strong></div>
        <div><span>数据源</span><strong>${data.meta.sourceCount} 个页面</strong></div>
        <div><span>更新策略</span><strong>每周全量重建</strong></div>
      </div>
    </header>

    <nav class="toc">
      ${data.sections.map((section) => `<a href="#${section.id}">${section.name}</a>`).join('')}
      <a href="#changelog">最近更新</a>
      <a href="#sources">数据来源</a>
    </nav>

    <main class="grid">
      ${data.sections.map((section) => `
        <section id="${section.id}" class="panel">
          <div class="panel-head">
            <h2>${section.name}</h2>
            <p>${section.intro}</p>
          </div>
          <div class="card-grid">
            ${section.cards.map((card) => `
              <article class="card">
                <h3>${card.title}</h3>
                <p>${card.body}</p>
                <ul>${card.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>
              </article>
            `).join('')}
          </div>
        </section>
      `).join('')}

      <section id="changelog" class="panel wide">
        <div class="panel-head">
          <h2>最近版本更新</h2>
          <p>从官方 changelog 抓取后，压缩成中文开发者更关心的“版本号 + 关键点”。</p>
        </div>
        <div class="timeline">
          ${data.changelog.map((item) => `
            <article class="version-card">
              <div class="version-badge">v${item.version}</div>
              <ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>
            </article>
          `).join('')}
        </div>
      </section>

      <section id="sources" class="panel wide footer-panel">
        <div class="panel-head">
          <h2>数据来源与说明</h2>
          <p>站点只消费公开可访问页面；页面文案为中文重写与重组，不是直接镜像。</p>
        </div>
        <div class="notes">
          ${data.notes.map((note) => `<p>${note}</p>`).join('')}
        </div>
        <ul class="source-list">
          ${data.sources.map((source) => `<li><a href="${source.url}" target="_blank" rel="noreferrer">${source.title}</a></li>`).join('')}
        </ul>
      </section>
    </main>
  </div>
  <script>window.__SITE_DATA__ = ${JSON.stringify(data)};</script>
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
