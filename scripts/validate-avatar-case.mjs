import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(ROOT,file),"utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

const runtime = read("avatar-case-v1.js");
const sharing = read("achievement-sharing-v4.js");
const sharingCss = read("achievement-sharing-v4.css");
const loader = read("profile-emblem-control.js");
const worker = read("service-worker.js");
const css = read("avatar-case-v1.css");
const collectionCss = read("avatar-collection-screen-v1.css");
const service = read("services/social-share/index.js");

new vm.Script(runtime,{filename:"avatar-case-v1.js"});
new vm.Script(sharing,{filename:"achievement-sharing-v4.js"});

requireMarkers(runtime,[
  "const MAX_CASE_AVATARS = 4",
  'const RELEASE = "5.5.10-avatar-case-compact"',
  'const MOBILE_COLLAPSE_QUERY = "(max-width: 650px)"',
  "profile.avatarCaseIds = cleaned",
  "cleanIds",
  "ownedIds",
  "result.includes(item.id)",
  "result.length >= MAX_CASE_AVATARS",
  "data-avatar-case-toggle",
  'aria-expanded="${panelExpanded}"',
  "sq-avatar-case-body",
  "function setExpanded",
  "function toggleExpanded",
  "isExpanded:()=>panelExpanded",
  "sq-avatar-case-picker-order",
  "data-avatar-case-draft-move",
  "data-avatar-case-draft-remove",
  "function moveDraft",
  "function removeDraft",
  "data-avatar-case-open-picker",
  "data-avatar-case-picker-save",
  "data-share-avatar-case",
  "salita:avatar-case-changed",
  "SalitaQuestAvatarCase"
],"Compact Avatar Case runtime");
if (/profile\.avatarId\s*=/.test(runtime)) fail("Avatar Case must not change the equipped profile avatar");
if (/equippedAvatarId\s*=/.test(runtime)) fail("Avatar Case must not change equippedAvatarId");
const slotSource = runtime.slice(runtime.indexOf("function slotMarkup"),runtime.indexOf("function ensurePanel"));
if (/data-avatar-case-(?:move|remove)/.test(slotSource)) {
  fail("The compact showcase must not contain reorder or remove controls; those belong in the editor");
}

requireMarkers(sharing,[
  "buildAvatarCaseCard",
  "openAvatarCase",
  'type:"avatar_case"',
  "data-share-avatar-case",
  "avatarCaseItems",
  "SalitaQuestAvatarCase?.openPicker",
  "openBadge,openChest,openAvatar,openAvatarCase,openLevel"
],"Unified Avatar Case sharing");

const collectionIndex = loader.indexOf('loadScript("collection"');
const caseIndex = loader.indexOf('loadScript("case"');
const weeklyIndex = loader.indexOf('loadScript("weekly"');
if (!(collectionIndex >= 0 && caseIndex > collectionIndex && weeklyIndex > caseIndex)) {
  fail("Avatar Case must load after the collection and before reward modules");
}
requireMarkers(loader,[
  'addStylesheet("case-css"',
  "avatar-case-v1.css",
  "avatar-case-v1.js",
  'const AVATAR_CASE_VERSION = "5.5.9"'
],"Shared avatar loader");

requireMarkers(worker,[
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-5-9-avatar-case-r51"',
  'const CACHE_NAME = "salita-quest-v5-5-10-persistent-navigation-r52"',
  'const AVATAR_CASE_DISPLAY_HOTFIX = "2026-08-01-compact-display-share-stack-1"',
  '"./avatar-case-v1.js"',
  '"./avatar-case-v1.css"',
  '"./avatar-collection-screen-v1.css"',
  '"./achievement-sharing-v4.css"'
],"Compact Avatar Case offline delivery");

requireMarkers(css,[
  ".sq-avatar-case-panel",
  ".sq-avatar-case-toggle",
  '.sq-avatar-case-toggle[aria-expanded="false"]',
  ".sq-avatar-case-body[hidden]",
  ".sq-avatar-case-slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))",
  ".sq-avatar-case-art img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain",
  ".sq-avatar-case-picker{position:fixed;inset:0;z-index:2147483300",
  ".sq-avatar-case-picker-order",
  ".sq-avatar-case-order-item",
  ".sq-avatar-case-order-controls",
  "@media(max-width:820px)",
  "@media(max-width:650px)",
  ".sq-avatar-case-slots{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}",
  "@media(max-width:370px)",
  ".dark-mode .sq-avatar-case-panel"
],"Compact Avatar Case responsive styles");
if (css.includes("grid-auto-flow:column")) fail("Avatar Case must not return to a horizontally clipped phone shelf");

requireMarkers(collectionCss,[
  ".sq-avatar-collection-backdrop{position:fixed;inset:0;z-index:2147483000",
  ".sq-avatar-detail{position:fixed;inset:0;z-index:2147483100",
  "grid-template-rows:auto auto auto minmax(0,1fr)!important",
  ".sq-avatar-collection-header,",
  ".sq-avatar-case-panel,",
  ".sq-avatar-collection-summary,",
  ".sq-avatar-collection-scroll{",
  "min-height:0!important",
  "height:100dvh!important",
  "max-height:100dvh!important",
  "max-height:min(30dvh,220px)!important",
  ".sq-avatar-case-body[hidden]",
  "overflow-y:auto!important",
  "-webkit-overflow-scrolling:touch"
],"Non-overlapping Avatar Case and collection layout");
if (collectionCss.includes("grid-template-rows:auto auto minmax(0,1fr)!important")) {
  fail("Avatar Collection must not return to a three-row grid after inserting the Avatar Case");
}

requireMarkers(sharingCss,[
  ".achievement-share-modal{position:fixed;inset:0;z-index:2147483500",
  "isolation:isolate",
  ".achievement-share-backdrop",
  "max-height:96dvh"
],"Top-level sharing overlay");

const zValue = (source,expression,label) => {
  const match = source.match(expression);
  if (!match) fail(`Could not read ${label} z-index`);
  return Number(match[1]);
};
const collectionZ = zValue(collectionCss,/\.sq-avatar-collection-backdrop\{[^}]*z-index:(\d+)/,"collection");
const detailZ = zValue(collectionCss,/\.sq-avatar-detail\{[^}]*z-index:(\d+)/,"avatar detail");
const pickerZ = zValue(css,/\.sq-avatar-case-picker\{[^}]*z-index:(\d+)/,"Avatar Case editor");
const shareZ = zValue(sharingCss,/\.achievement-share-modal\{[^}]*z-index:(\d+)/,"share dialog");
if (!(collectionZ < detailZ && detailZ < pickerZ && pickerZ < shareZ)) {
  fail(`Overlay order is invalid: collection ${collectionZ}, detail ${detailZ}, editor ${pickerZ}, share ${shareZ}`);
}

requireMarkers(service,[
  'avatar_case: {label:"AVATAR CASE"',
  "supportedTypes: Object.keys(SHARE_TYPE_META)"
],"Hosted Avatar Case contract");

for (const htmlFile of ["app.html","bisaya.html"]) {
  const html = read(htmlFile);
  if (!html.includes("profile-emblem-control.js")) fail(`${htmlFile} does not load the shared avatar progression entry point`);
}

const records = ["a","b","c","d","e"].map((id,index) => ({
  id,name:`Avatar ${id.toUpperCase()}`,rarity:index < 2 ? "common" : "rare",category:"animal",image:`avatars/canonical/${id}.png`
}));
const byId = Object.fromEntries(records.map(item => [item.id,item]));
const store = {
  schemaVersion:1,
  profiles:[{
    id:"profile-1",
    avatarId:"a",
    avatarCollection:{equippedAvatarId:"a",ownedAvatarIds:["a","b","c","d","e"],shards:{}},
    avatarCaseIds:["a","a","locked","b","c","d","e"]
  }]
};
let stored = JSON.stringify(store);
const listeners = {};
const documentStub = {
  body:{classList:{add(){},remove(){}}},
  documentElement:{dataset:{}},
  querySelector(){return null;},
  addEventListener(type,handler){listeners[type]=handler;},
  dispatchEvent(){},
  createElement(){return {hidden:true,classList:{},setAttribute(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};}
};
const context = {
  window:null,
  document:documentStub,
  localStorage:{getItem:key => key === "salitaQuestLocalProfilesV1" ? stored : null,setItem:(key,value)=>{if(key === "salitaQuestLocalProfilesV1")stored=value;}},
  sessionStorage:{getItem:key => key === "salitaQuestActiveProfileId" ? "profile-1" : null},
  matchMedia:query=>({matches:query==="(max-width: 650px)",media:query}),
  MutationObserver:class MutationObserver{observe(){} disconnect(){}},
  Element:class Element{},
  CustomEvent:class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout:handler=>{handler();return 1;},
  clearTimeout(){},
  console,
  Object,Array,Set,Map,Date,Math,Number,String,Boolean,JSON,Promise
};
context.window=context;
context.SalitaAvatarModel={
  get:id=>byId[String(id||"").toLowerCase()]||null,
  normaliseCollectionState:(input,fallback)=>({
    equippedAvatarId:input?.equippedAvatarId||fallback||null,
    ownedAvatarIds:[...(input?.ownedAvatarIds||[])],
    shards:{...(input?.shards||{})}
  })
};
vm.createContext(context);
vm.runInContext(runtime,context,{filename:"avatar-case-v1.behavior.js"});
const api=context.SalitaQuestAvatarCase;
if(!api)fail("Avatar Case API was not installed in the deterministic harness");
if(api.max!==4)fail(`Avatar Case maximum is ${api.max}, expected 4`);
if(api.version!==2)fail(`Avatar Case API version is ${api.version}, expected 2`);
if(api.isExpanded()!==false)fail("Avatar Case must start collapsed at the phone breakpoint");
api.toggleExpanded();
if(api.isExpanded()!==true)fail("Avatar Case did not expand through its public toggle");
api.setExpanded(false,{render:false});
if(api.isExpanded()!==false)fail("Avatar Case did not collapse through its public state control");
if(api.getIds().join("|")!=="a|b|c|d")fail(`Initial case cleaning failed: ${api.getIds().join("|")}`);
const cleaned=api.setIds(["e","e","locked","d","c","b","a"],{announce:false});
if(cleaned.join("|")!=="e|d|c|b")fail(`Owned/unique/four-slot enforcement failed: ${cleaned.join("|")}`);
api.move("c",-1);
if(api.getIds().join("|")!=="e|c|d|b")fail(`Reordering failed: ${api.getIds().join("|")}`);
api.remove("d");
if(api.getIds().join("|")!=="e|c|b")fail(`Removal failed: ${api.getIds().join("|")}`);
const finalProfile=JSON.parse(stored).profiles[0];
if(finalProfile.avatarId!=="a"||finalProfile.avatarCollection.equippedAvatarId!=="a")fail("Avatar Case changed the equipped avatar");
if(finalProfile.avatarCaseIds.join("|")!=="e|c|b")fail("Avatar Case state was not persisted on the profile");

console.log("Validated compact four-tile Avatar Case display, phone-default collapse, contained artwork, editor-only controls, non-overlapping collection flow, ordered overlays, share-above-collection behavior, duplicate rejection, reordering and equipped-avatar independence.");
