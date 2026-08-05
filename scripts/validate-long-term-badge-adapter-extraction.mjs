import fs from "node:fs";
import vm from "node:vm";

const read = file => fs.readFileSync(file,"utf8");
const fail = message => { throw new Error(message); };
const root = read("long-term-badges-v1.js");
const adapter = read("src/adapters/badges/badge-catalogue-runtime-v1.js");
const feature = read("src/features/badges/long-term-badges-v1.js");
const loader = read("profile-emblem-control.js");
const worker = read("service-worker.js");
for (const [name,source] of [["root",root],["adapter",adapter],["feature",feature],["loader",loader],["worker",worker]]) new vm.Script(source,{filename:name});

for (const forbidden of ["localStorage","sessionStorage","eval(","globalValue","levelInfo","totalLearningPoints","syncEarned","renderCatalogue","BADGES","badgeProgress","lt_answers_"])
  if (root.includes(forbidden)) fail(`Root coordinator owns forbidden behavior: ${forbidden}`);
for (const forbidden of ["localStorage","sessionStorage","eval(","globalValue","typeof state","typeof BADGES","levelInfo","totalLearningPoints","syncEarned","renderCatalogue"])
  if (feature.includes(forbidden)) fail(`Feature owns forbidden runtime bridge: ${forbidden}`);
for (const forbidden of ["lt_answers_","lt_avatars_","long-term-badges-ready","longTermBadges","document.querySelector","document.getElementById"])
  if (adapter.includes(forbidden)) fail(`Adapter owns badge-family or DOM behavior: ${forbidden}`);

if ((adapter.match(/localStorage\.getItem/g)||[]).length !== 1 || (adapter.match(/sessionStorage\.getItem/g)||[]).length !== 1) fail("Badge adapter profile-read ownership changed");
if (/localStorage\.(?:setItem|removeItem)|sessionStorage\.(?:setItem|removeItem)/.test(adapter)) fail("Badge adapter must not mutate storage");
if (!feature.includes('runtime.refresh?.({bootstrap:true})')) fail("Feature does not use the badge refresh contract");
if (!feature.includes('new CustomEvent("salita:long-term-badges-ready"')) fail("Feature no longer owns the ready event");

const runtimeIndex = loader.indexOf('"long-term-badge-runtime"');
const featureIndex = loader.indexOf('"long-term-badge-family"');
const rootIndex = loader.indexOf('"long-term-badges"');
const shopIndex = loader.indexOf('"coin-avatar-shop"');
if (!(runtimeIndex >= 0 && featureIndex > runtimeIndex && rootIndex > featureIndex && shopIndex > rootIndex)) fail("Profile loader order changed");
if ((loader.match(/badge-catalogue-runtime-v1\.js/g)||[]).length !== 1 || (loader.match(/src\/features\/badges\/long-term-badges-v1\.js/g)||[]).length !== 1 || (loader.match(/\.\/long-term-badges-v1\.js/g)||[]).length !== 1) fail("Profile loader does not own exactly one adapter/feature/root path");

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./long-term-badges-v1.js"',
  '"./src/adapters/badges/badge-catalogue-runtime-v1.js"',
  '"./src/features/badges/long-term-badges-v1.js"'
]) if (!worker.includes(marker)) fail(`Service worker is missing ${marker}`);

const writes=[];
const parserContext = {
  window:null,
  document:{
    readyState:"loading",
    baseURI:"https://example.test/profile.html",
    currentScript:{src:"https://example.test/long-term-badges-v1.js"},
    write:value=>writes.push(value)
  },
  setTimeout:()=>{},console,URL,Promise
};
parserContext.window=parserContext;
vm.createContext(parserContext);
new vm.Script(root,{filename:"long-term-badges-v1.js"}).runInContext(parserContext);
if (writes.length !== 2 || !writes[0].includes("badge-catalogue-runtime-v1.js?v=5.6.0") || !writes[1].includes("src/features/badges/long-term-badges-v1.js?v=5.6.0")) fail("Parser-time root compatibility order changed");
if (!parserContext.__salitaQuestLongTermBadgesV1Installed) fail("Historical install flag is not preserved");

console.log("Long-term badge adapter extraction validation passed.");
