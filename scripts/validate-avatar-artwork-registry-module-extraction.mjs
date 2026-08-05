import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };
const count = (source, token) => source.split(token).length - 1;

const rootSource = read("avatar-artwork-registry-v554.js");
const moduleSource = read("src/features/avatar/avatar-artwork-registry-v554.js");
const profileSource = read("profile-emblem-control.js");
const mobileRefresh = read("mobile-refresh.html");
const serviceWorker = read("service-worker.js");

new vm.Script(rootSource, {filename:"avatar-artwork-registry-v554.js"});
new vm.Script(moduleSource, {filename:"src/features/avatar/avatar-artwork-registry-v554.js"});

const moduleUrl = "./src/features/avatar/avatar-artwork-registry-v554.js?v=5.5.6";
if (!rootSource.includes(moduleUrl)) fail("Compatibility loader does not target the extracted registry");
for (const required of [
  "__salitaAvatarArtworkRegistryV556Installed",
  "__salitaAvatarArtworkRegistryCompatibilityLoading",
  "document.write",
  "script.async = false"
]) {
  if (!rootSource.includes(required)) fail(`Compatibility loader is missing ${required}`);
}
for (const forbidden of [
  "localStorage.getItem",
  "sessionStorage.getItem",
  "document.addEventListener",
  "window.SalitaAvatarArtwork =",
  "window.SalitaAvatarArtworkReady =",
  "window.getAvatarImagePath ="
]) {
  if (rootSource.includes(forbidden)) fail(`Compatibility loader owns implementation behavior: ${forbidden}`);
}

for (const required of [
  "__salitaAvatarArtworkRegistryV556Installed",
  'const RELEASE = "5.5.6"',
  'const PROFILE_STORE = "salitaQuestLocalProfilesV1"',
  'const ACTIVE_PROFILE = "salitaQuestActiveProfileId"',
  "window.SalitaAvatarArtwork = api",
  "window.getAvatarImagePath = api.getAvatarImagePath",
  "window.SalitaAvatarArtworkReady = (async () =>",
  'manifestPath:"avatars/canonical/manifest.json"',
  "getAvatarImagePath",
  "resolve",
  "bind",
  "repair",
  "syncEquipped",
  "verifyAll",
  'document.addEventListener("salita:avatar-equipped"',
  'document.addEventListener("salita:avatar-collection-changed"',
  ".sq-profile-button img,.sq-profile-identity img,.sq-profile-emblem-trigger img,.player-avatar img",
  "data:image/svg+xml;charset=utf-8",
  "window.SalitaAvatarModel?.catalogue?.length === 48"
]) {
  if (!moduleSource.includes(required)) fail(`Extracted registry is missing ${required}`);
}
if (count(moduleSource, "document.addEventListener(") !== 2) fail("Extracted registry must own exactly two document listeners");
if (count(moduleSource, "localStorage.getItem(") !== 1) fail("Extracted registry must retain exactly one local profile read");
if (count(moduleSource, "sessionStorage.getItem(") !== 1) fail("Extracted registry must retain exactly one active-profile read");
if (/localStorage\.(?:setItem|removeItem|clear)\(/.test(moduleSource)) fail("Artwork registry must not write learner state");
if (/sessionStorage\.(?:setItem|removeItem|clear)\(/.test(moduleSource)) fail("Artwork registry must not write session state");

const directModule = "./src/features/avatar/avatar-artwork-registry-v554.js?v=${RELEASE_VERSION}";
if (!profileSource.includes(directModule)) fail("Profile shell does not load the extracted registry directly");
if (profileSource.includes("`./avatar-artwork-registry-v554.js?v=${RELEASE_VERSION}`")) fail("Profile shell still directly loads the root registry URL");
const catalogueIndex = profileSource.indexOf("src/features/avatar/avatar-catalogue-v1.js");
const artworkIndex = profileSource.indexOf("src/features/avatar/avatar-artwork-registry-v554.js");
const modelHotfixIndex = profileSource.indexOf("src/features/avatar/avatar-progression-model-v551.js");
const navigationAdapterIndex = profileSource.indexOf("src/adapters/navigation/avatar-collections-navigation-v551.js");
const hotfixIndex = profileSource.indexOf("avatar-progression-hotfix-v551.js");
const migrationIndex = profileSource.indexOf("src/features/avatar/avatar-progression-migration-v1.js");
if (!(catalogueIndex >= 0 && catalogueIndex < artworkIndex && artworkIndex < modelHotfixIndex && modelHotfixIndex < navigationAdapterIndex && navigationAdapterIndex < hotfixIndex && hotfixIndex < migrationIndex)) {
  fail("Profile catalogue → artwork → model hotfix → navigation adapter → coordinator → migration order changed");
}

const mobileModule = "./src/features/avatar/avatar-artwork-registry-v554.js?v=${RELEASE}";
if (!mobileRefresh.includes(mobileModule)) fail("Mobile refresh does not load the extracted registry directly");
if (mobileRefresh.includes("`./avatar-artwork-registry-v554.js?v=${RELEASE}`")) fail("Mobile refresh still directly loads the root registry URL");
const mobileCatalogue = mobileRefresh.indexOf("src/features/avatar/avatar-catalogue-v1.js");
const mobileMigration = mobileRefresh.indexOf("src/features/avatar/avatar-progression-migration-v1.js");
const mobileArtwork = mobileRefresh.indexOf("src/features/avatar/avatar-artwork-registry-v554.js");
if (!(mobileCatalogue >= 0 && mobileCatalogue < mobileMigration && mobileMigration < mobileArtwork)) {
  fail("Mobile refresh catalogue → migration → artwork order changed");
}

for (const required of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./avatar-artwork-registry-v554.js"',
  '"./src/features/avatar/avatar-artwork-registry-v554.js"'
]) {
  if (!serviceWorker.includes(required)) fail(`Service worker is missing ${required}`);
}

class FakeImageElement {
  constructor() {
    this.dataset = {};
    this.attributes = new Map();
    this.alt = "";
    this.onerror = null;
  }
  getAttribute(name) { return this.attributes.get(name) || null; }
  set src(value) { this.attributes.set("src", value); }
  get src() { return this.attributes.get("src") || ""; }
  closest() { return null; }
}

const catalogue = Array.from({length:48}, (_, index) => ({
  id:index === 0 ? "anahaw" : `avatar_${index}`,
  name:index === 0 ? "Anahaw" : `Avatar ${index}`,
  image:index === 0 ? "avatars/canonical/anahaw.png" : `avatars/canonical/avatar_${index}.png`
}));
const byId = new Map(catalogue.map(item => [item.id, item]));
const listeners = [];
let localReads = 0;
let sessionReads = 0;
const sandbox = {
  console,
  Promise,
  Object,
  String,
  JSON,
  encodeURIComponent,
  HTMLImageElement:FakeImageElement,
  Image:class {
    set src(value) {
      this.value = value;
      queueMicrotask(() => this.onload?.());
    }
  },
  localStorage:{
    getItem(key) {
      localReads += 1;
      if (key !== "salitaQuestLocalProfilesV1") return null;
      return JSON.stringify({profiles:[{id:"active",avatarCollection:{equippedAvatarId:"anahaw"}}]});
    }
  },
  sessionStorage:{
    getItem(key) {
      sessionReads += 1;
      return key === "salitaQuestActiveProfileId" ? "active" : null;
    }
  },
  document:{
    addEventListener(name, handler) { listeners.push({name, handler}); },
    querySelectorAll() { return []; }
  },
  window:{
    SalitaAvatarModel:{
      catalogue,
      normaliseId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); },
      get(value) { return byId.get(String(value || "")) || null; }
    },
    setTimeout(handler) { handler(); return 1; }
  }
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
new vm.Script(moduleSource, {filename:"src/features/avatar/avatar-artwork-registry-v554.js"}).runInContext(sandbox);
const api = await sandbox.window.SalitaAvatarArtworkReady;
if (api !== sandbox.window.SalitaAvatarArtwork) fail("Artwork readiness promise does not resolve to the public API");
if (api.release !== "5.5.6" || Object.keys(api.paths).length !== 48) fail("Artwork API release or canonical path set changed");
if (api.getAvatarImagePath("anahaw") !== "avatars/canonical/anahaw.png") fail("Known avatar path resolution changed");
if (!api.getAvatarImagePath("missing avatar").startsWith("data:image/svg+xml")) fail("Missing-avatar placeholder behavior changed");
if (sandbox.window.getAvatarImagePath !== api.getAvatarImagePath) fail("Legacy getAvatarImagePath alias changed");
if (listeners.map(item => item.name).join(",") !== "salita:avatar-equipped,salita:avatar-collection-changed") fail("Artwork listener ownership changed");
if (localReads !== 1 || sessionReads !== 1) fail("Ready-time equipped-avatar storage reads changed");

const image = new FakeImageElement();
const bound = await api.bind(image, "anahaw", {alt:"Anahaw avatar"});
if (bound !== "avatars/canonical/anahaw.png" || image.src !== bound || image.alt !== "Anahaw avatar") fail("Image binding behavior changed");
image.onerror();
if (image.dataset.sqAvatarFallback !== "true" || !image.src.startsWith("data:image/svg+xml")) fail("Image fallback behavior changed");
const verification = await api.verifyAll();
if (verification.total !== 48 || verification.working !== 48 || verification.failed.length) fail("Canonical artwork verification behavior changed");

console.log("Avatar artwork registry extraction validation passed: direct feature loading, compatibility-only root, stable public API, two listeners, read-only storage and r59 offline delivery.");
