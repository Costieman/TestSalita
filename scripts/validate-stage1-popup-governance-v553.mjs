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
  "src/features/interface/popup-governor-v1.js",
  "level-progression-v2.js",
  "level-up-mobile-safety-v552.js",
  "src/features/interface/level-up-mobile-safety-v552.js",
  "level-avatar-rewards-v1.js",
  "src/features/avatar/level-avatar-rewards-v1.js",
  "avatar-unlock-celebration-v1.js",
  "profile-emblem-control.js",
  "src/config/course-manifest.js",
  "service-worker.js"
];
for (const file of files) new vm.Script(read(file), {filename:file});

const compatibility = read("popup-governor-v1.js");
const governor = read("src/features/interface/popup-governor-v1.js");
if (!compatibility.includes('const TARGET = "./src/features/interface/popup-governor-v1.js?v=5.5.3"') ||
    !compatibility.includes("document.write") || !compatibility.includes("script.async = false")) {
  fail("Historical popup governor URL is not a compatibility-only ordered loader");
}

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

const rewards = read("src/features/avatar/level-avatar-rewards-v1.js");
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

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(read("src/config/course-manifest.js"), manifestContext, {filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed");

for (const [loaderFile, courseId] of [["app.html", "tagalog"], ["bisaya.html", "cebuano"]]) {
  const loader = read(loaderFile);
  requireMarkers(loader, [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ], `${loaderFile} modular entry point`);
  const scripts = courseManifest.courses[courseId]?.scripts;
  if (!Array.isArray(scripts)) fail(`${courseId} has no script manifest`);
  const governorIndex = scripts.indexOf("src/features/interface/popup-governor-v1.js?v=5.5.3");
  const levelIndex = scripts.indexOf("level-progression-v2.js?v=5.5.3");
  if (governorIndex < 0 || levelIndex < 0 || governorIndex > levelIndex) {
    fail(`${loaderFile} must load popup governance before level progression`);
  }
  if (!scripts.some(path => /^profile-emblem-control\.js\?v=5\.5\.[34]$/.test(path))) {
    fail(`${loaderFile} must load the governed profile emblem runtime`);
  }
  if (!scripts.includes("src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3")) {
    fail(`${loaderFile} is missing src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3`);
  }
}

const worker = read("service-worker.js");
requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./popup-governor-v1.js"',
  '"./src/features/interface/popup-governor-v1.js"',
  '"./level-avatar-rewards-v1.js"',
  '"./src/features/avatar/level-avatar-rewards-v1.js"',
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
  "src/features/interface/popup-governor-v1.js",
  "level-avatar-rewards-v1.js",
  "avatar-unlock-celebration-v1.js"
], "Mobile refresh page");

const notes = read("docs/releases/5.5.3-stage-1-popup-governance.md");
for (const marker of ["acknowledgement-before-render", "single popup governor", "placement", "canonical avatar catalogue", "r46"]) {
  if (!notes.toLowerCase().includes(marker.toLowerCase())) fail(`Stage 1 release notes are missing ${marker}`);
}

console.log("Stage 1 popup-governance validation passed: one queue, durable acknowledgement, actual-level gating, placement suppression and modular persistent-navigation cache refresh.");
