import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };

const runtime = read("long-term-badges-v1.js");
const loader = read("profile-emblem-control.js");
new vm.Script(runtime,{filename:"long-term-badges-v1.js"});
new vm.Script(loader,{filename:"profile-emblem-control.js"});

for (const marker of [
  'const RELEASE = "5.6.0-long-term-badges"',
  'globalValue = name =>',
  'eval(`typeof ${name} !== "undefined" ? ${name} : undefined`)',
  'answers:[250,500,1000',
  'avatars:[2,5,10',
  'id:"lt_avatars_all"',
  'id:"lt_mastery_all"',
  'id:"lt_legend_of_salita"',
  'badgeProgress?.earnedAt',
  'existing.has(badge.id)',
  'list.push(...additions)'
]) if (!runtime.includes(marker)) fail(`Long-term badge runtime is missing: ${marker}`);

for (const marker of [
  'const BADGE_EXPANSION_VERSION = "5.6.0"',
  '"long-term-badges"',
  '`./long-term-badges-v1.js?v=${BADGE_EXPANSION_VERSION}`',
  'badgeExpansionVersion:BADGE_EXPANSION_VERSION'
]) if (!loader.includes(marker)) fail(`Badge loader is missing: ${marker}`);

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
const context = {
  BADGES,state,
  window:null,
  document:{documentElement:{dataset:{}},dispatchEvent:event=>events.push(event)},
  CustomEvent:class CustomEvent { constructor(type,options={}) { this.type=type; this.detail=options.detail; } },
  localStorage:{getItem:key=>localValues.get(key) || null},
  sessionStorage:{getItem:key=>localValues.get(key) || null},
  setTimeout:callback=>callback(),
  clearTimeout:()=>{},
  console,
  Intl,Set,Map,Object,Array,Math,Number,String,JSON,Date
};
context.window = context;
context.SalitaAvatarModel = {catalogue:Array.from({length:48},(_,index)=>({id:`avatar-${index}`}))};
context.levelInfo = () => ({level:18});
context.totalLearningPoints = () => 6500;
vm.createContext(context);
new vm.Script(runtime,{filename:"long-term-badges-v1.js"}).runInContext(context);

const additions = BADGES.filter(badge=>badge.id.startsWith("lt_"));
if (additions.length < 220) fail(`Expected at least 220 long-term badges, found ${additions.length}.`);
if (new Set(additions.map(badge=>badge.id)).size !== additions.length) fail("Long-term badge IDs are not unique.");
for (const id of ["lt_answers_1000","lt_avatars_5","lt_avatars_10","lt_avatars_all","lt_mastery_all","lt_legend_of_salita"]) {
  if (!additions.some(badge=>badge.id===id)) fail(`Required badge is missing: ${id}`);
}
if (!additions.find(badge=>badge.id==="lt_answers_1000")?.test()) fail("The 1,000-answer badge does not evaluate current progress.");
if (!additions.find(badge=>badge.id==="lt_avatars_10")?.test()) fail("The 10-avatar badge does not evaluate profile ownership.");
if (state.badgeProgress.earnedAt.first_step !== "2026-01-01T00:00:00.000Z") fail("Existing badge ownership was modified.");
if (!events.some(event=>event.type==="salita:long-term-badges-ready" && event.detail?.added===additions.length)) fail("Badge-ready event is missing or inaccurate.");

console.log(`Validated ${additions.length} appended long-term badges, stable IDs, preserved ownership, lexical-global compatibility, requested question/avatar milestones and three completionist badges.`);