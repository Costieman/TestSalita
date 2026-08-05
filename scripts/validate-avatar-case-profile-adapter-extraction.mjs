import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(ROOT,file),"utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing ${marker}`);
});

const root = read("avatar-case-v1.js");
const adapter = read("src/adapters/avatar/avatar-case-profile-runtime-v1.js");
const feature = read("src/features/avatar/avatar-case-v1.js");
const loader = read("profile-emblem-control.js");
const worker = read("service-worker.js");

new vm.Script(root,{filename:"avatar-case-v1.js"});
new vm.Script(adapter,{filename:"src/adapters/avatar/avatar-case-profile-runtime-v1.js"});
new vm.Script(feature,{filename:"src/features/avatar/avatar-case-v1.js"});

requireMarkers(root,["SalitaAvatarCaseProfileRuntimeV1","SalitaAvatarCaseFeatureV1","document.write","script.async = false","RETRY_MS = 120"],"coordinator");
for (const forbidden of ["salitaQuestLocalProfilesV1","salitaQuestActiveProfileId","localStorage","sessionStorage","sq-avatar-case-panel","SalitaQuestAvatarCase ="]) {
  if (root.includes(forbidden)) fail(`Coordinator owns forbidden behavior: ${forbidden}`);
}
requireMarkers(adapter,["salitaQuestLocalProfilesV1","salitaQuestActiveProfileId","profile.avatarCaseIds = cleaned","caseAvatarIds","normaliseCollectionState","localStorage.setItem","SalitaAvatarCaseProfileRuntimeV1"],"profile adapter");
for (const forbidden of ["document.addEventListener","MutationObserver","sq-avatar-case-panel","salita:avatar-case-changed","SalitaQuestAvatarCase ="]) {
  if (adapter.includes(forbidden)) fail(`Profile adapter owns forbidden UI behavior: ${forbidden}`);
}
requireMarkers(feature,["MAX_CASE_AVATARS = 4","5.5.10-avatar-case-compact","sq-avatar-case-panel","sq-avatar-case-picker","salita:avatar-case-changed","salita:avatar-case-ready","SalitaQuestAvatarCase = Object.freeze"],"feature");
for (const forbidden of ["salitaQuestLocalProfilesV1","salitaQuestActiveProfileId","localStorage","sessionStorage","caseAvatarIds"]) {
  if (feature.includes(forbidden)) fail(`Feature owns forbidden profile persistence: ${forbidden}`);
}

const order = [
  loader.indexOf('loadScript("collection"'),
  loader.indexOf('loadScript("case-profile-runtime"'),
  loader.indexOf('loadScript("case-feature"'),
  loader.indexOf('loadScript("case"'),
  loader.indexOf('loadScript("weekly"')
];
if (order.some(index => index < 0) || !order.every((value,index) => index === 0 || value > order[index - 1])) fail("Avatar Case loader order changed");
requireMarkers(worker,[
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./avatar-case-v1.js"',
  '"./src/adapters/avatar/avatar-case-profile-runtime-v1.js"',
  '"./src/features/avatar/avatar-case-v1.js"'
],"offline delivery");

const records = ["a","b","c","d","e"].map((id,index) => ({id,name:id.toUpperCase(),rarity:index<2?"common":"rare",category:"animal",image:`${id}.png`}));
const byId = Object.fromEntries(records.map(item => [item.id,item]));
let stored = JSON.stringify({schemaVersion:1,profiles:[{id:"p1",avatarId:"a",avatarCollection:{equippedAvatarId:"a",ownedAvatarIds:["a","b","c","d","e"],shards:{},caseAvatarIds:["a","a","locked","b","c","d","e"]}}]});
let writes = 0;
const listeners = new Map();
const dispatched = [];
const documentStub = {
  readyState:"complete",currentScript:null,baseURI:"https://example.test/",head:{appendChild(){}},
  body:{classList:{add(){},remove(){}},appendChild(){}},documentElement:{dataset:{},appendChild(){}},
  querySelector(){return null;},createElement(){return {hidden:true,classList:{},dataset:{},setAttribute(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};},
  addEventListener(type,handler){const items=listeners.get(type)||[];items.push(handler);listeners.set(type,items);},
  dispatchEvent(event){dispatched.push(event);},write(){fail("Coordinator should not document.write when dependencies are present");}
};
const context = {window:null,document:documentStub,
  localStorage:{getItem:key=>key==="salitaQuestLocalProfilesV1"?stored:null,setItem:(key,value)=>{if(key==="salitaQuestLocalProfilesV1"){stored=value;writes+=1;}},length:0,key(){return null;}},
  sessionStorage:{getItem:key=>key==="salitaQuestActiveProfileId"?"p1":null},
  matchMedia:()=>({matches:true}),MutationObserver:class{observe(){} disconnect(){}},Element:class{},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout:handler=>{handler();return 1;},clearTimeout(){},console,Object,Array,Set,Map,Date,Math,Number,String,Boolean,JSON,Promise,URL
};
context.window=context;
context.SalitaAvatarModel={get:id=>byId[String(id||"").toLowerCase()]||null,normaliseCollectionState:(input,fallback)=>({equippedAvatarId:input?.equippedAvatarId||fallback||null,ownedAvatarIds:[...(input?.ownedAvatarIds||[])],shards:{...(input?.shards||{})}})};
vm.createContext(context);
vm.runInContext(adapter,context);
vm.runInContext(feature,context);
vm.runInContext(root,context);
const api=context.SalitaQuestAvatarCase;
if(!api||api.max!==4||api.version!==2)fail("Avatar Case public API changed");
if(api.getIds().join("|")!=="a|b|c|d")fail(`Legacy migration/cleaning failed: ${api.getIds().join("|")}`);
api.setIds(["e","e","locked","d","c","b","a"],{announce:false});
api.move("c",-1);api.remove("d");
const profile=JSON.parse(stored).profiles[0];
if(profile.avatarCaseIds.join("|")!=="e|c|b")fail("Avatar Case persistence changed");
if(profile.avatarId!=="a"||profile.avatarCollection.equippedAvatarId!=="a")fail("Avatar Case changed equipped avatar");
if(Object.hasOwn(profile.avatarCollection,"caseAvatarIds"))fail("Legacy caseAvatarIds was not removed");
const listenerCount=[...listeners.values()].reduce((sum,items)=>sum+items.length,0);
const writesBefore=writes;
vm.runInContext(adapter,context);vm.runInContext(feature,context);vm.runInContext(root,context);
if([...listeners.values()].reduce((sum,items)=>sum+items.length,0)!==listenerCount)fail("Duplicate loading installed extra listeners");
if(writes!==writesBefore)fail("Duplicate loading performed an extra profile write");

console.log("Avatar Case profile adapter extraction validation passed.");
