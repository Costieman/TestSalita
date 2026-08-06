import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = relative => JSON.parse(read(relative));
const normalise = value => String(value ?? "")
  .normalize("NFKC")
  .replace(/[“”‘’`´]/g, "'")
  .replace(/[‐‑‒–—]/g, "-")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase();
const cleanToken = value => normalise(value).replace(/^[-'".,!?;:()[\]{}]+|[-'".,!?;:()[\]{}]+$/g, "");

const PLACEHOLDERS = [
  "translation pending content review",
  "see phrase translation",
  "part of the expression",
  "part-of-the-expression",
  "expression part",
  "grammar component",
  "component of the expression",
  "direct component",
  "meaning unavailable"
];
const isPlaceholder = value => PLACEHOLDERS.some(item => normalise(value).includes(item));

function extractConst(source, name, filename) {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`${filename}: missing ${marker}`);
  const expressionStart = source.indexOf("[", start + marker.length);
  if (expressionStart < 0) throw new Error(`${filename}: ${name} is not an array`);
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = expressionStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) { if (char === "\n") lineComment = false; continue; }
    if (blockComment) { if (char === "*" && next === "/") { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; index += 1; continue; }
    if (char === "/" && next === "*") { blockComment = true; index += 1; continue; }
    if (char === "'" || char === '"' || char === "`") { quote = char; continue; }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        const expression = source.slice(expressionStart, index + 1);
        return vm.runInNewContext(`(${expression})`, Object.create(null), {filename});
      }
    }
  }
  throw new Error(`${filename}: unterminated ${name} array`);
}

function loadTagalog() {
  const source = read("app.js");
  new vm.Script(source, {filename:"app.js"});
  return extractConst(source, "ITEMS", "app.js").map(item => ({...item, courseId:"tagalog"}));
}

function loadCebuano() {
  const course = readJson("languages/cebuano/course.json");
  const manifest = readJson("languages/cebuano/modules/manifest.json");
  const packs = manifest.packs.map(name => readJson(`languages/cebuano/modules/${name}`));
  return [...(course.items || []), ...packs.flatMap(pack => pack.items || [])]
    .map(item => ({...item, courseId:"cebuano"}));
}

const issues = [];
const add = (severity, code, item, message, details = {}) => issues.push({
  severity,
  code,
  course: item?.courseId || details.course || "shared",
  itemId: item?.id || null,
  term: item?.term || item?.root || null,
  message,
  ...details
});

function tokenPairs(item) {
  return Array.isArray(item?.analysis?.tokens)
    ? item.analysis.tokens.filter(pair => Array.isArray(pair))
    : [];
}

function auditRequiredFields(item) {
  if (!item.id) add("error", "missing-id", item, "Item has no id.");
  if (!(item.term || item.root)) add("error", "missing-source", item, "Item has no source-language term or root.");
  if (!String(item.meaning || "").trim()) add("error", "missing-meaning", item, "Item has no English meaning.");
  for (const field of ["meaning", "natural", "hint"]) {
    if (isPlaceholder(item[field])) add("error", "placeholder-content", item, `${field} contains placeholder text.`, {field});
  }
}

function auditTokens(item) {
  const pairs = tokenPairs(item);
  if (!pairs.length) {
    add("warning", "missing-token-analysis", item, "Item has no word-by-word token analysis.");
    return;
  }
  const seen = new Set();
  for (const [source, gloss] of pairs) {
    const key = cleanToken(source);
    if (!key) add("error", "empty-token", item, "Word-by-word analysis contains an empty source token.");
    if (!String(gloss || "").trim()) add("error", "missing-token-gloss", item, `Token '${source}' has no direct translation.`);
    if (isPlaceholder(gloss)) add("error", "placeholder-token-gloss", item, `Token '${source}' still contains placeholder text.`);
    if (seen.has(key)) add("warning", "duplicate-token", item, `Token '${source}' appears more than once in the same analysis.`);
    seen.add(key);
  }
}

const distinctionRules = [
  {code:"respect", source:/\b(po|opo|ho)\b/i, cue:/respect|polite|formal/i, label:"respect/politeness"},
  {code:"singular-you", source:/\b(ka|ikaw)\b/i, cue:/one person|singular/i, label:"singular you"},
  {code:"plural-respectful-you", source:/\bkayo\b/i, cue:/plural|several|respect/i, label:"plural/respectful you"},
  {code:"inclusive-we", source:/\b(tayo|natin)\b/i, cue:/including|inclusive/i, label:"inclusive we"},
  {code:"exclusive-we", source:/\b(kami|namin)\b/i, cue:/excluding|exclusive/i, label:"exclusive we"},
  {code:"near-speaker", source:/\b(ito|dito)\b/i, cue:/near (the )?speaker|here|this/i, label:"near-speaker demonstrative"},
  {code:"near-listener", source:/\b(iyan|diyan)\b/i, cue:/near (the )?listener/i, label:"near-listener demonstrative"},
  {code:"far-from-both", source:/\b(iyon|doon)\b/i, cue:/away from both|over there|far/i, label:"far demonstrative"}
];

function auditPromptDistinctions(item) {
  const source = String(item.term || item.root || "");
  const cue = [item.meaning, item.natural, item.hint].filter(Boolean).join(" ");
  for (const rule of distinctionRules) {
    if (rule.source.test(source) && !rule.cue.test(cue)) {
      add("warning", `underspecified-${rule.code}`, item, `English cue may omit the ${rule.label} encoded by the answer.`);
    }
  }
}

function auditMeaningNatural(item) {
  const meaning = normalise(item.meaning);
  const natural = normalise(item.natural);
  if (!natural || !meaning) return;
  const qualifiers = ["respect", "one person", "singular", "plural", "several", "including", "excluding", "near the listener", "away from both"];
  for (const qualifier of qualifiers) {
    if (meaning.includes(qualifier) && !natural.includes(qualifier)) {
      add("warning", "natural-drops-qualifier", item, `Natural translation drops qualifier '${qualifier}' present in meaning.`);
    }
  }
}

function auditDuplicatePrompts(items) {
  const groups = new Map();
  for (const item of items) {
    const prompt = normalise(item.meaning).replace(/[.!?]+$/g, "");
    const answer = normalise(item.term || item.root);
    if (!prompt || !answer) continue;
    if (!groups.has(prompt)) groups.set(prompt, []);
    groups.get(prompt).push(item);
  }
  for (const [prompt, group] of groups) {
    const answers = [...new Set(group.map(item => normalise(item.term || item.root)))];
    if (answers.length < 2) continue;
    const details = {prompt, answers, itemIds:group.map(item => item.id)};
    for (const item of group) add("warning", "duplicate-english-prompt", item, `English prompt maps to multiple source answers: ${answers.join(" | ")}.`, details);
  }
}

function auditGlossConsistency(items) {
  const glossary = new Map();
  for (const item of items) {
    if (cleanToken(item.term).split(/\s+/).length === 1 && item.meaning) {
      const token = cleanToken(item.term);
      if (!glossary.has(token)) glossary.set(token, new Map());
      glossary.get(token).set(normalise(item.meaning), item);
    }
    for (const [source, gloss] of tokenPairs(item)) {
      const token = cleanToken(source);
      if (!token || !gloss) continue;
      if (!glossary.has(token)) glossary.set(token, new Map());
      glossary.get(token).set(normalise(gloss), item);
    }
  }
  for (const [token, meanings] of glossary) {
    if (meanings.size < 2) continue;
    const values = [...meanings.keys()];
    const materiallyDifferent = values.some((value, i) => values.some((other, j) => i !== j && !value.includes(other) && !other.includes(value)));
    if (materiallyDifferent) {
      const item = [...meanings.values()][0];
      add("warning", "inconsistent-gloss", item, `Token '${token}' has potentially inconsistent glosses.`, {token, glosses:values});
    }
  }
}

function auditRuntimeGuards() {
  for (const file of ["translation-gloss-completion-v1.js", "word-breakdown-cleanup-v1.js", "prompt-distinction-clarity-v1.js"]) {
    const source = read(file);
    new vm.Script(source, {filename:file});
  }
  const glossRuntime = read("translation-gloss-completion-v1.js");
  for (const placeholder of PLACEHOLDERS.slice(0, 8)) {
    if (!glossRuntime.toLocaleLowerCase().includes(placeholder)) {
      add("error", "runtime-placeholder-gap", null, `Translation runtime does not recognise placeholder '${placeholder}'.`, {file:"translation-gloss-completion-v1.js"});
    }
  }
  if (!glossRuntime.includes("SalitaQuestGlossAudit")) add("warning", "missing-runtime-gloss-audit", null, "Runtime gloss resolver does not expose SalitaQuestGlossAudit.");
  const promptRuntime = read("prompt-distinction-clarity-v1.js");
  if (!promptRuntime.includes("SalitaQuestPromptDistinctionAudit")) add("warning", "missing-runtime-prompt-audit", null, "Prompt clarity runtime does not expose SalitaQuestPromptDistinctionAudit.");
}

const items = [...loadTagalog(), ...loadCebuano()];
for (const item of items) {
  auditRequiredFields(item);
  auditTokens(item);
  auditPromptDistinctions(item);
  auditMeaningNatural(item);
}
auditDuplicatePrompts(items);
auditGlossConsistency(items);
auditRuntimeGuards();

const order = {error:0, warning:1, info:2};
issues.sort((a, b) => order[a.severity] - order[b.severity] || a.course.localeCompare(b.course) || String(a.itemId).localeCompare(String(b.itemId)));
const counts = issues.reduce((acc, issue) => ((acc[issue.severity] += 1), acc), {error:0, warning:0, info:0});
const report = {
  generatedAt:new Date().toISOString(),
  itemCount:items.length,
  courseCounts:Object.groupBy ? Object.fromEntries(Object.entries(Object.groupBy(items, item => item.courseId)).map(([key, value]) => [key, value.length])) : items.reduce((acc, item) => ((acc[item.courseId] = (acc[item.courseId] || 0) + 1), acc), {}),
  counts,
  issues
};

const reportDir = path.join(root, "reports");
fs.mkdirSync(reportDir, {recursive:true});
fs.writeFileSync(path.join(reportDir, "course-content-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
const rows = issues.map(issue => `| ${issue.severity.toUpperCase()} | ${issue.course} | ${issue.itemId || "—"} | ${issue.code} | ${String(issue.message).replace(/\|/g, "\\|")} |`);
const markdown = [
  "# Course content audit",
  "",
  `Audited **${items.length} items**. Found **${counts.error} errors** and **${counts.warning} warnings**.`,
  "",
  "| Severity | Course | Item | Check | Finding |",
  "|---|---|---|---|---|",
  ...rows,
  ""
].join("\n");
fs.writeFileSync(path.join(reportDir, "course-content-audit.md"), markdown);

console.log(`Audited ${items.length} items: ${counts.error} errors, ${counts.warning} warnings.`);
console.log("Reports: reports/course-content-audit.json and reports/course-content-audit.md");
if (counts.error) process.exitCode = 1;
