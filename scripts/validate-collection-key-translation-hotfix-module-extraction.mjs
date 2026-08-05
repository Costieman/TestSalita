import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const rootFile = "collection-key-translation-hotfix.js";
const moduleFile = "src/features/interface/collection-key-translation-hotfix.js";
const compatibility = read(rootFile);
const feature = read(moduleFile);
const manifest = read("src/config/course-manifest.js");
const worker = read("service-worker.js");

new vm.Script(compatibility,{filename:rootFile});
new vm.Script(feature,{filename:moduleFile});

for (const marker of [
  'const TARGET = "./src/features/interface/collection-key-translation-hotfix.js?v=5.5.11"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "collection-key-translation-hotfix"'
]) if (!compatibility.includes(marker)) fail(`Compatibility loader is missing ${marker}`);
for (const forbidden of ["KEY_TARGET", "PLACEHOLDERS", "cleanTokenTranslations", "canonicalRunDates", "patchKeyCard", "MutationObserver", "salita:state-changed"])
  if (compatibility.includes(forbidden)) fail(`Root compatibility file still owns ${forbidden}`);

for (const marker of [
  '__salitaQuestCollectionKeyTranslationHotfixV2',
  'const KEY_TARGET = 6',
  '"part of the expression"',
  'Translation pending content review',
  'typeof ITEMS === "undefined"',
  'typeof state === "undefined"',
  'consecutive Daily Keys collected',
  'sq-translation-review-needed',
  './avatar-case-desktop-safety.css?v=5.5.11',
  './mystery-rarity-roll-v1.js?v=5.5.11',
  './avatar-collection-page-v2.css?v=5.5.12',
  './avatar-collection-page-v2.js?v=5.5.12',
  './avatar-case-page-tab-v1.js?v=1.1',
  './avatar-card-actions-v1.js?v=1.1'
]) if (!feature.includes(marker)) fail(`Feature implementation is missing ${marker}`);
if ((feature.match(/new MutationObserver/g)||[]).length !== 1) fail("Feature must own exactly one mutation observer");
if ((feature.match(/document\.addEventListener/g)||[]).length !== 3) fail("Feature must own exactly three document listeners");
if (/localStorage|sessionStorage|window\.setInterval/.test(feature)) fail("Targeted hotfix storage or polling contract changed");

const featureEntry = '"src/features/interface/collection-key-translation-hotfix.js?v=5.5.11"';
if ((manifest.match(/collection-key-translation-hotfix\.js\?v=5\.5\.11/g)||[]).length !== 1 || !manifest.includes(featureEntry)) fail("Tagalog manifest delivery changed");
if (manifest.includes('"collection-key-translation-hotfix.js?v=5.5.11"')) fail("Current manifest still targets the root compatibility URL");
const sharingIndex = manifest.indexOf('"achievement-sharing-v4.js?v=5.4.29"');
const hotfixIndex = manifest.indexOf(featureEntry);
const cebuanoIndex = manifest.indexOf('const cebuanoScripts');
if (!(sharingIndex >= 0 && hotfixIndex > sharingIndex && cebuanoIndex > hotfixIndex)) fail("Tagalog final hotfix ordering changed");

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./collection-key-translation-hotfix.js"',
  '"./src/features/interface/collection-key-translation-hotfix.js"'
]) if (!worker.includes(marker)) fail(`Offline delivery is missing ${marker}`);

const listeners = [];
const appended = [];
const rafCallbacks = [];
let observerCount = 0;
class Element {
  matches(){ return false; }
  querySelectorAll(){ return []; }
}
class MutationObserver {
  constructor(callback){ this.callback=callback; observerCount += 1; }
  observe(){}
}
const createNode = tag => ({
  tag,
  dataset:{},
  style:{},
  classList:{add(){},toggle(){}},
  setAttribute(){},
  addEventListener(){},
  appendChild(){},
  querySelector(){ return null; },
  querySelectorAll(){ return []; }
});
const document = {
  documentElement:{},
  head:{appendChild(node){ appended.push(node); }},
  body:{appendChild(node){ appended.push(node); }},
  querySelector(){ return null; },
  querySelectorAll(){ return []; },
  createElement:createNode,
  createTreeWalker:null,
  getElementById(){ return null; },
  addEventListener(name,handler,options){ listeners.push([name,handler,options]); }
};
const ITEMS = [
  {meaning:"Whole expression",analysis:{tokens:[["x","part of the expression"]]}},
  {meaning:"Phrase",analysis:{tokens:[["a","grammar component"],["b","literal"]]}}
];
const state = {weeklyAvatarChest:{keyDates:["2026-08-04","2026-08-05"],keyRunClaims:[]}};
const window = {
  requestAnimationFrame(callback){ rafCallbacks.push(callback); }
};
const context = {
  window,document,ITEMS,state,Element,MutationObserver,
  Node:{ELEMENT_NODE:1},NodeFilter:{SHOW_TEXT:4},Date,Set,Math,Number,String,Array,Object,console
};
vm.createContext(context);
vm.runInContext(feature,context,{filename:moduleFile});
if (window.__salitaQuestCollectionKeyTranslationHotfixV2 !== true) fail("Install flag was not set");
if (listeners.length !== 3 || listeners.map(([name])=>name).join("|") !== "DOMContentLoaded|salita:state-changed|salita:daily-quests-rendered") fail("Listener ownership changed");
if (listeners[0][2]?.once !== true) fail("DOMContentLoaded listener must remain one-shot");
if (observerCount !== 1) fail("Mutation observer ownership changed");
if (rafCallbacks.length !== 1) fail("Initial patch scheduling changed");
const expectedAssets = [
  './avatar-case-desktop-safety.css?v=5.5.11',
  './mystery-rarity-roll-v1.js?v=5.5.11',
  './avatar-collection-page-v2.css?v=5.5.12',
  './avatar-collection-page-v2.js?v=5.5.12',
  './avatar-case-page-tab-v1.js?v=1.1',
  './avatar-card-actions-v1.js?v=1.1'
];
const delivered = appended.map(node => node.href || node.src).filter(Boolean);
if (delivered.join("|") !== expectedAssets.join("|")) fail(`Dependent asset order changed: ${delivered.join("|")}`);
if (ITEMS[0].analysis.tokens[0][1] !== "Whole expression") fail("Single-token meaning repair changed");
if (ITEMS[1].analysis.tokens[0][1] !== "Translation pending content review") fail("Multi-token placeholder repair changed");
const firstListeners = listeners.length;
const firstAssets = appended.length;
vm.runInContext(feature,context,{filename:moduleFile});
if (listeners.length !== firstListeners || appended.length !== firstAssets || observerCount !== 1) fail("Install guard did not prevent duplicate ownership");

console.log("Collection/key/translation hotfix extraction validation passed: direct Tagalog delivery, compatibility-only root, stable repairs, dependent assets, three listeners, one observer and r66 offline delivery.");
