import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const fail = message => { throw new Error(message); };
const count = (source, token) => source.split(token).length - 1;

const adapter = read("src/adapters/badges/coin-shop-badge-runtime-v1.js");
const feature = read("src/features/economy/coin-avatar-shop-badges-v1.js");
const root = read("coin-avatar-shop-badges-v1.js");
const loader = read("profile-emblem-control.js");
const worker = read("service-worker.js");

for (const [name, source] of [["adapter",adapter],["feature",feature],["root",root],["loader",loader],["worker",worker]]) {
  new vm.Script(source, {filename:name});
}

for (const marker of [
  'const API = "SalitaCoinShopBadgeFamilyV1"',
  'chain(runtime,"coins_spent"', 'chain(runtime,"packs"',
  'chain(runtime,"common_owned"', 'chain(runtime,"uncommon_owned"', 'chain(runtime,"rare_owned"',
  'completion(runtime,"common"', 'completion(runtime,"uncommon"', 'completion(runtime,"rare"',
  'new Set(["lt_coins_500000","lt_coins_1000000"])'
]) if (!feature.includes(marker)) fail(`Feature is missing ${marker}`);

for (const prohibited of ["eval(","localStorage","sessionStorage","BADGES","SalitaAvatarModel","syncEarned","renderCatalogue","document.","coinEconomy"])
  if (feature.includes(prohibited)) fail(`Feature still owns runtime dependency ${prohibited}`);

for (const marker of [
  'const API = "SalitaCoinShopBadgeRuntimeV1"',
  'const PROFILE_STORE = "salitaQuestLocalProfilesV1"',
  'const ACTIVE_PROFILE = "salitaQuestActiveProfileId"',
  'const state = () => globalValue("state") || window.state || {}',
  'globalValue("BADGES")', 'globalValue("syncEarned")', 'globalValue("renderCatalogue")',
  'window.SalitaAvatarModel', 'localStorage.getItem(PROFILE_STORE)', 'sessionStorage.getItem(ACTIVE_PROFILE)',
  'new CustomEvent("salita:coin-shop-badges-ready"'
]) if (!adapter.includes(marker)) fail(`Adapter is missing ${marker}`);
if (/localStorage\.(?:setItem|removeItem|clear)\(/.test(adapter) || /sessionStorage\.(?:setItem|removeItem|clear)\(/.test(adapter))
  fail("Adapter must not write learner or session storage");

for (const prohibited of ["lt_coins_500000","chain(","completion(","localStorage","sessionStorage","globalValue","BADGES","coinEconomy"])
  if (root.includes(prohibited)) fail(`Root coordinator still owns ${prohibited}`);
for (const marker of [
  'const ADAPTER_URL = "./src/adapters/badges/coin-shop-badge-runtime-v1.js?v=5.6.4"',
  'const FEATURE_URL = "./src/features/economy/coin-avatar-shop-badges-v1.js?v=5.6.4"',
  'window.__salitaCoinAvatarShopBadgesV1Installed = true',
  'feature.install(runtime)', 'window.setTimeout(install, 120)'
]) if (!root.includes(marker)) fail(`Root coordinator is missing ${marker}`);

const shardIndex = loader.indexOf("coin-avatar-shard-shop-v1.js");
const adapterIndex = loader.indexOf("src/adapters/badges/coin-shop-badge-runtime-v1.js");
const featureIndex = loader.indexOf("src/features/economy/coin-avatar-shop-badges-v1.js");
const rootIndex = loader.indexOf("coin-avatar-shop-badges-v1.js");
const topbarIndex = loader.indexOf("coin-avatar-shop-topbar-v1.js");
if (!(shardIndex >= 0 && shardIndex < adapterIndex && adapterIndex < featureIndex && featureIndex < rootIndex && rootIndex < topbarIndex))
  fail("Shard shop → badge adapter → badge feature → coordinator → topbar order changed");

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./coin-avatar-shop-badges-v1.js"',
  '"./src/adapters/badges/coin-shop-badge-runtime-v1.js"',
  '"./src/features/economy/coin-avatar-shop-badges-v1.js"'
]) if (!worker.includes(marker)) fail(`Offline delivery is missing ${marker}`);

const featureContext = {console,Math,Number,String,Object,Array,Set,Map,Date,JSON};
featureContext.window = featureContext;
featureContext.globalThis = featureContext;
vm.createContext(featureContext);
new vm.Script(feature).runInContext(featureContext);
const catalogue = [{id:"lt_coins_500000"},{id:"lt_coins_1000000"},{id:"existing"}];
let refreshCalls = 0;
let announcedTotal = null;
const runtime = {
  ready:()=>true,
  remove(ids){ for (let index=catalogue.length-1; index>=0; index-=1) if (ids.has(catalogue[index].id)) catalogue.splice(index,1); },
  register(definitions){
    const ids = new Set(catalogue.map(item=>item.id));
    catalogue.push(...definitions.filter(item=>!ids.has(item.id)));
    return catalogue.length;
  },
  economyMetric(key){ return key === "lifetimeSpent" ? 50000 : key === "shardPacksPurchased" ? 25 : 0; },
  ownedCount(rarity){ return {common:12,uncommon:7,rare:2}[rarity] || 0; },
  totalCount(rarity){ return {common:12,uncommon:15,rare:2}[rarity] || 0; },
  refresh(options){ if (options?.bootstrap !== true) fail("Badge refresh lost bootstrap mode"); refreshCalls += 1; },
  announce(total){ announcedTotal = total; }
};
const family = featureContext.SalitaCoinShopBadgeFamilyV1;
if (!family?.install?.(runtime)) fail("Feature did not install against the explicit adapter");
if (catalogue.length !== 28 || announcedTotal !== 28) fail(`Expected one existing and 27 shop badges, found ${catalogue.length}`);
if (catalogue.some(item=>item.id === "lt_coins_500000" || item.id === "lt_coins_1000000")) fail("Obsolete coin badges remain");
for (const id of ["shop_coins_spent_1000","shop_coins_spent_100000","shop_packs_1","shop_packs_100","shop_common_owned_12","shop_uncommon_owned_15","shop_rare_owned_20","shop_common_all","shop_uncommon_all","shop_rare_all"])
  if (!catalogue.some(item=>item.id === id)) fail(`Missing shop badge ${id}`);
if (!catalogue.find(item=>item.id === "shop_coins_spent_50000")?.test()) fail("Coin-spend badge threshold changed");
if (catalogue.find(item=>item.id === "shop_packs_50")?.test()) fail("Pack badge threshold changed");
if (!catalogue.find(item=>item.id === "shop_rare_all")?.test()) fail("Rarity-completion badge changed");
if (!family.install(runtime) || catalogue.length !== 28 || refreshCalls !== 1) fail("Feature installation is not idempotent");

const adapterEvents = [];
let syncOptions = null;
let renders = 0;
const adapterContext = {
  console,Math,Number,String,Object,Array,Set,Map,Date,JSON,
  BADGES:[{id:"keep"},{id:"remove"}],
  state:{coinEconomy:{lifetimeSpent:50000,shardPacksPurchased:25}},
  syncEarned(options){ syncOptions = options; },
  renderCatalogue(){ renders += 1; },
  SalitaAvatarModel:{list({rarity}){ return rarity === "rare" ? [{id:"r1"},{id:"r2"}] : [{id:"c1"}]; }},
  localStorage:{getItem(key){ return key === "salitaQuestLocalProfilesV1" ? JSON.stringify({profiles:[{id:"p1",avatarCollection:{ownedAvatarIds:["r1","c1"]}}]}) : null; }},
  sessionStorage:{getItem(key){ return key === "salitaQuestActiveProfileId" ? "p1" : null; }},
  CustomEvent:class CustomEvent { constructor(type,init={}){ this.type=type; this.detail=init.detail; } },
  document:{dispatchEvent(event){ adapterEvents.push(event); }}
};
adapterContext.window = adapterContext;
adapterContext.globalThis = adapterContext;
vm.createContext(adapterContext);
new vm.Script(adapter).runInContext(adapterContext);
const runtimeApi = adapterContext.SalitaCoinShopBadgeRuntimeV1;
if (!runtimeApi?.ready()) fail("Adapter did not resolve catalogue and avatar-model readiness");
if (runtimeApi.ownedCount("rare") !== 1 || runtimeApi.totalCount("rare") !== 2) fail("Adapter avatar counts changed");
if (runtimeApi.economyMetric("lifetimeSpent") !== 0) fail("Pre-existing direct-eval state shadowing changed during extraction");
runtimeApi.remove(new Set(["remove"]));
if (adapterContext.BADGES.some(item=>item.id === "remove")) fail("Adapter badge removal changed");
if (runtimeApi.register([{id:"keep"},{id:"new"}]) !== 2 || count(JSON.stringify(adapterContext.BADGES), '"id":"new"') !== 1) fail("Adapter registration is not unique");
runtimeApi.refresh({bootstrap:true});
runtimeApi.announce(2);
if (syncOptions?.bootstrap !== true || renders !== 1) fail("Adapter refresh handoff changed");
if (adapterEvents[0]?.type !== "salita:coin-shop-badges-ready" || adapterEvents[0]?.detail?.total !== 2) fail("Adapter ready event changed");

const loaded = [];
const legacyContext = {
  console,Math,Number,String,Object,Array,Set,Map,Date,JSON,Promise,URL,
  BADGES:[],state:{},SalitaAvatarModel:{list(){return[];}},
  localStorage:{getItem(){return JSON.stringify({profiles:[]});}},sessionStorage:{getItem(){return null;}},
  syncEarned(){},renderCatalogue(){},
  CustomEvent:class CustomEvent { constructor(type,init={}){ this.type=type; this.detail=init.detail; } },
  setTimeout(fn){ fn(); return 1; }
};
legacyContext.window = legacyContext;
legacyContext.globalThis = legacyContext;
legacyContext.document = {
  currentScript:{src:"https://example.test/coin-avatar-shop-badges-v1.js"},
  baseURI:"https://example.test/",
  querySelector(){return null;},
  dispatchEvent(){},
  createElement(){
    const listeners={};
    return {dataset:{},async:true,addEventListener(type,fn){listeners[type]=fn;},_listeners:listeners};
  },
  head:{appendChild(script){
    loaded.push(script.src);
    if (script.src.includes("coin-shop-badge-runtime-v1.js")) new vm.Script(adapter).runInContext(legacyContext);
    else if (script.src.includes("src/features/economy/coin-avatar-shop-badges-v1.js")) new vm.Script(feature).runInContext(legacyContext);
    script._listeners.load?.();
  }},
  documentElement:{appendChild(){}}
};
vm.createContext(legacyContext);
new vm.Script(root).runInContext(legacyContext);
for (let index=0; index<8; index+=1) await Promise.resolve();
if (!legacyContext.__salitaCoinAvatarShopBadgesV1Installed || !legacyContext.SalitaCoinShopBadgeRuntimeV1 || !legacyContext.SalitaCoinShopBadgeFamilyV1) fail("Historical root-only loading failed");
if (loaded.length !== 2 || !loaded[0].includes("coin-shop-badge-runtime-v1.js") || !loaded[1].includes("src/features/economy/coin-avatar-shop-badges-v1.js")) fail("Historical dependency order changed");
new vm.Script(root).runInContext(legacyContext);
for (let index=0; index<2; index+=1) await Promise.resolve();
if (loaded.length !== 2) fail("Historical coordinator is not duplicate-load safe");

console.log("Coin shop badge adapter extraction validation passed.");
