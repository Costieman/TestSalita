import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const rootFile = "avatar-collection-tabs-phase6-1-v1.js";
const moduleFile = "src/features/avatar/avatar-collection-tabs-phase6-1-v1.js";
const compatibility = read(rootFile);
const feature = read(moduleFile);
const loader = read("coin-avatar-shop-topbar-v1.js");
const worker = read("service-worker.js");

new vm.Script(compatibility,{filename:rootFile});
new vm.Script(feature,{filename:moduleFile});

for (const marker of [
  'const TARGET = "./src/features/avatar/avatar-collection-tabs-phase6-1-v1.js?v=5.7.4"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "avatar-collection-tabs-phase6-1-v1"'
]) if (!compatibility.includes(marker)) fail(`Compatibility loader is missing ${marker}`);
for (const forbidden of ["PANE_CLASSES", "ensureTabs", "ensurePane", "moveContent", "applyActive", "MutationObserver", "SalitaAvatarCollectionTabsPhase61 =", "salita:avatar-collection-tabs-ready"])
  if (compatibility.includes(forbidden)) fail(`Root compatibility file still owns ${forbidden}`);

const events = [
  "salita:open-avatar-collection",
  "salita:economy-tracking-ready",
  "salita:avatar-collection-changed",
  "salita:avatar-case-changed",
  "salita:avatar-case-ready"
];
for (const marker of [
  "__salitaAvatarCollectionTabsPhase63Installed",
  'const RELEASE = "phase6.3-case-collection-statistics-tabs"',
  'case: "sq-avatar-case-pane"',
  'collection: "sq-avatar-collection-pane"',
  'statistics: "sq-avatar-statistics-pane"',
  'data-avatar-collection-tab="case"',
  'data-avatar-collection-tab="collection"',
  'data-avatar-collection-tab="statistics"',
  'window.SalitaAvatarCollectionTabsPhase61 = Object.freeze({release:RELEASE,setActive,getActive:()=>activeTab,render:ensureLayout})',
  'salita:avatar-collection-tabs-ready'
]) if (!feature.includes(marker)) fail(`Feature implementation is missing ${marker}`);
for (const event of events) if (!feature.includes(`"${event}"`)) fail(`Feature is missing listener ${event}`);
if ((feature.match(/new MutationObserver/g)||[]).length !== 1) fail("Feature must own exactly one mutation observer");
if (/localStorage|sessionStorage/.test(feature)) fail("Collection tabs must not access browser storage directly");

const summaryIndex = loader.indexOf('avatar-collection-summary-v1.js?v=5.6.9');
const economyIndex = loader.indexOf('src/features/economy/economy-tracking-phase6-v1.js?v=5.7.3');
const tabsIndex = loader.indexOf('src/features/avatar/avatar-collection-tabs-phase6-1-v1.js?v=5.7.4');
if (!(summaryIndex >= 0 && economyIndex > summaryIndex && tabsIndex > economyIndex)) fail("Collection summary, economy tracker and tabs load order changed");
if (loader.includes('"./avatar-collection-tabs-phase6-1-v1.js?v=5.7.4"')) fail("Current loader still targets the root compatibility URL");

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./avatar-collection-tabs-phase6-1-v1.js"',
  '"./src/features/avatar/avatar-collection-tabs-phase6-1-v1.js"',
  '"./avatar-collection-tabs-phase6-1-v1.css"'
]) if (!worker.includes(marker)) fail(`Offline delivery is missing ${marker}`);

const listeners = [];
const dispatched = [];
let observerCount = 0;
class Element {}
class MutationObserver { constructor(callback){ this.callback=callback; observerCount += 1; } observe(){} }
class CustomEvent { constructor(type,init={}){ this.type=type; this.detail=init.detail; } }
const document = {
  documentElement:{},
  querySelector(){ return null; },
  addEventListener(name,handler){ listeners.push([name,handler]); },
  dispatchEvent(event){ dispatched.push(event); }
};
const window = {setTimeout(){}};
const context = {window,document,Element,MutationObserver,CustomEvent,console,Object};
vm.createContext(context);
vm.runInContext(feature,context,{filename:moduleFile});
if (listeners.length !== 5 || listeners.map(([name])=>name).join("|") !== events.join("|")) fail("Collection tabs listener ownership changed");
if (observerCount !== 1) fail("Collection tabs did not install exactly one observer");
const api = window.SalitaAvatarCollectionTabsPhase61;
if (!api || api.release !== "phase6.3-case-collection-statistics-tabs" || typeof api.setActive !== "function" || typeof api.getActive !== "function" || typeof api.render !== "function") fail("Stable collection tabs API was not installed");
if (api.getActive() !== "case") fail("Initial active tab changed");
if (api.setActive("statistics") !== "statistics" || api.getActive() !== "statistics") fail("Statistics tab selection changed");
if (api.setActive("invalid") !== "case" || api.getActive() !== "case") fail("Invalid tab fallback changed");
if (dispatched.length !== 1 || dispatched[0].type !== "salita:avatar-collection-tabs-ready" || dispatched[0].detail?.release !== api.release) fail("Ready-event contract changed");
const apiAfterFirstInstall = api;
vm.runInContext(feature,context,{filename:moduleFile});
if (window.SalitaAvatarCollectionTabsPhase61 !== apiAfterFirstInstall || listeners.length !== 5 || observerCount !== 1) fail("Install flag did not prevent duplicate ownership");

console.log("Avatar Collection tabs extraction validation passed: direct topbar delivery, compatibility-only root, stable API, five listeners, one observer, pane contracts and r64 offline delivery.");
