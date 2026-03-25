import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const dataDir = path.join(root, 'data');

const fetchMarkdown = async (url) => {
  const mirror = `https://r.jina.ai/http://${url}`;
  const res = await fetch(mirror, { headers: { 'User-Agent': 'Mozilla/5.0 Claude Code CN Builder' } });
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

const zhRecent = [
  '新增 --bare：用于脚本化 -p 调用的极简无头模式，不跑 hooks / LSP / 插件扫描',
  '新增 --channels：权限请求可中继到手机端，部分 MCP 消息也可推送',
  '新增 skills / slash commands 的 effort 前言字段',
  '/fork 更名为 /branch（旧别名仍兼容）',
  'SendMessage 现在可自动恢复已停止的 agent'
];

const data = {
  version: 'v2.1.81',
  updated: new Date().toISOString(),
  recentChanges: zhRecent,
  footerSources: [
    '官方变更日志：https://code.claude.com/docs/en/changelog',
    '参考结构：https://cc.storyfox.cz/'
  ]
};

const row = (keyHtml, descHtml, os = 'both') => `<div class="row" data-os="${os}"><span class="key">${keyHtml}</span> <span class="desc">${descHtml}</span></div>`;
const keycap = (text) => `<span class="keycap">${text}</span>`;
const duo = (mac, win) => `<span class="os-mac">${mac}</span><span class="os-win">${win}</span>`;

const html = (ctx) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code 中文速查表</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⌨️</text></svg>">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --keyboard-bg: #EFF6FF; --keyboard-header: #2563EB;
      --slash-bg: #F5F3FF; --slash-header: #7C3AED;
      --skills-bg: #ECFDF5; --skills-header: #059669;
      --memory-bg: #FFFBEB; --memory-header: #D97706;
      --config-bg: #FFF7ED; --config-header: #C2410C;
      --workflows-bg: #FEF2F2; --workflows-header: #DC2626;
      --mcp-bg: #ECFEFF; --mcp-header: #0891B2;
      --cli-bg: #F9FAFB; --cli-header: #4B5563;
      --footer-bg: #1F2937; --footer-text: #F9FAFB;
      --font-sans: 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
    }
    html { font-size: 12px; }
    body { font-family: var(--font-sans); font-size: 0.9rem; line-height: 1.15; background: #fff; color: #1F2937; padding: 6mm; }
    .page { width: 100%; max-width: 279mm; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 1px solid #E5E7EB; }
    .header h1 { font-size: 1.4rem; font-weight: 700; color: #111827; }
    .header-right { display: flex; align-items: center; gap: 3mm; }
    .header-meta { font-size: 0.75rem; color: #6B7280; text-align: right; }
    .header-meta .version-info { display: block; font-weight: 600; color: #374151; }
    .header-meta .last-updated { display: block; font-size: 0.7rem; color: #9CA3AF; }
    .os-toggle { display: flex; border: 1px solid #9CA3AF; border-radius: 5px; overflow: hidden; background: #F3F4F6; }
    .os-btn { background: #fff; border: none; padding: 3px 8px; font-size: 0.8rem; cursor: pointer; line-height: 1; color: #6B7280; transition: background .15s, color .15s; display: flex; align-items: center; justify-content: center; }
    .os-btn + .os-btn { border-left: 1px solid #9CA3AF; }
    .os-btn.active { background: #111827; color: #fff; }
    .changelog { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B; border-radius: 4px; padding: 1.5mm 3mm; margin-bottom: 2mm; font-size: 0.72rem; }
    .changelog-header { font-weight: 700; color: #92400E; margin-bottom: 0.5mm; display: flex; align-items: center; gap: 1mm; }
    .changelog-list { display: flex; flex-wrap: wrap; gap: 1mm 4mm; color: #78350F; list-style: none; }
    .changelog-list li { display: flex; align-items: center; gap: 1mm; }
    .changelog-list li::before { content: '•'; color: #F59E0B; font-weight: bold; }
    .main-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; align-items: stretch; }
    .section { border-radius: 3px; overflow: hidden; display: flex; flex-direction: column; }
    .section-keyboard-mcp > .section:last-child, .section-slash-memory > .section:last-child, .section-workflows-config > .section:last-child, .section-skills-cli > .section:last-child { flex: 1; }
    .section-header { padding: 1.2mm 2mm; color: white; font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; display: flex; align-items: center; gap: 1mm; }
    .section-content { padding: 1.5mm 2.5mm; flex: 1; }
    .sub-header { font-weight: 700; font-style: italic; font-size: 0.75rem; color: #374151; margin-top: 1.2mm; margin-bottom: 0.4mm; padding-bottom: 0.3mm; border-bottom: 1px dotted rgba(0,0,0,0.15); }
    .sub-header:first-child { margin-top: 0; }
    .row { display: flex; gap: 1.5mm; padding: 0.3mm 0; line-height: 1.2; }
    .key { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; color: #1F2937; white-space: nowrap; flex-shrink: 0; }
    .desc { font-size: 0.8rem; color: #4B5563; flex: 1; }
    .keycap { display: inline-block; background: linear-gradient(180deg, #FAFAFA 0%, #E5E7EB 100%); border: 1px solid #D1D5DB; border-radius: 2px; padding: 0.2mm 1.2mm; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: #374151; box-shadow: 0 1px 1px rgba(0,0,0,0.1), inset 0 -1px 0 rgba(0,0,0,0.05); margin-right: 0.3mm; }
    .badge-new { display: inline-block; background: #EF4444; color: white; font-size: 0.55rem; font-weight: 700; padding: 0.2mm 1mm; border-radius: 2px; margin-left: 1mm; vertical-align: middle; text-transform: uppercase; letter-spacing: 0.03em; }
    .section-keyboard { background: var(--keyboard-bg); } .section-keyboard .section-header { background: var(--keyboard-header); }
    .section-slash { background: var(--slash-bg); } .section-slash .section-header { background: var(--slash-header); }
    .section-skills { background: var(--skills-bg); } .section-skills .section-header { background: var(--skills-header); }
    .section-memory { background: var(--memory-bg); } .section-memory .section-header { background: var(--memory-header); }
    .section-workflows { background: var(--workflows-bg); } .section-workflows .section-header { background: var(--workflows-header); }
    .section-mcp { background: var(--mcp-bg); } .section-mcp .section-header { background: var(--mcp-header); }
    .section-cli { background: var(--cli-bg); } .section-cli .section-header { background: var(--cli-header); }
    .section-config { background: var(--config-bg); } .section-config .section-header { background: var(--config-header); }
    .section-keyboard-mcp, .section-slash-memory, .section-workflows-config, .section-skills-cli { display: flex; flex-direction: column; gap: 2mm; }
    .footer { margin-top: 2mm; background: var(--footer-bg); color: var(--footer-text); padding: 1.5mm 2.5mm; border-radius: 3px; font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.7mm; }
    .footer-row { display: flex; flex-wrap: wrap; gap: 2mm; align-items: center; }
    .footer-label { font-weight: 700; color: #9CA3AF; margin-right: 1mm; }
    .footer-item { display: inline-flex; align-items: center; gap: 1mm; }
    .footer-item code { font-family: var(--font-mono); background: rgba(255,255,255,0.1); padding: 0.3mm 1mm; border-radius: 2px; }
    .footer-sep { color: #6B7280; }
    .os-win { display: none; }
    body[data-os='win'] .os-win { display: inline; }
    body[data-os='win'] .os-mac { display: none; }
    body[data-os='mac'] .os-win { display: none; }
    body[data-os='mac'] .os-mac { display: inline; }
    .row[data-os='mac'] .os-win, .row[data-os='win'] .os-mac { display: none !important; }
    body[data-os='mac'] .row[data-os='win'] { display: none; }
    body[data-os='win'] .row[data-os='mac'] { display: none; }
    @media screen and (max-width: 1100px) { html { font-size: 10px; } .main-grid { grid-template-columns: repeat(2, 1fr); } }
    @media screen and (max-width: 600px) { html { font-size: 11px; } body { padding: 3mm; } .header { flex-wrap: wrap; gap: 4px; justify-content: space-between; } .main-grid { grid-template-columns: 1fr; } .footer-row { flex-direction: column; align-items: flex-start; gap: 2px; } .changelog-list { flex-direction: column; gap: 1mm; } }
  </style>
</head>
<body data-os="mac">
  <div class="page">
    <header class="header">
      <h1>Claude Code 中文速查表</h1>
      <div class="header-right">
        <div class="os-toggle" id="osToggle">
          <button class="os-btn active" data-os="mac" title="Mac">Mac</button>
          <button class="os-btn" data-os="win" title="Windows">Win</button>
        </div>
        <div class="header-meta">
          <span class="version-info">Claude Code ${ctx.version}</span>
          <span class="last-updated">最后更新：${new Date(ctx.updated).toLocaleString('zh-CN', { hour12: false })}</span>
        </div>
      </div>
    </header>

    <div class="changelog">
      <div class="changelog-header">📋 最近更新（中文）</div>
      <ul class="changelog-list">${ctx.recentChanges.map((x) => `<li>${x}</li>`).join('')}</ul>
    </div>

    <main class="main-grid">
      <div class="section-keyboard-mcp">
        <section class="section section-keyboard">
          <div class="section-header">⌨️ 键盘快捷键</div>
          <div class="section-content">
            <div class="sub-header">通用控制</div>
            ${row(duo(`${keycap('Ctrl')}${keycap('C')}`, `${keycap('Ctrl')}${keycap('C')}`), '取消输入 / 中断生成')}
            ${row(duo(`${keycap('Ctrl')}${keycap('D')}`, `${keycap('Ctrl')}${keycap('D')}`), '退出会话')}
            ${row(duo(`${keycap('Ctrl')}${keycap('L')}`, `${keycap('Ctrl')}${keycap('L')}`), '清空屏幕')}
            ${row(duo(`${keycap('Ctrl')}${keycap('O')}`, `${keycap('Ctrl')}${keycap('O')}`), '切换详细输出')}
            ${row(duo(`${keycap('Ctrl')}${keycap('R')}`, `${keycap('Ctrl')}${keycap('R')}`), '反向搜索历史')}
            ${row(duo(`${keycap('Cmd')}${keycap('K')}`, `${keycap('Ctrl')}${keycap('K')}`), '在编辑器中打开当前输入')}
            ${row(duo(`${keycap('Cmd')}${keycap('B')}`, `${keycap('Ctrl')}${keycap('B')}`), '把当前任务转入后台')}
            ${row(duo(`${keycap('Cmd')}${keycap('T')}`, `${keycap('Ctrl')}${keycap('T')}`), '切换任务列表')}
            <div class="sub-header">模式切换</div>
            ${row(duo(`${keycap('Shift')}${keycap('Tab')}`, `${keycap('Shift')}${keycap('Tab')}`), '轮换权限模式')}
            ${row(duo(`${keycap('Option')}${keycap('P')}`, `${keycap('Alt')}${keycap('P')}`), '切换模型')}
            ${row(duo(`${keycap('Option')}${keycap('T')}`, `${keycap('Alt')}${keycap('T')}`), '开 / 关 thinking')}
            <div class="sub-header">输入前缀</div>
            ${row('/', 'Slash 命令')}
            ${row('!', '直接执行 bash')}
            ${row('@', '提及文件并自动补全')}
            <div class="sub-header">会话选择器</div>
            ${row(duo(`${keycap('↑↓')}`, `${keycap('↑↓')}`), '上下移动选择')}
            ${row(duo(`${keycap('←→')}`, `${keycap('←→')}`), '展开 / 折叠项目')}
            ${row(duo(`${keycap('P')}`, `${keycap('P')}`), '预览会话内容')}
            ${row(duo(`${keycap('R')}`, `${keycap('R')}`), '重命名会话')}
            ${row(duo(`${keycap('/')}`, `${keycap('/')}`), '搜索会话')}
            ${row(duo(`${keycap('A')}`, `${keycap('A')}`), '查看所有项目')}
            ${row(duo(`${keycap('B')}`, `${keycap('B')}`), '仅查看当前分支')}
          </div>
        </section>

        <section class="section section-mcp">
          <div class="section-header">🔌 MCP 服务器</div>
          <div class="section-content">
            <div class="sub-header">添加方式</div>
            ${row('--transport http', '远程 HTTP（推荐）')}
            ${row('--transport stdio', '本地进程')}
            ${row('--transport sse', '远程 SSE')}
            <div class="sub-header">作用域</div>
            ${row('Local', '.claude.json，当前项目本地')}
            ${row('Project', '.mcp.json，项目共享')}
            ${row('User', '~/.claude.json，全局用户级')}
            <div class="sub-header">管理</div>
            ${row('/mcp', '交互式管理界面')}
            ${row('claude mcp list', '列出全部 MCP')}
            ${row('claude mcp serve', '把 Claude Code 当 MCP server')}
            ${row('Elicitation', '任务中途向用户请求结构化输入<span class="badge-new">NEW</span>')}
          </div>
        </section>
      </div>

      <div class="section-slash-memory">
        <section class="section section-slash">
          <div class="section-header">⚡ Slash 命令</div>
          <div class="section-content">
            <div class="sub-header">会话</div>
            ${row('/clear', '清空当前对话')}
            ${row('/compact [focus]', '压缩上下文')}
            ${row('/resume', '恢复 / 切换会话')}
            ${row('/rename [name]', '给当前会话命名')}
            ${row('/branch [name]', '分叉会话（/fork 兼容）')}
            ${row('/cost', '查看 token / 成本')}
            ${row('/context', '可视化上下文占用')}
            ${row('/diff', '交互式查看 diff')}
            <div class="sub-header">配置</div>
            ${row('/config', '打开设置')}
            ${row('/model [model]', '切换模型')}
            ${row('/permissions', '查看 / 修改权限')}
            ${row('/effort [level]', '设置努力等级 low/med/high/max<span class="badge-new">NEW</span>')}
            ${row('/color [color]', '设置提示条颜色')}
            <div class="sub-header">工具</div>
            ${row('/init', '生成 CLAUDE.md')}
            ${row('/memory', '编辑记忆文件')}
            ${row('/hooks', '管理 hooks')}
            ${row('/skills', '查看可用 skills')}
            ${row('/agents', '管理 agents')}
            <div class="sub-header">特殊</div>
            ${row('/btw <question>', '侧问，不吃主上下文')}
            ${row('/plan [desc]', '进入计划模式')}
            ${row('/loop [interval]', '周期任务')}
            ${row('/voice', '语音模式')}
            ${row('/doctor', '诊断安装问题')}
            ${row('/rc', '远程控制 / 网页桥接<span class="badge-new">NEW</span>')}
            ${row('/help', '查看帮助')}
          </div>
        </section>

        <section class="section section-memory">
          <div class="section-header">📁 Memory 与文件</div>
          <div class="section-content">
            <div class="sub-header">CLAUDE.md 位置</div>
            ${row('./CLAUDE.md', '项目级，共享给团队')}
            ${row('~/.claude/CLAUDE.md', '个人级，所有项目生效')}
            ${row('/etc/claude-code/', '组织托管级配置')}
            <div class="sub-header">规则与导入</div>
            ${row('.claude/rules/*.md', '项目规则')}
            ${row('~/.claude/rules/*.md', '个人规则')}
            ${row('paths: frontmatter', '按路径匹配规则')}
            ${row('@path/to/file', '在 CLAUDE.md 中引入文件')}
            <div class="sub-header">自动记忆</div>
            ${row('~/.claude/projects/<proj>/memory/', '')}
            ${row('', '包含 MEMORY.md 和主题记忆文件，会被自动加载')}
          </div>
        </section>
      </div>

      <div class="section-workflows-config">
        <section class="section section-workflows">
          <div class="section-header">🧠 工作流与技巧</div>
          <div class="section-content">
            <div class="sub-header">计划模式</div>
            ${row(duo(`${keycap('Shift')}${keycap('Tab')}`, `${keycap('Shift')}${keycap('Tab')}`), '普通 → 自动接受 → 计划模式')}
            ${row('--permission-mode plan', '启动即进入计划模式')}
            <div class="sub-header">Thinking 与 Effort</div>
            ${row(duo(`${keycap('Option')}${keycap('T')}`, `${keycap('Alt')}${keycap('T')}`), '开 / 关 thinking')}
            ${row('"ultrathink"', '当前轮次最大努力')}
            ${row('/effort', '○ low · ◐ med · ● high<span class="badge-new">NEW</span>')}
            <div class="sub-header">Git Worktree</div>
            ${row('--worktree name', '每个功能独立分支 / 工作树')}
            ${row('isolation: worktree', 'Agent 在独立 worktree 中运行')}
            ${row('sparsePaths', '只 checkout 必需目录<span class="badge-new">NEW</span>')}
            ${row('/batch', '自动创建 worktrees 并并行处理')}
            <div class="sub-header">语音模式</div>
            ${row('/voice', '启用按住说话')}
            ${row(`${keycap('Space')} (hold)`, '按住录音，松开发送')}
            ${row('20 languages', '支持 EN / ES / FR / DE / CZ / PL…')}
            <div class="sub-header">上下文管理</div>
            ${row('/context', '查看使用情况和优化建议')}
            ${row('/compact [focus]', '带焦点压缩上下文')}
            ${row('Auto-compact', '约 95% 容量自动压缩')}
            ${row('1M context', 'Opus 4.6 在 Max/Team/Enterprise 可用')}
            ${row('CLAUDE.md', '压缩后仍保留')}
            <div class="sub-header">会话进阶</div>
            ${row('claude -c', '续接上一次对话')}
            ${row('claude -r "name"', '按名字恢复会话')}
            ${row('/btw question', '侧问，不占主上下文')}
            <div class="sub-header">SDK / Headless</div>
            ${row('claude -p "query"', '非交互运行')}
            ${row('--output-format json', '结构化输出')}
            ${row('--max-budget-usd 5', '设置成本上限')}
            ${row('cat file | claude -p', '管道输入')}
            <div class="sub-header">调度与远程</div>
            ${row('/loop 5m msg', '周期任务')}
            ${row('/rc', '远程控制')}
            ${row('--remote', '在 claude.ai 网页会话中运行')}
          </div>
        </section>

        <section class="section section-config">
          <div class="section-header">⚙️ 配置与环境变量</div>
          <div class="section-content">
            <div class="sub-header">配置文件</div>
            ${row('~/.claude/settings.json', '用户级设置')}
            ${row('.claude/settings.json', '项目共享设置')}
            ${row('.claude/settings.local.json', '仅本地生效')}
            ${row('~/.claude.json', 'OAuth / MCP / 状态')}
            ${row('.mcp.json', '项目 MCP 配置')}
            <div class="sub-header">关键设置</div>
            ${row('modelOverrides', '模型选择器映射到自定义模型 ID')}
            ${row('autoMemoryDirectory', '自定义自动记忆目录')}
            ${row('worktree.sparsePaths', '稀疏 checkout 目录<span class="badge-new">NEW</span>')}
            <div class="sub-header">关键环境变量</div>
            ${row('ANTHROPIC_API_KEY', '')}
            ${row('ANTHROPIC_MODEL', '')}
            ${row('CLAUDE_CODE_EFFORT_LEVEL', 'low / med / high')}
            ${row('MAX_THINKING_TOKENS', '0 表示关闭')}
            ${row('ANTHROPIC_CUSTOM_MODEL_OPTION', '给 /model 增加自定义项')}
            ${row('CLAUDE_CODE_PLUGIN_SEED_DIR', '多个插件 seed 目录')}
            ${row('CLAUDECODE', '检测是否运行在 Claude Code shell (=1)')}
            ${row('IS_DEMO', '演示模式（隐藏邮箱/组织）')}
          </div>
        </section>
      </div>

      <div class="section-skills-cli">
        <section class="section section-skills">
          <div class="section-header">🔧 Skills 与 Agents</div>
          <div class="section-content">
            <div class="sub-header">内置 Skills</div>
            ${row('/simplify', '代码评审（3 个并行 agent）')}
            ${row('/batch', '大规模并行改动（5-30 worktrees）')}
            ${row('/debug [desc]', '从 debug log 排查问题')}
            ${row('/loop [interval]', '周期任务 skill')}
            ${row('/claude-api', '加载 API / SDK 参考')}
            <div class="sub-header">自定义 Skill 位置</div>
            ${row('.claude/skills/<name>/', '项目技能')}
            ${row('~/.claude/skills/<name>/', '个人技能')}
            <div class="sub-header">Skill Frontmatter</div>
            ${row('description', '自动触发描述')}
            ${row('allowed-tools', '跳过权限确认')}
            ${row('model', '指定 skill 使用模型')}
            ${row('effort', '覆盖默认 effort<span class="badge-new">NEW</span>')}
            ${row('context: fork', '在子 agent 中运行')}
            <div class="sub-header">内置 Agents</div>
            ${row('Explore', '快速只读探索（Haiku）')}
            ${row('Plan', '计划模式研究 agent')}
            ${row('General', '全工具复杂任务')}
            ${row('Bash', '独立终端上下文 agent')}
          </div>
        </section>

        <section class="section section-cli">
          <div class="section-header">🖥️ CLI 与 Flags</div>
          <div class="section-content">
            <div class="sub-header">核心命令</div>
            ${row('claude', '交互式模式')}
            ${row('claude "q"', '带 prompt 启动')}
            ${row('claude -p "q"', '无头模式')}
            ${row('claude -c', '续上次会话')}
            ${row('claude -r "n"', '按名字恢复')}
            ${row('claude update', '更新 Claude Code')}
            <div class="sub-header">关键参数</div>
            ${row('--model', '指定模型')}
            ${row('-w', 'Git worktree')}
            ${row('-n / --name', '会话命名')}
            ${row('--add-dir', '附加工作目录')}
            ${row('--agent', '使用指定 agent')}
            ${row('--allowedTools', '预批准工具')}
            ${row('--output-format', 'json / stream')}
            ${row('--json-schema', '结构化输出')}
            ${row('--max-turns', '限制 agent 轮数')}
            ${row('--max-budget-usd', '成本上限')}
            ${row('--console', '使用 Anthropic Console 认证')}
            ${row('--verbose', '详细输出')}
            ${row('--bare', '极简无头模式<span class="badge-new">NEW</span>')}
            ${row('--channels', '权限中继 / MCP 推送<span class="badge-new">NEW</span>')}
            ${row('--remote', '网页会话模式')}
            ${row('--effort', 'low / med / high / max')}
            ${row('--permission-mode', 'plan / default / …')}
            ${row('--dangerously-skip-permissions', '跳过所有权限确认 ⚠️')}
            ${row('--chrome', '启用 Chrome 集成')}
          </div>
        </section>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-row">
        <span class="footer-label">权限模式：</span>
        <span class="footer-item"><code>default</code> 按需询问</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>acceptEdits</code> 自动接受编辑</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>plan</code> 只读计划</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>dontAsk</code> 未允许即拒绝</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>bypassPermissions</code> 全跳过</span>
      </div>
      <div class="footer-row">
        <span class="footer-label">关键环境变量：</span>
        <span class="footer-item"><code>ANTHROPIC_API_KEY</code></span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>ANTHROPIC_MODEL</code></span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>CLAUDE_CODE_EFFORT_LEVEL</code> (low/med/high)</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>MAX_THINKING_TOKENS</code> (0=off)</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>CLAUDE_CODE_MAX_OUTPUT_TOKENS</code> (默认 32K)</span>
        <span class="footer-sep">·</span>
        <span class="footer-item"><code>CLAUDE_CODE_DISABLE_CRON</code></span>
      </div>
      <div class="footer-row">
        <span class="footer-label">致谢：</span>
        <span class="footer-item">本页基于 <a href="https://cc.storyfox.cz/" target="_blank" rel="noreferrer" style="color:#FDE68A;">cc.storyfox.cz</a> 的版式与信息组织方式复刻，感谢原作者。</span>
      </div>
      <div class="footer-row">
        <span class="footer-label">数据来源：</span>
        ${ctx.footerSources.map((s) => `<span class="footer-item">${s}</span>`).join('<span class="footer-sep">·</span>')}
      </div>
    </footer>
  </div>
  <script src="./script.js"></script>
</body>
</html>`;

const run = async () => {
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
  const changelogRaw = await fetchMarkdown('https://code.claude.com/docs/en/changelog');
  const changelog = focusMainContent(stripBoilerplate(changelogRaw), 'Changelog');
  await fs.writeFile(path.join(dataDir, 'changelog.md'), changelog);
  await fs.writeFile(path.join(publicDir, 'site-data.json'), JSON.stringify(data, null, 2));
  await fs.writeFile(path.join(publicDir, 'index.html'), html(data));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
