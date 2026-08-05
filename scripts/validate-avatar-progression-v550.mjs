import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = message => { throw new Error(message); };
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

const validators = [
  {file:"scripts/validate-canonical-avatar-mapping.mjs", args:["--require-assets"]},
  {file:"scripts/validate-avatar-catalogue.mjs", args:[]},
  {file:"scripts/validate-avatar-onboarding.mjs", args:[]},
  {file:"scripts/validate-avatar-collection-screen.mjs", args:[]},
  {file:"scripts/validate-avatar-case.mjs", args:[]},
  {file:"scripts/validate-weekly-avatar-shards.mjs", args:[]},
  {file:"scripts/validate-stage1-popup-governance-v553.mjs", args:[]},
  {file:"scripts/validate-avatar-runtime-v556.mjs", args:[]},
  {file:"scripts/validate-persistent-navigation.mjs", args:[]},
  {file:"scripts/validate-achievement-image-transport.mjs", args:[]}
];

for (const validator of validators) {
  const absolute = path.join(root, validator.file);
  if (!fs.existsSync(absolute)) fail(`Missing validator: ${validator.file}`);
  const run = spawnSync(process.execPath, [absolute, ...validator.args], {cwd:root, encoding:"utf8", stdio:"pipe"});
  process.stdout.write(run.stdout || "");
  process.stderr.write(run.stderr || "");
  if (run.status !== 0) fail(`${validator.file} failed with exit code ${run.status}`);
}

const runtimeFiles = [
  "avatar-catalogue-v1.js",
  "src/features/avatar/avatar-catalogue-v1.js",
  "src/features/avatar/avatar-artwork-registry-v554.js",
  "src/features/avatar/avatar-progression-model-v551.js",
  "src/adapters/navigation/avatar-collections-navigation-v551.js",
  "avatar-progression-hotfix-v551.js",
  "profile-app.js",
  "popup-governor-v1.js",
  "src/features/interface/popup-governor-v1.js",
  "profile-emblem-control.js",
  "avatar-collection-screen-v1.js",
  "avatar-case-v1.js",
  "weekly-avatar-shard-rewards-v1.js",
  "level-avatar-rewards-v1.js",
  "level-progression-v2.js",
  "level-up-mobile-safety-v552.js",
  "src/features/interface/level-up-mobile-safety-v552.js",
  "avatar-unlock-celebration-v1.js",
  "achievement-sharing-router-v2.js",
  "achievement-sharing-router-v3.js",
  "src/features/sharing/achievement-sharing-router-v3.js",
  "achievement-sharing-avatar-bridge-v1.js",
  "avatar-progression-migration-v1.js",
  "src/features/avatar/avatar-progression-migration-v1.js",
  "desktop-navigation-refinement.js",
  "src/config/course-manifest.js",
  "src/app/course-bootstrap.js",
  "service-worker.js"
];
for (const file of runtimeFiles) new vm.Script(read(file), {filename:file});

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(read("src/features/avatar/avatar-catalogue-v1.js"), sandbox, {filename:"avatar-catalogue-v1.js"});
const model = sandbox.SalitaAvatarModel;
if (!model || model.catalogue.length !== 48) fail("The integrated catalogue must contain exactly 48 avatars");
if (model.manifestPath !== "avatars/canonical/manifest.json") fail("The integrated catalogue must declare the canonical manifest");
if (!model.catalogue.every(item => item.image === `avatars/canonical/${item.id}.png`)) {
  fail("Every integrated avatar must resolve to its direct canonical PNG path");
}

const loader = read("profile-emblem-control.js");
const orderedTokens = [
  'await loadScript("catalogue"',
  'await loadScript("artwork-runtime"',
  'await loadScript("hotfix-model"',
  'await loadScript("hotfix-navigation"',
  'await loadScript("hotfix-runtime"',
  "await window.SalitaAvatarHotfixReady",
  "await window.SalitaAvatarArtworkReady",
  'await loadScript("migration"',
  'await loadScript("collection"',
  'await loadScript("case"',
  'await loadScript("weekly"',
  'await loadScript("level"',
  'await loadScript("unlock"',
  '        "achievement-sharing-router",',
  '        "sharing",'
];
let lastIndex = -1;
for (const token of orderedTokens) {
  const index = loader.indexOf(token);
  if (index < 0 || index <= lastIndex) fail(`Shared loader order is incorrect at ${token}`);
  lastIndex = index;
}
if (!loader.includes('const RELEASE_VERSION = "5.5.6"')) fail("Shared avatar loader is not cache-busted to its canonical runtime release");
if (!loader.includes('const AVATAR_CASE_VERSION = "5.5.9"')) fail("Shared avatar loader does not version the Avatar Case runtime");
if (!loader.includes('const SHARING_VERSION = "5.5.20.1"')) fail("Shared avatar loader does not version the current social sharing runtime");
if (loader.includes("repair(document)")) fail("Shared loader must not run a document-wide avatar repair pass");

const artwork = read("src/features/avatar/avatar-artwork-registry-v554.js");
const modelHotfix = read("src/features/avatar/avatar-progression-model-v551.js");
const navigationAdapter = read("src/adapters/navigation/avatar-collections-navigation-v551.js");
const compatibility = read("avatar-progression-hotfix-v551.js");
const combinedArtworkRuntime = artwork + modelHotfix + navigationAdapter + compatibility;
for (const prohibited of [
  "raw.githubusercontent.com",
  "rare-animals-set2-sprite",
  "createImageBitmap",
  'createElement("canvas")',
  "PATH_BY_ID"
]) {
  if (combinedArtworkRuntime.includes(prohibited)) fail(`Prohibited avatar mechanism remains active: ${prohibited}`);
}
if (artwork.includes("MutationObserver") || compatibility.includes("MutationObserver")) {
  fail("Avatar artwork runtimes must not install a source mutation observer");
}

const sharingShim = read("achievement-sharing-router-v2.js");
if (!sharingShim.includes('src/features/sharing/achievement-sharing-router-v3.js?v=5.5.21')) fail("Sharing compatibility shim does not load the current v3 router");
const sharingRouter = read("src/features/sharing/achievement-sharing-router-v3.js");
if (!sharingRouter.includes('const RELEASE = "5.5.21-mobile-share-desktop-save-only"')) fail("Current achievement sharing release marker is missing");
if (!sharingRouter.includes('modes:Object.freeze(["mobile_native_image_share","desktop_save_only"])')) fail("Current achievement sharing modes are missing");

const sharingBridge = read("achievement-sharing-avatar-bridge-v1.js");
if (!sharingBridge.includes("compatibilityOnly:true")) fail("Avatar sharing bridge is not explicitly compatibility-only");
if (!sharingBridge.includes("controller()?.openAvatar")) fail("Avatar bridge does not delegate avatar sharing to the shared controller");
if (!sharingBridge.includes("controller()?.openAvatarCase")) fail("Avatar bridge does not delegate Avatar Case sharing to the shared controller");
if (sharingBridge.includes("window.SalitaQuestAchievementSharing =")) fail("Avatar bridge must not replace the shared achievement controller");
if (sharingBridge.includes('document.addEventListener("click"')) fail("Avatar bridge must not intercept share clicks");

const avatarCaseRoot = read("avatar-case-v1.js");
const avatarCaseProfile = read("src/adapters/avatar/avatar-case-profile-runtime-v1.js");
const avatarCase = read("src/features/avatar/avatar-case-v1.js");
if (!avatarCase.includes("const MAX_CASE_AVATARS = 4")) fail("Avatar Case does not enforce four slots");
if (!avatarCaseProfile.includes("profile.avatarCaseIds = cleaned")) fail("Avatar Case state is not persisted account-wide on the profile");
if (/profile\.avatarId\s*=|equippedAvatarId\s*=/.test(avatarCase + avatarCaseProfile)) fail("Avatar Case must not change the equipped avatar");
if (!avatarCaseRoot.includes("SalitaAvatarCaseProfileRuntimeV1") || !avatarCaseRoot.includes("SalitaAvatarCaseFeatureV1")) fail("Avatar Case compatibility coordinator does not load both extracted owners");

const navigation = read("desktop-navigation-refinement.js");
if (!navigation.includes('const RELEASE = "5.5.10-persistent-navigation"')) fail("Persistent navigation release marker is missing");
if (!navigation.includes('action:"avatar-collection"')) fail("Persistent navigation does not expose the Avatar Collection and Avatar Case");
if (navigation.includes("salitaQuestDesktopNavigationCollapsed")) fail("Persistent navigation retains the obsolete collapsed-sidebar preference");

const serviceWorker = read("service-worker.js");
if (!serviceWorker.includes('const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"')) fail("Service worker does not retain the pre-modular release boundary");
if (!serviceWorker.includes('const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"')) fail("Service worker cache version is not the modular-bootstrap release");
if (!serviceWorker.includes('const EXPLICIT_SHARING_ROUTER_DELIVERY = "2026-08-02-feed-private-image-router-1"')) fail("Service worker does not advertise the explicit sharing-router update");
if (!serviceWorker.includes('"./achievement-sharing-router-v2.js"') || !serviceWorker.includes('"./achievement-sharing-router-v2.css"')) fail("Service worker does not precache the sharing compatibility router");
if (!serviceWorker.includes('"./avatar-case-v1.js"') || !serviceWorker.includes('"./avatar-case-v1.css"')) fail("Service worker does not precache the Avatar Case runtime");
if (!serviceWorker.includes('"./desktop-navigation-refinement.js"') || !serviceWorker.includes('"./desktop-navigation-refinement.css"')) fail("Service worker does not precache persistent navigation");
if (!serviceWorker.includes('"./src/config/course-manifest.js"') || !serviceWorker.includes('"./src/app/course-bootstrap.js"')) fail("Service worker does not precache the modular course bootstrap");
const cachedCanonical = [...serviceWorker.matchAll(/"\.\/avatars\/canonical\/[^"]+\.png"/g)];
if (cachedCanonical.length !== 48) fail(`Service worker must cache exactly 48 canonical PNGs, found ${cachedCanonical.length}`);
if (/"\.\/avatars\/(?!canonical\/)/.test(serviceWorker)) fail("Service worker still caches legacy avatar artwork");

const refresh = read("mobile-refresh.html");
if (!refresh.includes('const RELEASE = "5.5.6"')) fail("Mobile refresh is not aligned to the canonical avatar runtime");
if (/localStorage\.(?:clear|removeItem)\(/.test(refresh)) fail("Mobile refresh must not remove learner local-storage data");

const releaseNotes = read("docs/releases/5.5.6-canonical-avatar-runtime.md");
for (const marker of [
  "48 direct canonical PNGs",
  "no runtime sprite extraction",
  "no canvas artwork conversion",
  "no raw GitHub artwork fallback",
  "learner state preservation",
  "merged into `main`"
]) {
  if (!releaseNotes.toLowerCase().includes(marker.toLowerCase())) fail(`5.5.6 release notes are missing ${marker}`);
}

console.log(`Avatar progression integration validation passed: ${model.catalogue.length} direct canonical avatars, four-slot Avatar Case, persistent labelled navigation, current social sharing, modular course bootstrap, compatibility-only bridge, preserved learner state and r53 offline delivery.`);
