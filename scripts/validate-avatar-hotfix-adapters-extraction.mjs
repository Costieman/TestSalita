import fs from "node:fs";
import vm from "node:vm";

const read = file => fs.readFileSync(file, "utf8");
const fail = message => { throw new Error(message); };
const rootFile = "avatar-progression-hotfix-v551.js";
const modelFile = "src/features/avatar/avatar-progression-model-v551.js";
const navigationFile = "src/adapters/navigation/avatar-collections-navigation-v551.js";
const rootSource = read(rootFile);
const modelSource = read(modelFile);
const navigationSource = read(navigationFile);
const catalogueSource = read("src/features/avatar/avatar-catalogue-v1.js");
const loader = read("profile-emblem-control.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

for (const [file, source] of [[rootFile, rootSource], [modelFile, modelSource], [navigationFile, navigationSource]]) {
  new vm.Script(source, {filename:file});
  if (/localStorage|sessionStorage/.test(source)) fail(`${file} must not own learner storage`);
}

for (const marker of [
  'const MODEL_URL = "./src/features/avatar/avatar-progression-model-v551.js?v=5.5.6"',
  'const NAVIGATION_URL = "./src/adapters/navigation/avatar-collections-navigation-v551.js?v=5.5.6"',
  "window.SalitaAvatarHotfixReady = Promise.resolve()",
  "loadDependency",
  "SalitaAvatarProgressionModelV551",
  "SalitaAvatarCollectionsNavigationV551",
  ".patch()",
  ".install()"
]) if (!rootSource.includes(marker)) fail(`Coordinator missing ${marker}`);
for (const forbidden of [
  "function patchModel", "normaliseCollectionState", "weeklyShardAwards", "function collectionsIcon",
  "switchView =", "renderBadges", "closeMobileMenu", "collectionsView", "salita:avatar-model-hotfixed"
]) if (rootSource.includes(forbidden)) fail(`Coordinator still owns ${forbidden}`);

for (const marker of [
  'const RELEASE = "5.5.6"', "function patchModel", "normaliseCollectionState",
  "weeklyShardAwards", "levelRewards", "window.SalitaAvatarCatalogue = catalogue",
  "window.SalitaAvatarModel = model", 'new CustomEvent("salita:avatar-model-hotfixed"',
  "window.SalitaAvatarProgressionModelV551 = Object.freeze"
]) if (!modelSource.includes(marker)) fail(`Model feature missing ${marker}`);
for (const forbidden of [
  "switchView", "closeMobileMenu", "renderBadges", "collectionsView",
  "data-open-badge-collection", "data-open-avatar-collection-main", "setTimeout"
]) if (modelSource.includes(forbidden)) fail(`Model feature reaches navigation through ${forbidden}`);

for (const marker of [
  'const RELEASE = "5.5.6"', "function collectionsIcon", "function installCollectionsNavigation",
  "__salitaQuestCollectionsNavigationV551Installed", "switchViewWithCollections",
  "data-open-badge-collection", "data-open-avatar-collection-main", "closeMobileMenu",
  "renderBadges", 'new CustomEvent("salita:open-avatar-collection"',
  "window.SalitaAvatarCollectionsNavigationV551 = Object.freeze"
]) if (!navigationSource.includes(marker)) fail(`Navigation adapter missing ${marker}`);
for (const forbidden of [
  "function patchModel", "normaliseCollectionState", "weeklyShardAwards",
  "SalitaAvatarCatalogue =", "SalitaAvatarModel =", "salita:avatar-model-hotfixed"
]) if (navigationSource.includes(forbidden)) fail(`Navigation adapter owns model behavior through ${forbidden}`);

const orderedLoaderTokens = [
  'loadScript("catalogue"',
  'loadScript("artwork-runtime"',
  'loadScript("hotfix-model"',
  'loadScript("hotfix-navigation"',
  'loadScript("hotfix-runtime"',
  "await window.SalitaAvatarHotfixReady",
  'loadScript("migration"'
];
let last = -1;
for (const token of orderedLoaderTokens) {
  const index = loader.indexOf(token);
  if (index < 0 || index <= last) fail(`Profile loader order changed at ${token}`);
  last = index;
}
for (const marker of [
  `./${modelFile}?v=\${RELEASE_VERSION}`,
  `./${navigationFile}?v=\${RELEASE_VERSION}`,
  `./${rootFile}?v=\${RELEASE_VERSION}`
]) if (!loader.includes(marker)) fail(`Profile loader missing ${marker}`);

const refreshTokens = [
  `./${modelFile}?v=\${RELEASE}`,
  `./${navigationFile}?v=\${RELEASE}`,
  `./${rootFile}?v=\${RELEASE}`
];
last = -1;
for (const token of refreshTokens) {
  const index = refresh.indexOf(token);
  if (index < 0 || index <= last) fail(`Mobile refresh order changed at ${token}`);
  last = index;
}

const previousCache = worker.match(/const PREVIOUS_CACHE_NAME = "([^"]+)"/)?.[1] || "";
const currentCache = worker.match(/const CACHE_NAME = "([^"]+)"/)?.[1] || "";
if (previousCache !== "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72") fail("Previous cache is not r68");
if (currentCache !== "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73") fail("Current cache is not r69");
for (const marker of [`"./${rootFile}"`, `"./${modelFile}"`, `"./${navigationFile}"`]) {
  if (!worker.includes(marker)) fail(`Offline delivery missing ${marker}`);
}

function classList() {
  const values = new Set();
  return {
    add(value){ values.add(value); },
    remove(value){ values.delete(value); },
    contains(value){ return values.has(value); },
    toggle(value, force){
      if (force === undefined) force = !values.has(value);
      if (force) values.add(value); else values.delete(value);
      return force;
    }
  };
}
function node(id = "") {
  const listeners = new Map();
  return {
    id, dataset:{}, className:"", classList:classList(), title:"", innerHTML:"", children:[],
    setAttribute(name, value){ this[name] = String(value); },
    addEventListener(name, handler){
      const list = listeners.get(name) || [];
      list.push(handler);
      listeners.set(name, list);
    },
    listenerCount(name){ return (listeners.get(name) || []).length; },
    fire(name, event = {}){ for (const handler of listeners.get(name) || []) handler(event); },
    replaceChildren(...children){ this.children = children; },
    querySelector(){ return null; }
  };
}
function runtimeDom() {
  const nav = node("collectionsNav"); nav.dataset.view = "badges";
  const mobile = node("mobileCollections"); mobile.dataset.view = "badges";
  const badgeButton = node("badgeButton");
  const avatarButton = node("avatarButton");
  const badgesView = node("badgesView");
  const settingsView = node("settingsView");
  const viewTitle = node("viewTitle");
  const mobileViewTitle = node("mobileViewTitle");
  const sidebarOther = node("otherNav");
  const main = node("main");
  const elements = new Map([["badgesView", badgesView], ["settingsView", settingsView], ["viewTitle", viewTitle], ["mobileViewTitle", mobileViewTitle]]);
  main.insertBefore = element => { elements.set(element.id, element); };
  const document = {
    baseURI:"https://example.test/",
    currentScript:null,
    head:{appendChild(){}},
    documentElement:{dataset:{}},
    querySelector(selector){
      if (selector === '.sidebar .nav-item[data-view="badges"]') return nav;
      if (selector === ".main-area") return main;
      if (selector === '.mobile-more-grid [data-view="badges"]') return mobile;
      return null;
    },
    querySelectorAll(selector){ return selector === ".sidebar .nav-item" ? [nav, sidebarOther] : []; },
    getElementById(id){ return elements.get(id) || null; },
    createElement(tag){
      const element = node();
      if (tag === "section") {
        element.querySelector = selector => selector === "[data-open-badge-collection]" ? badgeButton : selector === "[data-open-avatar-collection-main]" ? avatarButton : null;
      }
      return element;
    },
    createTextNode(text){ return {textContent:String(text)}; },
    dispatchEvent(event){ document.events.push(event); return true; },
    events:[]
  };
  return {document, nav, mobile, badgeButton, avatarButton, viewTitle, mobileViewTitle};
}

const dom = runtimeDom();
const calls = [];
let closeCount = 0;
let renderCount = 0;
class CustomEvent { constructor(type, options={}) { this.type=type; this.detail=options.detail; } }
const context = {
  console, Object, Array, Set, Map, Date, Math, Number, String, Boolean, JSON, Promise, URL,
  CustomEvent, document:dom.document,
  switchView(view){ calls.push(view); return `base:${view}`; },
  closeMobileMenu(){ closeCount += 1; },
  renderBadges(){ renderCount += 1; },
  setTimeout(){ return 1; }, clearTimeout(){},
  window:null, globalThis:null
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(catalogueSource, context, {filename:"src/features/avatar/avatar-catalogue-v1.js"});
vm.runInContext(modelSource, context, {filename:modelFile});
vm.runInContext(navigationSource, context, {filename:navigationFile});
vm.runInContext(rootSource, context, {filename:rootFile});
const model = await context.SalitaAvatarHotfixReady;
if (model !== context.SalitaAvatarModel || model?.hotfixRelease !== "5.5.6") fail("Ready promise did not return patched model");
if (model.catalogue.length !== 48 || model.weeklyShardAward("common") !== 100 || model.weeklyShardAward("rare") !== 25) fail("Avatar progression model changed");
if (model.get("philippine_eagle")?.id !== "eagle") fail("Avatar alias normalization changed");
const state = model.normaliseCollectionState({
  equippedAvatarId:"philippine_eagle",
  ownedAvatarIds:["anahaw","philippine_eagle","unknown"],
  shards:{dugong:150,unknown:20},
  pendingUnlocks:[{avatarId:"dugong",source:"weekly"},{avatarId:"dugong",source:"weekly"}],
  levelRewardsClaimed:[10,20,20,0,100]
});
if (state.equippedAvatarId !== "eagle" || !state.ownedAvatarIds.includes("eagle") || state.shards.dugong !== 100) fail("Collection normalization changed");
if (state.pendingUnlocks.length !== 1 || state.levelRewardsClaimed.join(",") !== "10,20") fail("Pending/claim normalization changed");
if (dom.document.events.filter(event => event.type === "salita:avatar-model-hotfixed").length !== 1) fail("Model hotfix event changed");
if (!context.__salitaQuestCollectionsNavigationV551Installed || dom.nav.dataset.view !== "collections") fail("Collections navigation did not install");
if (context.switchView("collections") !== "base:collections" || calls.at(-1) !== "collections") fail("Collections switchView wrapper changed");
if (dom.viewTitle.children[0]?.textContent !== "Collections" || dom.mobileViewTitle.children[0]?.textContent !== "Collections") fail("Collections titles changed");
const stopEvent = {preventDefault(){this.prevented=true;},stopPropagation(){},stopImmediatePropagation(){}};
dom.nav.fire("click", stopEvent);
if (!stopEvent.prevented || closeCount !== 1 || calls.at(-1) !== "collections") fail("Collections navigation click changed");
dom.badgeButton.fire("click");
if (calls.at(-1) !== "badges" || renderCount !== 1) fail("Badge collection action changed");
dom.avatarButton.fire("click");
if (dom.document.events.at(-1)?.type !== "salita:open-avatar-collection") fail("Avatar collection action changed");
const wrappedSwitch = context.switchView;
const navClicks = dom.nav.listenerCount("click");
context.SalitaAvatarCollectionsNavigationV551.install();
if (context.switchView !== wrappedSwitch || dom.nav.listenerCount("click") !== navClicks) fail("Navigation install idempotency changed");
const modelBefore = context.SalitaAvatarModel;
if (context.SalitaAvatarProgressionModelV551.patch() !== modelBefore) fail("Model patch idempotency changed");

const historicalDom = runtimeDom();
const loaded = [];
const historical = {
  console, Object, Array, Set, Map, Date, Math, Number, String, Boolean, JSON, Promise, URL,
  CustomEvent, document:historicalDom.document,
  switchView(){}, closeMobileMenu(){}, renderBadges(){}, setTimeout(){return 1;}, clearTimeout(){},
  window:null, globalThis:null
};
historical.window = historical;
historical.globalThis = historical;
vm.createContext(historical);
vm.runInContext(catalogueSource, historical, {filename:"src/features/avatar/avatar-catalogue-v1.js"});
historicalDom.document.querySelector = selector => {
  if (selector === '.sidebar .nav-item[data-view="badges"]') return historicalDom.nav;
  if (selector === ".main-area") return runtimeDom().document.querySelector(".main-area");
  if (selector === '.mobile-more-grid [data-view="badges"]') return historicalDom.mobile;
  return null;
};
const originalCreate = historicalDom.document.createElement.bind(historicalDom.document);
historicalDom.document.createElement = tag => {
  if (tag !== "script") return originalCreate(tag);
  const script = node();
  script.dataset = {};
  script.handlers = {};
  script.addEventListener = (name, handler) => { script.handlers[name] = handler; };
  return script;
};
historicalDom.document.head.appendChild = script => {
  try {
    if (script.src.includes("avatar-progression-model-v551.js")) {
      loaded.push("model");
      vm.runInContext(modelSource, historical, {filename:modelFile});
    } else if (script.src.includes("avatar-collections-navigation-v551.js")) {
      loaded.push("navigation");
      vm.runInContext(navigationSource, historical, {filename:navigationFile});
    } else throw new Error(`Unexpected dependency ${script.src}`);
    script.handlers.load?.();
  } catch (error) { script.handlers.error?.(error); }
};
vm.runInContext(rootSource, historical, {filename:rootFile});
const historicalModel = await historical.SalitaAvatarHotfixReady;
if (loaded.join(",") !== "model,navigation" || historicalModel?.hotfixRelease !== "5.5.6") fail("Historical root-only dependency loading changed");

console.log("Avatar hotfix adapter extraction validation passed.");
