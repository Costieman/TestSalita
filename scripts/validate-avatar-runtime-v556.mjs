import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "avatars/canonical");
const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS, "manifest.json"), "utf8"));
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const errors = [];
const checks = [];
const check = (condition, message) => {
  checks.push({message, passed:Boolean(condition)});
  if (!condition) errors.push(message);
};

const sources = {
  catalogue:read("src/features/avatar/avatar-catalogue-v1.js"),
  artwork:read("src/features/avatar/avatar-artwork-registry-v554.js"),
  modelHotfix:read("src/features/avatar/avatar-progression-model-v551.js"),
      navigationAdapter:read("src/adapters/navigation/avatar-collections-navigation-v551.js"),
      compatibility:read("avatar-progression-hotfix-v551.js"),
  profileLoader:read("profile-emblem-control.js"),
  profile:read("profile-app.js"),
  collection:read("avatar-collection-screen-v1.js"),
  avatarCaseRoot:read("avatar-case-v1.js"),
  avatarCaseProfile:read("src/adapters/avatar/avatar-case-profile-runtime-v1.js"),
  avatarCase:read("src/features/avatar/avatar-case-v1.js"),
  weekly:read("weekly-avatar-shard-rewards-v1.js"),
  level:read("src/features/avatar/level-avatar-rewards-v1.js"),
  unlock:read("avatar-unlock-celebration-v1.js"),
  sharing:read("achievement-sharing-avatar-bridge-v1.js"),
  worker:read("service-worker.js"),
  refresh:read("mobile-refresh.html"),
  css:read("profile-emblem-control.css")
};

for (const [name, source] of Object.entries(sources)) {
  if (["refresh", "css"].includes(name)) continue;
  try { new vm.Script(source, {filename:name}); check(true, `${name} runtime parses`); }
  catch (error) { check(false, `${name} runtime parses: ${error.message}`); }
}

const sandbox = {
  console, Object, Array, Set, Map, Date, Math, Number, String, Boolean, JSON, Promise,
  CustomEvent:class CustomEvent { constructor(type, init={}) { this.type=type; this.detail=init.detail; } },
  document:{dispatchEvent(){},querySelector(){return null;},querySelectorAll(){return[];},getElementById(){return null;},createElement(){return{};},documentElement:{}},
  setTimeout(){return 0;}, clearTimeout(){}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
new vm.Script(sources.catalogue).runInContext(sandbox);
new vm.Script(sources.modelHotfix).runInContext(sandbox);
new vm.Script(sources.navigationAdapter).runInContext(sandbox);
new vm.Script(sources.compatibility).runInContext(sandbox);
await sandbox.SalitaAvatarHotfixReady;
const model = sandbox.SalitaAvatarModel;

check(model?.catalogue?.length === 48, "Catalogue contains exactly 48 avatars");
check(model?.manifestPath === "avatars/canonical/manifest.json", "Catalogue declares the canonical manifest");
check(new Set(model.catalogue.map(item => item.id)).size === 48, "Stable avatar IDs are unique");
check(new Set(model.catalogue.map(item => item.image)).size === 48, "Canonical image paths are unique");
check(model.catalogue.every(item => item.image === `avatars/canonical/${item.id}.png`), "Every catalogue image is a direct canonical PNG");
check(model.get("philippine_eagle")?.id === "eagle", "Historical eagle alias resolves");
check(model.get("luzon_bleeding_heart")?.id === "luzon_bleeding_heart_dove", "Historical dove alias resolves");
check(model.list({rarity:"starter"}).length === 4, "Four starter identities remain available");

const representative = model.normaliseCollectionState({
  equippedAvatarId:"luzon_bleeding_heart",
  ownedAvatarIds:["anahaw","philippine_eagle","luzon_bleeding_heart"],
  shards:{philippine_eagle:67,dugong:44},
  pendingUnlocks:[{avatarId:"dugong",source:"weekly",seen:false}],
  levelRewardsClaimed:[10,20,20],
  needsStarterChoice:false
}, "anahaw");
check(representative.equippedAvatarId === "luzon_bleeding_heart_dove", "Equipped historical alias is preserved");
check(representative.ownedAvatarIds.includes("eagle"), "Owned historical eagle is preserved");
check(representative.ownedAvatarIds.includes("luzon_bleeding_heart_dove"), "Owned historical dove is preserved");
check(representative.shards.dugong === 44, "Partial shard totals are preserved");
check(representative.pendingUnlocks[0]?.avatarId === "dugong", "Pending unlocks are preserved");
check(representative.levelRewardsClaimed.join(",") === "10,20", "Level reward claims are preserved and deduplicated");

const artworkRuntime = sources.artwork + sources.modelHotfix + sources.navigationAdapter + sources.compatibility;
for (const [needle, message] of [
  ["MutationObserver", "No avatar-source observer remains"],
  ['createElement("canvas")', "No avatar canvas extraction remains"],
  ["createImageBitmap", "No avatar bitmap conversion remains"],
  ["raw.githubusercontent.com", "No raw GitHub avatar fallback remains"],
  ["rare-animals-set2-sprite", "No active avatar sprite remains"],
  ["PATH_BY_ID", "No duplicate artwork path registry remains"]
]) check(!artworkRuntime.includes(needle), message);
check(!sources.profileLoader.includes("repair(document)"), "No document-wide artwork repair pass remains");
check(sources.profileLoader.includes('RELEASE_VERSION = "5.5.6"'), "Profile runtime retains canonical avatar release version");
check(sources.profileLoader.includes('AVATAR_CASE_VERSION = "5.5.9"'), "Profile runtime loads the versioned Avatar Case");
check(sources.refresh.includes('RELEASE = "5.5.6"'), "Recovery page retains canonical avatar release version");
check(sources.css.includes("image-rendering:auto!important"), "Avatar scaling uses normal high-resolution rendering");

check(sources.profile.includes("data-sq-avatar-id"), "Profile images carry stable avatar IDs");
check(sources.collection.includes("data-sq-avatar-id"), "Collection images carry stable avatar IDs");
check(sources.avatarCase.includes("const MAX_CASE_AVATARS = 4"), "Avatar Case uses four slots");
check(sources.avatarCaseProfile.includes("profile.avatarCaseIds = cleaned"), "Avatar Case persists separately on the profile");
check(!/profile\.avatarId\s*=|equippedAvatarId\s*=/.test(sources.avatarCase + sources.avatarCaseProfile), "Avatar Case does not change the equipped avatar");
check(sources.weekly.includes("item.image") || sources.weekly.includes("SalitaAvatarArtwork"), "Weekly rewards resolve canonical artwork");
check(sources.level.includes("avatar:item") && sources.level.includes("avatarId:item.id"), "Level rewards hand the canonical avatar record to the unlock renderer");
check(sources.unlock.includes("item.image") || sources.unlock.includes("getAvatarImagePath") || sources.unlock.includes("SalitaAvatarArtwork"), "Unlock celebrations resolve canonical artwork");
check(sources.sharing.includes("canonicalAvatarPath") && sources.sharing.includes("item?.image"), "Compatibility bridge resolves canonical artwork directly");
check(sources.sharing.includes("compatibilityOnly:true"), "Avatar sharing bridge declares compatibility-only mode");
check(sources.sharing.includes("controller()?.openAvatar"), "Avatar sharing bridge delegates to the shared controller");
check(!sources.sharing.includes("window.SalitaQuestAchievementSharing ="), "Avatar sharing bridge does not replace the shared controller");
check(!sources.sharing.includes('document.addEventListener("click"'), "Avatar sharing bridge does not intercept sharing clicks");
check(!sources.sharing.includes("LEGACY_AVATAR_PATTERN"), "Sharing contains no legacy path redirect");
check(!sources.sharing.includes("nativeDescriptor"), "Sharing contains no image-source descriptor rewrite");
check(!sources.sharing.includes("window." + "Image ="), "Sharing does not replace the global image constructor");

const manifestPaths = manifest.avatars.map(item => `./${item.canonicalPath}`);
const cached = [...sources.worker.matchAll(/"\.\/avatars\/canonical\/[^"]+\.png"/g)].map(match => match[0].slice(1,-1));
check(cached.length === 48, "Service worker lists exactly 48 canonical PNGs");
check(new Set(cached).size === 48, "Service-worker canonical paths are unique");
check(manifestPaths.every(file => cached.includes(file)), "Service worker precaches every manifest image");
check(!/"\.\/avatars\/(?!canonical\/)/.test(sources.worker), "Service worker does not cache legacy avatar artwork");
check(sources.worker.includes('PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"'), "Service worker records the pre-modular cache boundary");
check(sources.worker.includes('CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"'), "Service-worker cache revision is the modular-bootstrap release");
check(sources.worker.includes('"./avatar-case-v1.js"') && sources.worker.includes('"./avatar-case-v1.css"'), "Service worker precaches Avatar Case assets");
check(sources.worker.includes('"./desktop-navigation-refinement.js"') && sources.worker.includes('"./desktop-navigation-refinement.css"'), "Service worker precaches persistent-navigation assets");

function pngMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if (buffer.length < 26 || !buffer.subarray(0,8).equals(signature)) return null;
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20),colorType:buffer[25]};
}
check(manifest.avatars.length === 48, "Manifest contains 48 identities");
for (const item of manifest.avatars) {
  const file = path.join(ASSETS, `${item.id}.png`);
  check(fs.existsSync(file), `${item.id} canonical file exists`);
  if (!fs.existsSync(file)) continue;
  const metadata = pngMetadata(file);
  check(metadata?.width === 512 && metadata?.height === 512, `${item.id} is a valid 512 × 512 PNG`);
  check(metadata?.colorType === 4 || metadata?.colorType === 6, `${item.id} preserves an alpha channel`);
}

const report = {
  status:errors.length ? "FAIL" : "PASS",
  release:"5.6.0-modular-bootstrap",
  canonicalAvatarCount:model.catalogue.length,
  serviceWorkerCanonicalAssets:cached.length,
  checksPassed:checks.filter(item => item.passed).length,
  checksFailed:checks.filter(item => !item.passed).length,
  errors
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
