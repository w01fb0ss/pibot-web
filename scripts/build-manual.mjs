import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';

const source = new URL('../content/guides/', import.meta.url);

// Keep existing public paths for established topics, including the two workflow guides.
const chapters = [
  ['01-getting-started', 'getting-started', '安装与第一次使用', 'Install Pi Bot and run your first task'],
  ['02-bots-and-roles', 'bots-and-roles', '创建 Bot、设置角色和记忆', 'Create Bots, assign roles, and manage memory'],
  ['03-chatting', 'chatting', '聊天、话题、浏览器和工作收据', 'Chats, topics, the Bot browser, and work receipts'],
  ['04-folders-and-changes', 'review-code-changes', '工作文件夹、代码审查和改动管理', 'Working folders, code review, and file changes'],
  ['05-approvals-and-permissions', 'approvals-and-permissions', '权限、审批和操作记录', 'Permissions, approvals, and activity logs'],
  ['06-groups', 'group-context', '多 Bot 群聊、执行计划与上下文交接', 'Multi-Bot group chats, plans, and context handoffs'],
  ['07-routines-and-todos', 'routines', '定时任务、文件夹触发和待办', 'Scheduled routines, folder triggers, and todos'],
  ['08-connections', 'connections', '连接应用、MCP、技能和知识库', 'Connect apps, MCP tools, skills, and knowledge bases'],
  ['09-models-and-keys', 'models-and-keys', '配置 Ollama、本地模型和 API Key', 'Configure Ollama, local models, and API keys'],
  ['10-runners', 'runners', '在另一台电脑或服务器上使用执行端', 'Use a Runner on another computer or server'],
  ['11-phone-app', 'phone-and-runner', 'Android 配对、远程审批和离线用法', 'Android pairing, remote approvals, and offline use'],
  ['12-updates-and-data', 'updates-and-data', '更新、数据存储和问题反馈', 'Updates, data storage, and issue reports'],
  ['13-privacy-and-security', 'privacy-and-security', '数据留在哪里：隐私与安全', 'Where your data goes: privacy and security'],
  ['14-faq', 'faq', 'Pi Bot 常见问题', 'Pi Bot frequently asked questions'],
  ['15-self-hosting-relay', 'self-hosting-relay', '进阶：自建中继', 'Advanced: self-host the relay'],
  ['16-editor-acp', 'editor-acp', '进阶：在编辑器中使用 Pi Bot（ACP）', 'Advanced: use Pi Bot in an editor with ACP'],
];

const slugs = new Map(chapters.map(([id, slug]) => [id + '.md', slug]));
const replacements = new Map([
  ['routines-page', 'routines-empty'],
  ['connections-apps', 'connections-empty'],
  ['activity-log', 'activity-log-empty'],
]);
const screenshotCaption = {
  zh: '实拍于独立的 macOS 测试环境。',
  en: 'Captured in a separate macOS test profile.',
};
// The repository guide links a GIF preview to an mp4 under docs/assets (GitHub cannot play video
// inline). Here the same markdown becomes a real player: the web cut and a poster sit in
// public/assets/guides as <name>.mp4 and <name>-poster.jpg, with the size listed below.
const guideVideos = new Map([
  ['pibot-group-pause', { width: 1920, height: 1080 }],
]);
const githubDocs = 'https://github.com/w01fb0ss/PiBot/blob/main/docs/';

const freshShots = new Set([
  'welcome-intro', 'welcome-model-openrouter', 'welcome-model-chatgpt', 'welcome-model-ollama',
  'welcome-model-apikey', 'routines-empty', 'connections-empty', 'activity-log-empty',
  'background-approval', 'background-command', 'bot-browser',
]);

function headingId(value) {
  return value.trim().toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-');
}

function plainIntro(text) {
  const stripped = text.replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*]/g, '');
  const firstSentence = stripped.match(/^.+?(?:。|\.(?=\s|$))/u)?.[0];
  return firstSentence ?? stripped;
}

function localizeGuideLink(href, prefix) {
  const [file, anchor] = href.split('#');
  const slug = slugs.get(file);
  if (slug) return `${prefix}/guides/${slug}/${anchor ? '#' + anchor : ''}`;
  if (/^https:\/\/pibot\.space\/?$/.test(href)) return prefix + '/';
  const site = href.match(/^https:\/\/pibot\.space(?:\/(?:cn|en))?(\/(?:download|guides|roles)\/.*)$/);
  if (site) return prefix + site[1];
  if (/^\/(?:download|guides)\//.test(href)) return prefix + href;
  // Other repository docs (privacy notes) are read on GitHub.
  const doc = href.match(/^\.\.\/\.\.\/((?:privacy)\/(?:zh|en)\/[a-z0-9-]+\.md(?:#.*)?)$/);
  if (doc) return githubDocs + doc[1];
  return href;
}

function renderFaq(body, md, env) {
  return body.split(/(?=^## )/m).filter(Boolean).map(section => {
    if (!section.startsWith('## ')) return md.render(section, env);
    const [title, ...questions] = section.split(/^\*\*(.+?)\*\*\s*$/m);
    const cards = [];
    for (let index = 0; index < questions.length; index += 2) {
      const question = md.utils.escapeHtml(questions[index]);
      const answer = md.render(questions[index + 1], env);
      cards.push(`<details><summary>${question}<span class="faq-icon" aria-hidden="true">+</span></summary><div class="faq-answer">${answer}</div></details>`);
    }
    return `<section class="faq-guide-group">${md.render(title, env)}<div class="faq-list">${cards.join('\n')}</div></section>`;
  }).join('\n');
}

export async function buildManual(output, locale) {
  const prefix = locale === 'en' ? '/en' : '/cn';
  const screenshotDir = path.join(output, 'assets', 'guides');
  const pngDimensions = new Map();
  for (const name of await readdir(screenshotDir)) {
    if (!name.endsWith(`-${locale}.png`)) continue;
    const png = await readFile(path.join(screenshotDir, name));
    pngDimensions.set(name, [png.readUInt32BE(16), png.readUInt32BE(20)]);
  }
  const md = new MarkdownIt({ html: false });
  const fallback = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const original = token.attrGet('src')?.match(/^\.\.\/images\/(?:zh|en)\/([a-z0-9-]+)\.png$/)?.[1];
    const name = replacements.get(original) ?? original;
    const asset = `${name}-${locale}.png`;
    const size = pngDimensions.get(asset);
    if (!size) return '';
    token.attrSet('src', '/assets/guides/' + asset);
    token.attrSet('width', String(size[0]));
    token.attrSet('height', String(size[1]));
    token.attrSet('loading', env.hasImage ? 'lazy' : 'eager');
    env.hasImage = true;
    token.attrSet('decoding', 'async');
    const screenshotClass = size[1] > size[0] ? 'guide-screenshot guide-screenshot-portrait' : 'guide-screenshot';
    const image = `<a class="${screenshotClass}" href="/assets/guides/${asset}">${fallback(tokens, index, options, env, renderer)}</a>`;
    const alt = md.utils.escapeHtml(renderer.renderInlineAsText(token.children, options, env));
    const provenance = freshShots.has(name) ? ` · ${screenshotCaption[locale]}` : '';
    return image + `<small class="guide-shot-caption">${alt}${provenance}</small>`;
  };
  md.renderer.rules.guide_video = (tokens, index) => {
    const { name, alt } = tokens[index].meta;
    const { width, height } = guideVideos.get(name);
    // The repository alt text tells GitHub readers to click through; the player needs no such hint.
    const label = md.utils.escapeHtml(alt.replace(/\s*[（(][^（）()]*[）)]\s*$/u, ''));
    return `<video class="guide-video" controls playsinline preload="metadata" width="${width}" height="${height}" poster="/assets/guides/${name}-poster.jpg" aria-label="${label}"><source src="/assets/guides/${name}.mp4" type="video/mp4"></video><small class="guide-shot-caption">${label}</small>`;
  };
  md.core.ruler.push('guide_videos', state => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue;
      const children = token.children;
      for (let index = 0; index + 2 < children.length; index++) {
        const [open, image, close] = children.slice(index, index + 3);
        const name = open.type === 'link_open' && open.attrGet('href')?.match(/^\.\.\/\.\.\/assets\/([a-z0-9-]+)\.mp4$/)?.[1];
        if (!name || !guideVideos.has(name) || image.type !== 'image' || close.type !== 'link_close') continue;
        const video = new state.Token('guide_video', 'video', 0);
        video.meta = { name, alt: image.content };
        children.splice(index, 3, video);
      }
    }
  });
  md.core.ruler.push('guide_headings_and_links', state => {
    for (const [index, token] of state.tokens.entries()) {
      if (token.type === 'heading_open') {
        const label = state.tokens[index + 1].content;
        const id = headingId(label);
        token.attrSet('id', id);
        if (token.tag === 'h2') state.env.sections.push({ id, label });
      }
      if (token.type !== 'inline') continue;
      for (const child of token.children ?? []) {
        if (child.type === 'link_open') child.attrSet('href', localizeGuideLink(child.attrGet('href'), prefix));
      }
    }
  });
  return Promise.all(chapters.map(async ([file, slug, zh, en]) => {
    const text = await readFile(new URL(`${locale}/${file}.md`, source), 'utf8');
    const body = text
      .replace(/^# [^\n]+\n+/, '')
      .replace(/^(?:本页内容|On this page)[：:]\s*\n+(?:- \[[^\n]+\n)+\n?/m, '')
      .replace(/^> (?:截图待补|Screenshot to be added):?[^\n]*\n/gim, '');
    const heading = locale === 'en' ? en : zh;
    const description = slug === 'faq'
      ? locale === 'en' ? 'Find answers about model setup, permissions, routines, Android pairing, and common Pi Bot issues.' : '按问题查找模型配置、权限和审批、例行任务、Android 配对与常见故障的解决步骤。'
      : plainIntro(body.trim().split(/\n\s*\n/, 1)[0]);
    const env = { sections: [] };
    const html = slug === 'faq' ? renderFaq(body, md, env) : md.render(body, env);
    return { slug, heading, description, sections: env.sections, html: html.replaceAll('<p></p>\n', '') };
  }));
}
