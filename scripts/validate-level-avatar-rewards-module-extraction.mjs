import fs from "node:fs";
import vm from "node:vm";

const read = file => fs.readFileSync(file,"utf8");
const fail = message => { throw new Error(message); };
const rootFile = "level-avatar-rewards-v1.js";
const moduleFile = "src/features/avatar/level-avatar-rewards-v1.js";
const compatibility = read(rootFile);
const feature = read(moduleFile);
const loader = read("profile-emblem-control.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");
const catalogue = read("src/features/avatar/avatar-catalogue-v1.js");
new vm.Script(compatibility,{filename:rootFile});
new vm.Script(feature,{filename:moduleFile});

for (const marker of ['const TARGET = "./src/features/avatar/level-avatar-rewards-v1.js?v=5.5.6"',"document.write","script.async = false",'salitaCompatibilityLoader = "level-avatar-rewards-v1"'])
  if (!compatibility.includes(marker)) fail(`Compatibility loader missing ${marker}`);
for (const forbidden of ["PROFILE_STORE","MILESTONE_LEVELS","applyMilestoneRewards","repairFutureMilestones","localStorage","sessionStorage","salita:avatar-milestones-awarded","SalitaLevelAvatarRewardLogic =","SalitaLevelAvatarRewards ="])
  if (compatibility.includes(forbidden)) fail(`Root compatibility file still owns ${forbidden}`);

for (const marker of ['const PROFILE_STORE = "salitaQuestLocalProfilesV1"','const ACTIVE_PROFILE = "salitaQuestActiveProfileId"','const ACTIVE_COURSE = "salitaQuestActiveCourse"','const INSTALL_FLAG = "__salitaQuestLevelAvatarRewardsV3Installed"','const RELEASE = "5.5.3"','Object.freeze([10,20,30,40,50,60,70,80,90,99])',"repairFutureMilestones","root.SalitaLevelAvatarRewardLogic = Object.freeze","window.SalitaLevelAvatarRewards = Object.freeze",'new CustomEvent("salita:avatar-milestones-awarded"','new CustomEvent("salita:avatar-milestones-repaired"','new CustomEvent("salita:avatar-collection-changed"'])
  if (!feature.includes(marker)) fail(`Feature implementation missing ${marker}`);
if ((feature.match(/localStorage\.getItem/g)||[]).length !== 1 || (feature.match(/localStorage\.setItem/g)||[]).length !== 1) fail("Profile-store ownership changed");
if ((feature.match(/sessionStorage\.getItem/g)||[]).length !== 2 || (feature.match(/document\.addEventListener/g)||[]).length !== 3) fail("Session/listener ownership changed");
if (/state\.xp\s*(?:\+|-|\*|\/)?=/.test(feature)) fail("Level rewards must not alter XP");

const weeklyIndex = loader.indexOf('weekly-avatar-shard-rewards-v1.js?v=${RELEASE_VERSION}');
const levelIndex = loader.indexOf('src/features/avatar/level-avatar-rewards-v1.js?v=${RELEASE_VERSION}');
const unlockIndex = loader.indexOf('avatar-unlock-celebration-v1.js?v=${RELEASE_VERSION}');
if (!(weeklyIndex >= 0 && levelIndex > weeklyIndex && unlockIndex > levelIndex)) fail("Weekly, level and unlock ordering changed");
if (loader.includes('`./level-avatar-rewards-v1.js?v=${RELEASE_VERSION}`')) fail("Current loader still targets root URL");
if (!refresh.includes('`./src/features/avatar/level-avatar-rewards-v1.js?v=${RELEASE}`') || refresh.includes('`./level-avatar-rewards-v1.js?v=${RELEASE}`')) fail("Mobile refresh delivery changed");
const previousCache = worker.match(/const PREVIOUS_CACHE_NAME = "([^"]+)"/)?.[1] || "";
const currentCache = worker.match(/const CACHE_NAME = "([^"]+)"/)?.[1] || "";
const previousRevision = Number(previousCache.match(/-r(\d+)$/)?.[1] || 0);
const currentRevision = Number(currentCache.match(/-r(\d+)$/)?.[1] || 0);
if (previousRevision < 68 || currentRevision <= previousRevision) {
  fail(`Service-worker revisions no longer advance beyond the level reward extraction: ${previousCache} → ${currentCache}`);
}
for (const marker of ['"./level-avatar-rewards-v1.js"','"./src/features/avatar/level-avatar-rewards-v1.js"'])
  if (!worker.includes(marker)) fail(`Offline delivery missing ${marker}`);

const values = new Map();
values.set("salitaQuestLocalProfilesV1",JSON.stringify({schemaVersion:1,profiles:[{id:"p1",avatarId:"anahaw",avatarCollection:{equippedAvatarId:"anahaw",ownedAvatarIds:["anahaw"],shards:{},levelRewardsClaimed:[],pendingUnlocks:[]}}]}));
const localStorage = {writes:0,getItem:key=>values.get(key)??null,setItem(key,value){this.writes++;values.set(key,String(value));}};
const sessionStorage = {getItem:key=>key==="salitaQuestActiveProfileId"?"p1":key==="salitaQuestActiveCourse"?"tagalog":null};
const listeners=[]; const events=[]; const timers=new Map(); let timerId=0; let placementOpen=false; let currentLevel=20;
class CustomEvent {constructor(type,options={}){this.type=type;this.detail=options.detail;}}
const documentElement={dataset:{}};
const body={dataset:{course:"tagalog"},classList:{contains:name=>name==="placement-open"&&placementOpen}};
const document={body,documentElement,addEventListener:(name,handler)=>listeners.push([name,handler]),dispatchEvent:event=>{events.push(event);return true;}};
const window={__salitaQuestLevelProgressionV2Installed:true,setTimeout(handler,delay){const id=++timerId;timers.set(id,{handler,delay});return id;},clearTimeout:id=>timers.delete(id)};
const context={window,document,localStorage,sessionStorage,CustomEvent,levelInfo:()=>({level:currentLevel}),Date,Set,Map,Math,Number,String,Array,Object,JSON,Promise,console,globalThis:null}; context.globalThis=context;
vm.createContext(context);
vm.runInContext(catalogue,context,{filename:"src/features/avatar/avatar-catalogue-v1.js"});
vm.runInContext(feature,context,{filename:moduleFile});
const logic=window.SalitaLevelAvatarRewardLogic; const api=window.SalitaLevelAvatarRewards;
if (logic?.version!==2 || api?.version!==3 || api?.release!=="5.5.3") fail("Public reward APIs changed");
if (listeners.map(([name])=>name).join("|")!=="salita:level-updated|salita:course-progress-restored|salita:placement-finished") fail("Listener order changed");
if (![...timers.values()].some(item=>item.delay===220)) fail("Initial sync delay changed");
const result=api.sync();
if (result?.level!==20 || result.awarded.length!==2 || localStorage.writes!==1) fail("Live Level 20 persistence changed");
const saved=JSON.parse(values.get("salitaQuestLocalProfilesV1")).profiles[0];
if (saved.avatarCollection.levelRewardsClaimed.join(",")!=="10,20" || !saved.avatarCollection.ownedAvatarIds.includes("narra") || !saved.avatarCollection.ownedAvatarIds.includes("nipa_palm")) fail("Milestone ownership persistence changed");
if (saved.avatarMilestoneRewards.acknowledgedLevels.join(",")!=="10,20" || saved.avatarMilestoneRewards.claims["20"]?.avatarId!=="nipa_palm") fail("Milestone metadata persistence changed");
if (events.map(event=>event.type).join("|")!=="salita:avatar-collection-changed|salita:avatar-milestones-awarded") fail("Award event order changed");
if (events[1]?.detail?.governed!==true || events[1]?.detail?.release!=="5.5.3") fail("Award event metadata changed");
const writes=localStorage.writes; documentElement.dataset.placementUpdating="true";
if (api.sync()!==null || localStorage.writes!==writes) fail("Placement-update suppression changed");
delete documentElement.dataset.placementUpdating; placementOpen=true;
if (api.grantForLevel()!==null || localStorage.writes!==writes) fail("Placement-open suppression changed");
placementOpen=false;
const handler=name=>listeners.find(([event])=>event===name)?.[1];
for (const [name,delay] of [["salita:level-updated",40],["salita:course-progress-restored",180],["salita:placement-finished",1600]]) {timers.clear();handler(name)();if (![...timers.values()].some(item=>item.delay===delay)) fail(`${name} delay changed`);}
const weekly={avatarId:"anahaw",avatarCollection:{equippedAvatarId:"anahaw",ownedAvatarIds:["anahaw","nipa_palm"],shards:{nipa_palm:100},levelRewardsClaimed:[20],pendingUnlocks:[{avatarId:"nipa_palm",source:"level_milestone",level:20}]},avatarMilestoneRewards:{version:3,claims:{20:{avatarId:"nipa_palm"}},acknowledgedLevels:[20]},avatarWeeklyRewards:{claims:{week:{avatarId:"nipa_palm",after:100,unlocked:true}}}};
const repaired=logic.repairFutureMilestones(weekly,10,window.SalitaAvatarModel);
if (!repaired.changed || weekly.avatarCollection.levelRewardsClaimed.includes(20) || !weekly.avatarCollection.ownedAvatarIds.includes("nipa_palm") || weekly.avatarCollection.shards.nipa_palm!==100) fail("Weekly evidence repair behavior changed");
const apiBefore=api; const listenerCount=listeners.length;
vm.runInContext(feature,context,{filename:moduleFile});
if (window.SalitaLevelAvatarRewards!==apiBefore || listeners.length!==listenerCount) fail("Install idempotency changed");
console.log("Level avatar rewards extraction validation passed.");
