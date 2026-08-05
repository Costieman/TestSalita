import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const rootFile = "economy-tracking-phase6-v1.js";
const moduleFile = "src/features/economy/economy-tracking-phase6-v1.js";
const compatibility = read(rootFile);
const feature = read(moduleFile);
const loader = read("coin-avatar-shop-topbar-v1.js");
const worker = read("service-worker.js");

new vm.Script(compatibility,{filename:rootFile});
new vm.Script(feature,{filename:moduleFile});

for (const marker of [
  'const TARGET = "./src/features/economy/economy-tracking-phase6-v1.js?v=5.7.3"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "economy-tracking-phase6-v1"'
]) if (!compatibility.includes(marker)) fail(`Compatibility loader is missing ${marker}`);
for (const forbidden of ["normalisedEconomy", "sq-economy-tracking-panel", "MutationObserver", "SalitaEconomyTrackingPhase6 =", "salita:economy-tracking-ready"])
  if (compatibility.includes(forbidden)) fail(`Root compatibility file still owns ${forbidden}`);

const events = [
  "salita:open-avatar-collection",
  "salita:coin-balance-changed",
  "salita:coin-shard-pack-purchased",
  "salita:avatar-collection-changed",
  "salita:avatar-collection-tabs-ready"
];
for (const marker of [
  "__salitaEconomyTrackingPhase6V2Installed",
  'const RELEASE = "economy-v2-phase6-tracking-pane"',
  "packsByRarity",
  'panel.dataset.economyTracking = RELEASE',
  'window.SalitaEconomyTrackingPhase6 = Object.freeze({release:RELEASE,render,read:normalisedEconomy})',
  'salita:economy-tracking-ready'
]) if (!feature.includes(marker)) fail(`Feature implementation is missing ${marker}`);
for (const event of events) if (!feature.includes(`"${event}"`)) fail(`Feature is missing listener ${event}`);
if ((feature.match(/new MutationObserver/g)||[]).length !== 1) fail("Feature must own exactly one mutation observer");
if (/localStorage|sessionStorage/.test(feature)) fail("Economy tracker must not access browser storage directly");

const summaryIndex = loader.indexOf('avatar-collection-summary-v1.js?v=5.6.9');
const economyIndex = loader.indexOf('src/features/economy/economy-tracking-phase6-v1.js?v=5.7.3');
const tabsIndex = loader.indexOf('avatar-collection-tabs-phase6-1-v1.js?v=5.7.4');
if (!(summaryIndex >= 0 && economyIndex > summaryIndex && tabsIndex > economyIndex)) fail("Collection summary, economy tracker and tabs load order changed");
if (loader.includes('"./economy-tracking-phase6-v1.js?v=5.7.3"')) fail("Current loader still targets the root compatibility URL");
for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./economy-tracking-phase6-v1.js"',
  '"./src/features/economy/economy-tracking-phase6-v1.js"',
  '"./economy-tracking-phase6-v1.css"'
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
const state = {coinEconomy:{
  lifetimeEarned:123.9,
  lifetimeSpent:45.7,
  shardPacksPurchased:6,
  mysteryPacksPurchased:2,
  packsByRarity:{common:4,uncommon:1,rare:1}
}};
const window = {state,setTimeout(){}};
const context = {window,document,state,Element,MutationObserver,CustomEvent,console};
vm.createContext(context);
vm.runInContext(feature,context,{filename:moduleFile});
if (listeners.length !== 5 || listeners.map(([name])=>name).join("|") !== events.join("|")) fail("Economy tracker listener ownership changed");
if (observerCount !== 1) fail("Economy tracker did not install exactly one observer");
const api = window.SalitaEconomyTrackingPhase6;
if (!api || api.release !== "economy-v2-phase6-tracking-pane" || typeof api.render !== "function" || typeof api.read !== "function") fail("Stable economy tracking API was not installed");
const totals = api.read();
const expectedKeys = ["lifetimeEarned","lifetimeSpent","shardPacksPurchased","mysteryPacksPurchased","common","uncommon","rare"];
for (const key of expectedKeys) if (!Number.isInteger(totals[key]) || totals[key] < 0) fail(`Normalised economy shape changed for ${key}`);
if (dispatched.length !== 1 || dispatched[0].type !== "salita:economy-tracking-ready" || dispatched[0].detail?.release !== api.release) fail("Ready-event contract changed");
const apiAfterFirstInstall = api;
vm.runInContext(feature,context,{filename:moduleFile});
if (window.SalitaEconomyTrackingPhase6 !== apiAfterFirstInstall || listeners.length !== 5 || observerCount !== 1) fail("Install flag did not prevent duplicate ownership");

console.log("Economy tracking extraction validation passed: direct topbar delivery, compatibility-only root, stable API, five listeners, one observer, no direct storage and r63 offline delivery.");
