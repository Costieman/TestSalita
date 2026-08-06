import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing ${marker}`);
});

const files = [
  "popup-governor-v1.js",
  "level-progression-v2.js",
  "level-up-mobile-safety-v552.js",
  "level-avatar-rewards-v1.js",
  "avatar-unlock-celebration-v1.js",
  "profile-emblem-control.js",
  "service-worker.js"
];
for (const file of files) new vm.Script(read(file), {filename:file});

const governor = read("popup-governor-v1.js");
requireMarkers(governor, [
  'const RELEASE = "5.5.3"',
  "const queue = []",
  "const queuedKeys = new Set()",
  "await request.acknowledge()",
  "await request.show",
  "UNMANAGED_BLOCKERS",
  "placementIsUpdating",
  "window.SalitaPopupGovernor",
  "getAvatarImagePath"
], "Popup governor");
if (governor.indexOf("await request.acknowledge()") > governor.indexOf("await request.show")) {
  fail("Popup governor must acknowledge durably before rendering");
}

const levels = read("level-progression-v2.js");
requireMarkers(levels, [
  'const RELEASE = "5.5.3"',
  "levelUpsSeen",
  "sanitiseSystem",
  "acknowledge_before_level_popup",
  "window.SalitaPopupGovernor",
  'type:"level_up"',
  "system.pendingLevelUp=null",
  "lastCelebrationAcknowledgedAt"
], "Level progression");
if (levels.includes("markCelebrated(pending)")) fail("Level acknowledgement must not wait until animation completion");
if (levels.indexOf("acknowledge:()=>acknowledgeLevel") > levels.indexOf("show:()=>renderCelebration")) {
  fail("Level popup request must acknowledge before render");
}

const rewards = read("level-avatar-rewards-v1.js");
requireMarkers(rewards, [
  "actualCurrentLevel",
  "acknowledgedLevels",
  "repairFutureMilestones",
  "nonLevelEvidence",
  "placementSuppressed",
  "governed:true"
], "Milestone rewards");
if (rewards.includes("showRewardBurst")) fail("Milestone rewards must not create a competing burst popup");
if (rewards.includes('document.addEventListener("salita:placement-complete"')) fail("Placement completion must not create milestone rewards");

const unlock = read("avatar-unlock-celebration-v1.js");
requireMarkers(unlock, [
  "acknowledgedBeforePopup:true",
  "acknowledge:() => acknowledgePending",
  "show:() => showUnlock",
  "window.getAvatarImagePath",
  "dataset.retryCount",
  "sq-avatar-unlock-fallback",
  "milestoneIsEligible",
  "actualLevel"
], "Avatar unlock popup");
if (unlock.indexOf("acknowledge:() => acknowledgePending") > unlock.indexOf("show:() => showUnlock")) {
  fail("Avatar unlock must acknowledge before render");
}

for (const loaderFile of ["app.html", "bisaya.html"]) {
  const loader = read(loaderFile);
  const governorIndex = loader.indexOf("popup-governor-v1.js?v=5.5.3");
  const levelIndex = loader.indexOf("level-progression-v2.js?v=5.5.3");
  if (governorIndex < 0 || levelIndex < 0 || governorIndex > levelIndex) {
    fail(`${loaderFile} must load popup governance before level progression`);
  }
  if (!loader.includes("profile-emblem-control.js?v=5.5.3") && !loader.includes("profile-emblem-control.js?v=5.5.4")) {
    fail(`${loaderFile} must load the governed profile emblem runtime`);
  }
  requireMarkers(loader, ["level-up-mobile-safety-v552.js?v=5.5.3"], loaderFile);
}

const worker = read("service-worker.js");
requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-5-9-avatar-case-r51"',
  'const CACHE_NAME = "salita-quest-v5-5-10-persistent-navigation-r52"',
  '"./popup-governor-v1.js"',
  '"./level-avatar-rewards-v1.js"',
  '"./avatar-unlock-celebration-v1.js"',
  '"./avatar-case-v1.js"',
  '"./desktop-navigation-refinement.js"',
  "caches.match(event.request, {ignoreSearch:true})"
], "Service worker");
const refresh = read("mobile-refresh.html");
if (!refresh.includes('const RELEASE = "5.5.6"')) {
  fail("Mobile refresh page is missing the canonical governed release");
}
requireMarkers(refresh, [
  "popup-governor-v1.js",
  "level-avatar-rewards-v1.js",
  "avatar-unlock-celebration-v1.js"
], "Mobile refresh page");

const notes = read("docs/releases/5.5.3-stage-1-popup-governance.md");
for (const marker of ["acknowledgement-before-render", "single popup governor", "placement", "canonical avatar catalogue", "r46"]) {
  if (!notes.toLowerCase().includes(marker.toLowerCase())) fail(`Stage 1 release notes are missing ${marker}`);
}

console.log("Stage 1 popup-governance validation passed: one queue, durable acknowledgement, actual-level gating, placement suppression and persistent-navigation cache refresh.");
