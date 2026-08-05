import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const rootFile = "avatar-collection-summary-v1.js";
const moduleFile = "src/features/avatar/avatar-collection-summary-v1.js";
const compatibility = read(rootFile);
const feature = read(moduleFile);
const loader = read("coin-avatar-shop-topbar-v1.js");
const worker = read("service-worker.js");

new vm.Script(compatibility,{filename:rootFile});
new vm.Script(feature,{filename:moduleFile});

for (const marker of [
  'const TARGET = "./src/features/avatar/avatar-collection-summary-v1.js?v=5.6.9"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "avatar-collection-summary-v1"'
]) if (!compatibility.includes(marker)) fail(`Compatibility loader is missing ${marker}`);
for (const forbidden of ["PROFILE_STORE", "ACTIVE_PROFILE", "RARITIES", "readCollection", "localStorage", "sessionStorage", "SalitaAvatarCollectionSummary =", "setInterval"])
  if (compatibility.includes(forbidden)) fail(`Root compatibility file still owns ${forbidden}`);

const events = [
  "salita:open-avatar-collection",
  "salita:avatar-collection-changed",
  "salita:avatar-progression-ready",
  "salita:avatar-random-pools-ready"
];
for (const marker of [
  "__salitaAvatarCollectionSummaryV1Installed",
  'const PROFILE_STORE = "salitaQuestLocalProfilesV1"',
  'const ACTIVE_PROFILE = "salitaQuestActiveProfileId"',
  'const RARITIES = Object.freeze(["common", "uncommon", "rare"])',
  "localStorage.getItem(PROFILE_STORE)",
  "sessionStorage.getItem(ACTIVE_PROFILE)",
  "model.normaliseCollectionState(profile.avatarCollection, profile.avatarId)",
  'summary.className = "sq-avatar-collection-summary"',
  'summary.setAttribute("aria-label", "Avatar collection progress")',
  'window.SalitaAvatarCollectionSummary = Object.freeze({render, counts})'
]) if (!feature.includes(marker)) fail(`Feature implementation is missing ${marker}`);
for (const event of events) if (!feature.includes(`"${event}"`)) fail(`Feature is missing listener ${event}`);
if ((feature.match(/document\.addEventListener/g)||[]).length !== 4) fail("Feature must own exactly four document listeners");
if ((feature.match(/window\.setInterval/g)||[]).length !== 1 || !feature.includes("}, 1000)")) fail("Feature must own the one-second refresh interval");
if (/MutationObserver/.test(feature)) fail("Collection summary must not own a mutation observer");

const summaryIndex = loader.indexOf('src/features/avatar/avatar-collection-summary-v1.js?v=5.6.9');
const economyIndex = loader.indexOf('src/features/economy/economy-tracking-phase6-v1.js?v=5.7.3');
const tabsIndex = loader.indexOf('src/features/avatar/avatar-collection-tabs-phase6-1-v1.js?v=5.7.4');
if (!(summaryIndex >= 0 && economyIndex > summaryIndex && tabsIndex > economyIndex)) fail("Collection summary, economy tracker and tabs load order changed");
if (loader.includes('"./avatar-collection-summary-v1.js?v=5.6.9"')) fail("Current loader still targets the root compatibility URL");

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./avatar-collection-summary-v1.js"',
  '"./src/features/avatar/avatar-collection-summary-v1.js"',
  '"./avatar-collection-summary-v1.css"'
]) if (!worker.includes(marker)) fail(`Offline delivery is missing ${marker}`);

const listeners = [];
const intervals = [];
let summaryElement = null;
const header = {
  insertAdjacentElement(position, element){
    if (position !== "afterend") fail("Summary insertion position changed");
    summaryElement = element;
  }
};
const host = {
  hidden:false,
  querySelector(selector){
    if (selector === ".sq-avatar-collection-header") return header;
    if (selector === ".sq-avatar-collection-summary") return summaryElement;
    return null;
  }
};
const document = {
  querySelector(selector){ return selector === ".sq-avatar-collection" ? host : null; },
  createElement(tag){
    if (tag !== "section") fail("Summary element type changed");
    return {className:"",attributes:{},innerHTML:"",setAttribute(name,value){this.attributes[name]=value;}};
  },
  addEventListener(name,handler){ listeners.push([name,handler]); }
};
const profileStore = {profiles:[{id:"profile-1",avatarId:"a",avatarCollection:{ownedAvatarIds:["a","c"]}}]};
const localStorage = {getItem(key){ return key === "salitaQuestLocalProfilesV1" ? JSON.stringify(profileStore) : null; }};
const sessionStorage = {getItem(key){ return key === "salitaQuestActiveProfileId" ? "profile-1" : null; }};
const model = {
  catalogue:[
    {id:"a",rarity:"common"},
    {id:"b",randomRarity:"common"},
    {id:"c",rarity:"uncommon"},
    {id:"d",rarity:"rare"}
  ],
  normaliseCollectionState(collection){ return {ownedAvatarIds:[...(collection?.ownedAvatarIds||[])]}; }
};
const window = {
  SalitaAvatarModel:model,
  setTimeout(){},
  setInterval(handler,delay){ intervals.push([handler,delay]); },
  requestAnimationFrame:null
};
const context = {window,document,localStorage,sessionStorage,console,Set,JSON,Math,Object};
vm.createContext(context);
vm.runInContext(feature,context,{filename:moduleFile});
if (listeners.length !== 4 || listeners.map(([name])=>name).join("|") !== events.join("|")) fail("Collection summary listener ownership changed");
if (intervals.length !== 1 || intervals[0][1] !== 1000) fail("Collection summary refresh interval changed");
const api = window.SalitaAvatarCollectionSummary;
if (!api || typeof api.render !== "function" || typeof api.counts !== "function") fail("Stable collection summary API was not installed");
const totals = api.counts();
if (!totals || totals.total !== 4 || totals.collected !== 2) fail("Collection summary totals changed");
const expectedRows = {common:[1,2],uncommon:[1,1],rare:[0,1]};
for (const row of totals.rows) {
  const expected = expectedRows[row.rarity];
  if (!expected || row.collected !== expected[0] || row.total !== expected[1]) fail(`Rarity total changed for ${row.rarity}`);
}
if (api.render() !== true || !summaryElement) fail("Collection summary did not render");
if (summaryElement.className !== "sq-avatar-collection-summary" || summaryElement.attributes["aria-label"] !== "Avatar collection progress") fail("Summary DOM contract changed");
for (const marker of ["2 / 4","50% complete","common","1 / 2","uncommon","1 / 1","rare","0 / 1"])
  if (!summaryElement.innerHTML.includes(marker)) fail(`Rendered summary is missing ${marker}`);
const apiAfterFirstInstall = api;
vm.runInContext(feature,context,{filename:moduleFile});
if (window.SalitaAvatarCollectionSummary !== apiAfterFirstInstall || listeners.length !== 4 || intervals.length !== 1) fail("Install flag did not prevent duplicate ownership");

console.log("Avatar Collection summary extraction validation passed: direct topbar delivery, compatibility-only root, exact storage keys, stable totals/render API, four listeners, one interval and r65 offline delivery.");
