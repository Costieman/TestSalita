import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'docs');
const TEXT_EXTENSIONS = new Set(['.html','.js','.mjs','.cjs','.css','.json','.webmanifest','.yml','.yaml','.md','.py','.sh']);
const IGNORE_DIRS = new Set(['.git','node_modules','docs']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    const full = path.join(dir, entry.name);
    if (TEXT_EXTENSIONS.has(path.extname(entry.name)) || entry.name === 'manifest.webmanifest') files.push(full);
  }
  return files;
}

const relative = file => path.relative(ROOT, file).replaceAll('\\','/');
const cleanRef = value => String(value || '').trim().replace(/^['"`]|['"`]$/g,'').split(/[?#]/)[0].replace(/^\.\//,'');
const exists = ref => fs.existsSync(path.join(ROOT, ref));

const files = walk(ROOT);
const known = new Set(files.map(relative));
const graph = {};
const incoming = new Map();
const events = new Map();
const globals = new Map();

function addIncoming(target, source, kind) {
  if (!incoming.has(target)) incoming.set(target, []);
  incoming.get(target).push({source, kind});
}
function addEvent(name, file, mode) {
  if (!events.has(name)) events.set(name, {dispatchers:[], listeners:[]});
  events.get(name)[mode].push(file);
}
function addGlobal(name, file, mode) {
  if (!globals.has(name)) globals.set(name, {writers:[], readers:[]});
  globals.get(name)[mode].push(file);
}

for (const full of files) {
  const file = relative(full);
  const text = fs.readFileSync(full, 'utf8');
  const refs = [];
  const patterns = [
    ['html-asset', /(?:src|href)\s*=\s*["']([^"']+)["']/gi],
    ['dynamic-script', /(?:\.src|src)\s*=\s*["'`]([^"'`]+\.(?:js|mjs|css|json|webmanifest))["'`]/gi],
    ['fetch', /fetch\s*\(\s*["'`]([^"'`]+)["'`]/gi],
    ['worker-cache', /["'`](\.\/?[^"'`]+\.(?:js|css|html|json|webmanifest|png|jpg|jpeg|webp|svg|mp3|wav|ogg))["'`]/gi],
    ['workflow-command', /(?:node|python3?|bash|sh)\s+([^\s"']+)/gi],
    ['css-url', /url\(\s*["']?([^"')]+)["']?\s*\)/gi]
  ];
  for (const [kind, regex] of patterns) {
    for (const match of text.matchAll(regex)) {
      const ref = cleanRef(match[1]);
      if (!ref || /^(?:https?:|data:|blob:|#|mailto:|tel:)/i.test(ref)) continue;
      const candidates = [ref, path.posix.normalize(path.posix.join(path.posix.dirname(file), ref))];
      const target = candidates.find(item => known.has(item) || exists(item));
      if (!target) continue;
      refs.push({target, kind});
      addIncoming(target, file, kind);
    }
  }

  for (const match of text.matchAll(/dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*["'`]([^"'`]+)["'`]/g)) addEvent(match[1], file, 'dispatchers');
  for (const match of text.matchAll(/addEventListener\s*\(\s*["'`]([^"'`]+)["'`]/g)) {
    if (match[1].startsWith('salita:')) addEvent(match[1], file, 'listeners');
  }
  for (const match of text.matchAll(/window\.([A-Z][A-Za-z0-9_$]+)\s*=/g)) addGlobal(match[1], file, 'writers');
  for (const match of text.matchAll(/window\.([A-Z][A-Za-z0-9_$]+)/g)) addGlobal(match[1], file, 'readers');

  graph[file] = {references:[...new Map(refs.map(item => [`${item.kind}:${item.target}`, item])).values()]};
}

const roots = ['index.html','app.html','bisaya.html','service-worker.js','manifest.webmanifest', ...files.map(relative).filter(f => f.startsWith('.github/workflows/'))].filter(f => known.has(f));
const reachable = new Set();
const queue = [...roots];
while (queue.length) {
  const file = queue.shift();
  if (reachable.has(file)) continue;
  reachable.add(file);
  for (const ref of graph[file]?.references || []) if (!reachable.has(ref.target)) queue.push(ref.target);
}

const report = {
  generatedAt:new Date().toISOString(),
  roots,
  counts:{files:files.length, reachable:reachable.size, notStaticallyReachable:files.length-reachable.size, events:events.size, globals:globals.size},
  files:Object.fromEntries([...known].sort().map(file => [file, {
    reachable:reachable.has(file),
    incoming:(incoming.get(file)||[]).sort((a,b)=>a.source.localeCompare(b.source)),
    outgoing:graph[file]?.references || []
  }])),
  events:Object.fromEntries([...events].sort(([a],[b])=>a.localeCompare(b)).map(([name,value])=>[name,{dispatchers:[...new Set(value.dispatchers)].sort(),listeners:[...new Set(value.listeners)].sort()}])),
  globals:Object.fromEntries([...globals].sort(([a],[b])=>a.localeCompare(b)).map(([name,value])=>[name,{writers:[...new Set(value.writers)].sort(),readers:[...new Set(value.readers)].sort()}]))
};

fs.mkdirSync(OUTPUT_DIR, {recursive:true});
fs.writeFileSync(path.join(OUTPUT_DIR,'dependency-map.json'), JSON.stringify(report,null,2)+'\n');

const avatarFiles = Object.keys(report.files).filter(file => /avatar|shard|collection|reward|coin/i.test(file));
const lines = [
  '# TestSalita dependency map',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `- Text/code files scanned: **${report.counts.files}**`,
  `- Statically reachable from app/workflow roots: **${report.counts.reachable}**`,
  `- Not statically reachable: **${report.counts.notStaticallyReachable}**`,
  `- Custom events mapped: **${report.counts.events}**`,
  `- Shared globals mapped: **${report.counts.globals}**`,
  '',
  '## Important limitation',
  '',
  'A file is not safe to remove solely because it is not statically reachable. TestSalita downloads a pinned SalitaQuest document at runtime and resolves inherited relative references locally. Runtime evidence and feature testing remain mandatory.',
  '',
  '## Avatar-related files',
  '',
  ...avatarFiles.sort().map(file => {
    const item=report.files[file];
    const incomingText=item.incoming.length?item.incoming.map(x=>`${x.source} (${x.kind})`).join(', '):'none found statically';
    return `- \`${file}\` — reachable: **${item.reachable}**; incoming: ${incomingText}`;
  }),
  '',
  '## Custom avatar events',
  '',
  ...Object.entries(report.events).filter(([name])=>/avatar|collection|shard|reward|coin/i.test(name)).map(([name,value])=>`- \`${name}\` — dispatch: ${value.dispatchers.join(', ')||'none'}; listen: ${value.listeners.join(', ')||'none'}`),
  ''
];
fs.writeFileSync(path.join(OUTPUT_DIR,'dependency-map.md'), lines.join('\n'));
console.log(JSON.stringify(report.counts));
