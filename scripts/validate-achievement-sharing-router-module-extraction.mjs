import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };
const count = (source, token) => source.split(token).length - 1;

const v2 = read("achievement-sharing-router-v2.js");
const rootLoader = read("achievement-sharing-router-v3.js");
const moduleSource = read("src/features/sharing/achievement-sharing-router-v3.js");
const profileLoader = read("profile-emblem-control.js");
const worker = read("service-worker.js");

new vm.Script(v2, {filename:"achievement-sharing-router-v2.js"});
new vm.Script(rootLoader, {filename:"achievement-sharing-router-v3.js"});
new vm.Script(moduleSource, {filename:"src/features/sharing/achievement-sharing-router-v3.js"});

const moduleUrl = "./src/features/sharing/achievement-sharing-router-v3.js?v=5.5.21";
for (const required of [
  "__salitaQuestAchievementSharingRouterV3Installed",
  moduleUrl,
  "script.async = false",
  "script.dataset.sqSharingRouterV3"
]) if (!v2.includes(required)) fail(`V2 entry loader is missing ${required}`);
if (v2.includes("document.addEventListener") || v2.includes("window.SalitaQuestSharingRouter =")) {
  fail("V2 entry loader owns router implementation behavior");
}

for (const required of [
  "__salitaQuestAchievementSharingRouterV3Installed",
  "__salitaQuestAchievementSharingRouterV3CompatibilityLoading",
  moduleUrl,
  "document.write",
  "script.async = false"
]) if (!rootLoader.includes(required)) fail(`Root compatibility loader is missing ${required}`);
for (const forbidden of [
  "document.addEventListener",
  "window.SalitaQuestSharingRouter =",
  "navigator.share",
  "navigator.clipboard",
  "localStorage",
  "sessionStorage"
]) if (rootLoader.includes(forbidden)) fail(`Root compatibility loader owns ${forbidden}`);

for (const required of [
  'const INSTALL_FLAG = "__salitaQuestAchievementSharingRouterV3Installed"',
  'const RELEASE = "5.5.21-mobile-share-desktop-save-only"',
  'const MODAL_ID = "achievementShareModalV4"',
  'const PREVIEW_ID = "achievementSharePreview"',
  '(max-width: 800px), (pointer: coarse)',
  'data-sq-share-main',
  'data-sq-share-save',
  'document.addEventListener("click"',
  'document.addEventListener("salita:achievement-share-prepared"',
  'document.addEventListener("salita:achievement-share-closed"',
  'window.SalitaQuestSharingRouter = Object.freeze',
  'modes:Object.freeze(["mobile_native_image_share","desktop_save_only"])',
  'document.documentElement.dataset.achievementSharingRouter = RELEASE'
]) if (!moduleSource.includes(required)) fail(`Extracted router is missing ${required}`);
if (count(moduleSource, "document.addEventListener(") !== 3) fail("Extracted router must own exactly three document listeners");
if (!moduleSource.includes('  }, true);')) fail("Sharing click interception must remain capture-phase");
if (/localStorage|sessionStorage/.test(moduleSource)) fail("Extracted router must not access learner storage");

const listeners = [];
const sandbox = {
  console,
  Promise,
  Object,
  String,
  Math,
  URL:{createObjectURL(){return "blob:test";},revokeObjectURL(){}},
  File:class {},
  Image:class {},
  navigator:{},
  window:{
    matchMedia(){return {matches:false};},
    setTimeout(){return 1;}
  },
  document:{
    addEventListener(name, handler, options){listeners.push({name,handler,options});},
    getElementById(){return null;},
    createElement(){return {};},
    body:{appendChild(){}},
    documentElement:{dataset:{}}
  }
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
new vm.Script(moduleSource, {filename:"src/features/sharing/achievement-sharing-router-v3.js"}).runInContext(sandbox);
const api = sandbox.window.SalitaQuestSharingRouter;
if (!api || api.version !== 3 || api.release !== "5.5.21-mobile-share-desktop-save-only") fail("Router public API changed");
if (api.modes.join(",") !== "mobile_native_image_share,desktop_save_only") fail("Router modes changed");
if (listeners.map(item => item.name).join(",") !== "click,salita:achievement-share-prepared,salita:achievement-share-closed") fail("Router listener names or order changed");
if (listeners[0].options !== true) fail("Router click listener is no longer capture-phase");
if (sandbox.document.documentElement.dataset.achievementSharingRouter !== api.release) fail("Router readiness dataset changed");

const routerIndex = profileLoader.indexOf('"achievement-sharing-router"');
const bridgeIndex = profileLoader.indexOf('"sharing"', routerIndex + 1);
if (!(routerIndex >= 0 && bridgeIndex > routerIndex)) fail("Profile sharing router → bridge order changed");

for (const required of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./achievement-sharing-router-v2.js"',
  '"./achievement-sharing-router-v2.css"',
  '"./achievement-sharing-router-v3.js"',
  '"./src/features/sharing/achievement-sharing-router-v3.js"'
]) if (!worker.includes(required)) fail(`Service worker is missing ${required}`);

console.log("Achievement sharing router extraction validation passed: stable v2 entry, compatibility-only root, feature-owned API and listeners, no storage, preserved ordering and r60 offline delivery.");
