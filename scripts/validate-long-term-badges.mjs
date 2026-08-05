import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };

const coordinator = read("long-term-badges-v1.js");
const adapter = read("src/adapters/badges/badge-catalogue-runtime-v1.js");
const feature = read("src/features/badges/long-term-badges-v1.js");
const loader = read("profile-emblem-control.js");
for (const [name,source] of [["root",coordinator],["adapter",adapter],["feature",feature],["loader",loader]]) new vm.Script(source,{filename:name});

for (const marker of [
  'const RELEASE = "5.6.0-long-term-badges"',
  'answers:[250,500,1000',
  'avatars:[2,5,10',
  'id:"lt_avatars_all"',
  'id:"lt_mastery_all"',
  'id:"lt_legend_of_salita"',
  'badgeProgress?.earnedAt',
  'existing.has(badge.id)',
  'list.push(...additions)'
]) if (!feature.includes(marker)) fail(`Long-term badge feature is missing: ${marker}`);
for (const forbidden of ["eval(","localStorage","sessionStorage","globalValue","typeof state","typeof BADGES","levelInfo","totalLearningPoints","syncEarned","renderCatalogue"])
  if (feature.includes(forbidden)) fail(`Long-term badge feature still owns runtime bridge: ${forbidden}`);

for (const marker of [
  'const API = "SalitaBadgeCatalogueRuntimeV1"',
  'globalValue("state")', 'globalValue("BADGES")', 'functionValue("levelInfo")',
  'functionValue("totalLearningPoints")', 'functionValue("syncEarned")', 'functionValue("renderCatalogue")',
  'sessionStorage.getItem(ACTIVE_PROFILE)', 'localStorage.getItem(PROFILE_STORE)'
]) if (!adapter.includes(marker)) fail(`Badge catalogue adapter is missing: ${marker}`);

for (const marker of [
  'const INSTALL_FLAG = "__salitaQuestLongTermBadgesV1Installed"',
  'const RETRY_MS = 120',
  'src/adapters/badges/badge-catalogue-runtime-v1.js?v=5.6.0',
  'src/features/badges/long-term-badges-v1.js?v=5.6.0',
  'document.write', 'script.async = false'
]) if (!coordinator.includes(marker)) fail(`Historical long-term badge coordinator is missing: ${marker}`);
for (const forbidden of ["answers:[","avatars:[","lt_avatars_all","localStorage","sessionStorage","globalValue","BADGES","badgeProgress"])
  if (coordinator.includes(forbidden)) fail(`Historical coordinator still owns badge behavior: ${forbidden}`);

for (const marker of [
  'const BADGE_EXPANSION_VERSION = "5.6.0"',
  '"long-term-badge-runtime"',
  '`./src/adapters/badges/badge-catalogue-runtime-v1.js?v=${BADGE_EXPANSION_VERSION}`',
  '"long-term-badge-family"',
  '`./src/features/badges/long-term-badges-v1.js?v=${BADGE_EXPANSION_VERSION}`',
  '"long-term-badges"',
  '`./long-term-badges-v1.js?v=${BADGE_EXPANSION_VERSION}`',
  'badgeExpansionVersion:BADGE_EXPANSION_VERSION'
]) if (!loader.includes(marker)) fail(`Badge loader is missing: ${marker}`);
const runtimeIndex = loader.indexOf('"long-term-badge-runtime"');
const featureIndex = loader.indexOf('"long-term-badge-family"');
const rootIndex = loader.indexOf('"long-term-badges"');
const shopIndex = loader.indexOf('"coin-avatar-shop"');
if (!(runtimeIndex >= 0 && featureIndex > runtimeIndex && rootIndex > featureIndex && shopIndex > rootIndex)) fail("Long-term badge adapter/feature/root load order changed");

const BADGES = [
  {id:"first_step",test:()=>true},
  {id:"answers_100",test:()=>true},
  {id:"streak_7",test:()=>false}
];
const state = {
  totalAnswers:1250,
  correctAnswers:900,
  streak:12,
  bestStreak:12,
  itemState:{a:{mastery:5,longTermMastery:1},b:{mastery:3}},
  badgeProgress:{earnedAt:{first_step:"2026-01-01T00:00:00.000Z"}},
  badgeMetrics:{quickReviewItems:12,dailySessions:2}
};
const localValues = new Map([
  ["salitaQuestActiveProfileId","test-profile"],
  ["salitaQuestLocalProfilesV1",JSON.stringify({profiles:[{id:"test-profile",avatarCollection:{ownedIds:["a","b","c","d","e","f","g","h","i","j"]}}]})]
]);
const events = [];
let syncCalls = 0;
let renderCalls = 0;
const context = {
  BADGES,state,
  window:null,
  document:{
    readyState:"complete",
    baseURI:"https://example.test/profile.html",
    currentScript:{src:"https://example.test/long-term-badges-v1.js"},
    documentElement:{dataset:{},appendChild:()=>{}},
    head:{appendChild:()=>{}},
    querySelector:()=>null,
    createElement:()=>({dataset:{},addEventListener:()=>{}}),
    dispatchEvent:event=>events.push(event)
  },
  CustomEvent:class CustomEvent { constructor(type,options={}) { this.type=type; this.detail=options.detail; } },
  localStorage:{getItem:key=>localValues.get(key) || null},
  sessionStorage:{getItem:key=>localValues.get(key) || null},
  setTimeout:callback=>callback(),
  clearTimeout:()=>{},
  console,Intl,Set,Map,Object,Array,Math,Number,String,JSON,Date,URL,Promise
};
context.window = context;
context.SalitaAvatarModel = {catalogue:Array.from({length:48},(_,index)=>({id:`avatar-${index}`}))};
context.levelInfo = () => ({level:18});
context.totalLearningPoints = () => 6500;
context.syncEarned = options => { if (options?.bootstrap) syncCalls += 1; };
context.renderCatalogue = () => { renderCalls += 1; };
vm.createContext(context);
new vm.Script(adapter,{filename:"badge-catalogue-runtime-v1.js"}).runInContext(context);
new vm.Script(feature,{filename:"long-term-badges-feature-v1.js"}).runInContext(context);
new vm.Script(coordinator,{filename:"long-term-badges-v1.js"}).runInContext(context);

const additions = BADGES.filter(badge=>badge.id.startsWith("lt_"));
if (additions.length < 220) fail(`Expected at least 220 long-term badges, found ${additions.length}.`);
if (new Set(additions.map(badge=>badge.id)).size !== additions.length) fail("Long-term badge IDs are not unique.");
for (const id of ["lt_answers_1000","lt_avatars_5","lt_avatars_10","lt_avatars_all","lt_mastery_all","lt_legend_of_salita"]) {
  if (!additions.some(badge=>badge.id===id)) fail(`Required badge is missing: ${id}`);
}
if (!additions.find(badge=>badge.id==="lt_answers_1000")?.test()) fail("The 1,000-answer badge does not evaluate current progress.");
if (!additions.find(badge=>badge.id==="lt_avatars_10")?.test()) fail("The 10-avatar badge does not evaluate profile ownership.");
if (state.badgeProgress.earnedAt.first_step !== "2026-01-01T00:00:00.000Z") fail("Existing badge ownership was modified.");
if (!events.some(event=>event.type==="salita:long-term-badges-ready" && event.detail?.added===additions.length && event.detail?.release==="5.6.0-long-term-badges")) fail("Badge-ready event is missing or inaccurate.");
if (context.document.documentElement.dataset.longTermBadges !== "5.6.0-long-term-badges") fail("Long-term badge dataset release changed");
if (syncCalls !== 1 || renderCalls !== 1) fail("Badge refresh bridge did not run exactly once");
if (!context.__salitaQuestLongTermBadgesV1Installed || !context.SalitaBadgeCatalogueRuntimeV1 || !context.SalitaLongTermBadgesV1) fail("Extracted public APIs/install flag are missing");
new vm.Script(coordinator,{filename:"long-term-badges-v1.js"}).runInContext(context);
if (BADGES.filter(badge=>badge.id.startsWith("lt_")).length !== additions.length || syncCalls !== 1 || renderCalls !== 1) fail("Duplicate loading changed badge catalogue or refresh calls");

console.log(`Validated ${additions.length} appended long-term badges through the generic badge catalogue adapter with stable IDs, preserved ownership and duplicate-install safety.`);
