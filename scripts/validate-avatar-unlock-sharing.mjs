import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };

const catalogueSource = read("src/features/avatar/avatar-catalogue-v1.js");
const unlockSource = read("avatar-unlock-celebration-v1.js");
const unlockCss = read("avatar-unlock-celebration-v1.css");
const bridgeSource = read("achievement-sharing-avatar-bridge-v1.js");
const loaderSource = read("profile-emblem-control.js");

new vm.Script(unlockSource, {filename:"avatar-unlock-celebration-v1.js"});
new vm.Script(bridgeSource, {filename:"achievement-sharing-avatar-bridge-v1.js"});
new vm.Script(loaderSource, {filename:"profile-emblem-control.js"});

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(catalogueSource, sandbox, {filename:"avatar-catalogue-v1.js"});
vm.runInContext(unlockSource, sandbox, {filename:"avatar-unlock-celebration-v1.js"});

const model = sandbox.SalitaAvatarModel;
const logic = sandbox.SalitaAvatarUnlockCelebrationLogic;
if (!model || logic?.version !== 2) fail("Unlock celebration logic v2 did not initialise");

const pending = {
  equippedAvatarId:"anahaw",
  ownedAvatarIds:["anahaw", "narra", "katmon"],
  shards:{narra:100, katmon:100},
  pendingUnlocks:[
    {avatarId:"narra", source:"level_milestone", level:10, unlockedAt:"2026-01-01T00:00:00.000Z", animationSeen:false},
    {avatarId:"katmon", source:"weekly_reward", weekKey:"2026-01-05", unlockedAt:"2026-01-08T00:00:00.000Z", animationSeen:false}
  ]
};

const first = logic.nextPending(pending, model);
if (first?.avatarId !== "narra") fail("The first unseen owned unlock must be selected");
const consumed = logic.consumePending(pending, first, model, "2026-01-10T00:00:00.000Z");
if (consumed.consumed?.avatarId !== "narra" || consumed.consumed.animationSeen !== true) {
  fail("Consumed unlock must be marked as seen");
}
if (consumed.collection.pendingUnlocks.length !== 1 || consumed.collection.pendingUnlocks[0].avatarId !== "katmon") {
  fail("Only the played unlock should leave the pending queue");
}
if (logic.nextPending(consumed.collection, model)?.avatarId !== "katmon") {
  fail("The next queued unlock must remain available");
}
const duplicates = {
  equippedAvatarId:"anahaw",
  ownedAvatarIds:["anahaw","narra"],
  shards:{narra:100},
  pendingUnlocks:[
    {avatarId:"narra",source:"level_milestone",level:10,animationSeen:false},
    {avatarId:"narra",source:"level_milestone",level:10,animationSeen:false}
  ]
};
const duplicateFirst = logic.nextPending(duplicates, model);
const duplicateConsumed = logic.consumePending(duplicates, duplicateFirst, model);
if (!duplicateConsumed.consumed || duplicateConsumed.collection.pendingUnlocks.length !== 0) {
  fail("Duplicate entries for one unlock must be consumed together");
}
const seenOnly = logic.nextPending({
  ownedAvatarIds:["narra"],
  pendingUnlocks:[{avatarId:"narra", source:"level_milestone", animationSeen:true}]
}, model);
if (seenOnly) fail("Seen unlocks must never replay");

for (const required of [
  "sq-avatar-unlock-layer",
  "View collection",
  "window.SalitaAvatarCollectionScreen",
  "salita:open-avatar-collection",
  "data-unlock-add",
  "finish(true)",
  "avatarUnlockHistory",
  "salita:avatar-unlock-acknowledged",
  "salita:avatar-unlock-animation-started",
  "salita:avatar-unlock-animation-finished",
  "let finished = false",
  "acknowledgePending(pendingEntry, item)",
  "window.SalitaPopupGovernor",
  "governor.enqueue",
  "acknowledge:() => acknowledgePending(pendingEntry, item)",
  "show:() => showUnlock(item, pendingEntry)",
  "acknowledgedBeforePopup:true"
]) {
  if (!unlockSource.includes(required)) fail(`Unlock runtime is missing ${required}`);
}
if (unlockSource.indexOf("acknowledge:() => acknowledgePending(pendingEntry, item)") > unlockSource.indexOf("show:() => showUnlock(item, pendingEntry)")) {
  fail("Unlock request must declare durable acknowledgement before rendering");
}
if (unlockSource.includes("flyer.animate") || unlockSource.includes("flyToCollection")) {
  fail("Unlock runtime must use the governed dialog flow rather than the retired flyer implementation");
}

for (const required of [
  ".sq-avatar-unlock-layer",
  ".sq-avatar-unlock-flyer",
  ".sq-avatar-unlock-arrived",
  "@media(prefers-reduced-motion:reduce)"
]) {
  if (!unlockCss.includes(required)) fail(`Unlock styles are missing ${required}`);
}

for (const required of [
  'const RELEASE = "5.5.11-explicit-sharing-router"',
  "profile?.avatarCollection?.equippedAvatarId",
  "window.SalitaAvatarModel?.get",
  "window.SalitaAvatarArtwork?.getAvatarImagePath",
  "window.getAvatarImagePath",
  "normaliseCollectionState",
  "decorateAvatarDetails",
  "dataset.shareAvatar",
  'button.textContent = "Share avatar"',
  "window.SalitaAchievementAvatarBridge = compatibilityApi",
  "openBadge(...args)",
  "openChest(...args)",
  "openAvatar(...args)",
  "openAvatarCase(...args)",
  "openLevel(...args)",
  "new MutationObserver",
  'document.addEventListener("salita:avatar-collection-changed"',
  'script.src = "./src/features/sharing/facebook-share-link-v1.js?v=1.0.0"',
  'new CustomEvent("salita:avatar-sharing-bridge-ready"',
  "compatibilityOnly:true",
  "transportOwner:false"
]) {
  if (!bridgeSource.includes(required)) fail(`Achievement avatar bridge is missing ${required}`);
}
for (const retired of ["LEGACY_AVATAR_PATTERN","RedirectedImage","HTMLCanvasElement.prototype.toBlob","interceptSharingClicks","stampAvatar","stampBadge"]) {
  if (bridgeSource.includes(retired)) fail(`Compatibility bridge must not retain retired transport ownership: ${retired}`);
}

if (!loaderSource.includes('const RELEASE_VERSION = "5.5.6"')) fail("Shared profile runtime release version is not 5.5.6");
for (const required of [
  "avatar-unlock-celebration-v1.css",
  "avatar-unlock-celebration-v1.js",
  "achievement-sharing-avatar-bridge-v1.js",
  'loadScript("unlock"',
  '"sharing",'
]) {
  if (!loaderSource.includes(required)) fail(`Shared loader is missing ${required}`);
}
const sharingRouterIndex = loaderSource.indexOf("achievement-sharing-router-v2.js");
const sharingBridgeIndex = loaderSource.indexOf("achievement-sharing-avatar-bridge-v1.js");
if (!(sharingRouterIndex >= 0 && sharingBridgeIndex > sharingRouterIndex)) {
  fail("Shared loader must install the central sharing router before the avatar compatibility bridge");
}

console.log("Avatar unlock and sharing validation passed: persisted once-only governed reveals, duplicate consumption, collection opening, compatibility-only avatar sharing decoration and centralized transport ownership.");
